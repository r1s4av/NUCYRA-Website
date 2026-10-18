import io
import json
import pytest
import cv2
import numpy as np
from PIL import Image
from fastapi.testclient import TestClient
from app.main import app
from app.services.ivp_service import IvpService
from app.services.nucleus_service import NucleusService
from app.schemas.ivp_schemas import IvpStepConfig

client = TestClient(app)

def create_synthetic_test_image_bytes(width=128, height=128) -> bytes:
    """Creates a temporary in-memory PNG image simulating an H&E cell field for tests."""
    # Create image with violet/pink circles simulating nuclei
    arr = np.ones((height, width, 3), dtype=np.uint8) * 235  # light background
    # Add a few dark purple disks
    y, x = np.ogrid[:height, :width]
    mask1 = (x - 40)**2 + (y - 40)**2 <= 15**2
    mask2 = (x - 85)**2 + (y - 75)**2 <= 18**2
    arr[mask1] = [120, 40, 90]   # dark violet/purple (BGR in OpenCV format)
    arr[mask2] = [135, 50, 105]
    
    img = Image.fromarray(arr, mode="RGB")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()

def test_ivp_service_validation():
    # 1. Invalid bytes
    with pytest.raises(ValueError, match="Corrupted or invalid image data"):
        IvpService.validate_and_decode(b"not an image file")

    # 2. Valid synthetic image
    valid_bytes = create_synthetic_test_image_bytes()
    decoded = IvpService.validate_and_decode(valid_bytes)
    assert decoded.shape == (128, 128, 3)

def test_ivp_operations_execution():
    test_bytes = create_synthetic_test_image_bytes()
    img_bgr = IvpService.validate_and_decode(test_bytes)

    # 1. Grayscale
    cfg_gray = IvpStepConfig(operation="grayscale", gray_mode="luminance")
    out_gray, note = IvpService.apply_operation(img_bgr, cfg_gray)
    assert out_gray.shape == (128, 128)
    assert "luminance" in note.lower()

    # 2. CLAHE
    cfg_clahe = IvpStepConfig(operation="clahe", clahe_clip_limit=3.0)
    out_clahe, _ = IvpService.apply_operation(img_bgr, cfg_clahe)
    assert out_clahe.shape == (128, 128, 3)

    # 3. Gaussian Blur
    cfg_blur = IvpStepConfig(operation="gaussian_blur", gaussian_kernel=5, gaussian_sigma=1.5)
    out_blur, _ = IvpService.apply_operation(img_bgr, cfg_blur)
    assert out_blur.shape == (128, 128, 3)

    # 4. Otsu Threshold
    cfg_otsu = IvpStepConfig(operation="otsu_threshold", threshold_invert=True)
    out_otsu, _ = IvpService.apply_operation(out_gray, cfg_otsu)
    assert out_otsu.shape == (128, 128)
    assert set(np.unique(out_otsu)).issubset({0, 255})

    # 5. Morphology
    cfg_morph = IvpStepConfig(operation="morphology", morph_op="opening", morph_kernel_size=3)
    out_morph, _ = IvpService.apply_operation(out_otsu, cfg_morph)
    assert out_morph.shape == (128, 128)

    # 6. Canny
    cfg_canny = IvpStepConfig(operation="canny", canny_thresh1=50, canny_thresh2=150)
    out_canny, _ = IvpService.apply_operation(out_gray, cfg_canny)
    assert out_canny.shape == (128, 128)

def test_metrics_calculation():
    test_bytes = create_synthetic_test_image_bytes()
    img_bgr = IvpService.validate_and_decode(test_bytes)
    metrics = IvpService.calculate_metrics(img_bgr, reference_np=img_bgr)
    
    assert metrics.width == 128
    assert metrics.height == 128
    assert metrics.channels == 3
    assert 0.0 <= metrics.mean_intensity <= 255.0
    assert metrics.std_intensity > 0.0
    assert 0.0 <= metrics.shannon_entropy <= 8.0
    assert len(metrics.histogram) == 256
    # Identical image PSNR should be 100 dB (perfect identity capped)
    assert metrics.psnr_db == 100.0

def test_ivp_process_api_endpoint():
    img_bytes = create_synthetic_test_image_bytes()
    config = {"operation": "clahe", "clahe_clip_limit": 2.5, "clahe_tile_grid": 8}
    
    response = client.post(
        "/api/ivp/process",
        files={"file": ("test.png", img_bytes, "image/png")},
        data={"config_json": json.dumps(config)}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["image_base64"].startswith("data:image/png;base64,")
    assert "metrics" in data
    assert data["metrics"]["mean_intensity"] > 0
    assert "scientific_note" in data

def test_analysis_pipeline_api_endpoint():
    img_bytes = create_synthetic_test_image_bytes()
    steps = [
        {"step_id": "1", "title": "Grayscale", "operation": "grayscale", "enabled": True},
        {"step_id": "2", "title": "Otsu", "operation": "otsu_threshold", "threshold_invert": True, "enabled": True}
    ]
    
    response = client.post(
        "/api/analysis/pipeline",
        files={"file": ("biopsy.png", img_bytes, "image/png")},
        data={"pipeline_json": json.dumps(steps)}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert len(data["intermediate_steps"]) == 2
    assert "final_metrics" in data
    assert "scientific_disclaimer" in data


def test_nucleus_features_use_rgb_pixels_and_contour_perimeter():
    rgb = np.zeros((12, 12, 3), dtype=np.uint8)
    rgb[:] = [20, 80, 140]
    mask = np.zeros((12, 12), dtype=np.uint8)
    mask[3:7, 4:8] = 1

    features = NucleusService.features_from_mask(rgb, mask)

    expected_gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)[mask != 0]
    assert features.gray_mean == float(np.mean(expected_gray))
    assert features.gray_std == float(np.std(expected_gray))
    assert (features.red_mean, features.green_mean, features.blue_mean) == (20, 80, 140)
    assert features.area == 16
    assert features.perimeter == 12
    assert features.circularity == pytest.approx(4 * np.pi * 16 / 12**2)
    assert features.as_ordered_vector() == (
        features.gray_mean,
        features.gray_std,
        20,
        80,
        140,
        16,
        12,
        features.circularity,
    )


def test_candidate_detection_is_separate_from_instance_annotations():
    rgb = np.full((96, 96, 3), 245, dtype=np.uint8)
    y, x = np.ogrid[:96, :96]
    first = (x - 28) ** 2 + (y - 34) ** 2 <= 8**2
    second = (x - 68) ** 2 + (y - 62) ** 2 <= 10**2
    rgb[first | second] = [75, 30, 85]
    instance_map = np.zeros((96, 96), dtype=np.int32)
    instance_map[first] = 101
    instance_map[second] = 205

    candidates = NucleusService.extract_candidates(rgb)
    annotated = NucleusService.extract_annotated_instance_features(
        rgb, instance_map
    )

    assert len(candidates) == 2
    assert all(candidate.features.area == np.count_nonzero(candidate.mask) for candidate in candidates)
    assert set(annotated) == {101, 205}
    assert all(not hasattr(candidate, "instance_id") for candidate in candidates)


def test_nucleus_feature_extraction_rejects_invalid_masks():
    rgb = np.zeros((8, 8, 3), dtype=np.uint8)
    with pytest.raises(ValueError, match="at least one foreground pixel"):
        NucleusService.features_from_mask(rgb, np.zeros((8, 8), dtype=np.uint8))
    with pytest.raises(ValueError, match="matching the RGB image dimensions"):
        NucleusService.features_from_mask(rgb, np.ones((7, 8), dtype=np.uint8))
