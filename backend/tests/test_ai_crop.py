import io

import numpy as np
import pytest
from fastapi.testclient import TestClient
from PIL import Image

from app.config import settings
from app.main import app
from app.services.crop_prediction_service import CLASS_LABELS, DT_FILE, CropPredictionService

client = TestClient(app)


def _png(arr: np.ndarray) -> bytes:
    buf = io.BytesIO()
    Image.fromarray(arr).save(buf, format="PNG")
    return buf.getvalue()


def _crop(seed=0, size=32):
    rng = np.random.default_rng(seed)
    img = np.full((size, size, 3), 220, np.uint8)
    img[8:24, 8:24] = (110, 60, 140)
    return np.clip(img + rng.integers(-10, 10, img.shape), 0, 255).astype(np.uint8)


def test_whole_image_endpoint_returns_experimental_analysis():
    r = client.post("/api/ai/predict", files={"file": ("tile.png", _png(_crop(size=256)), "image/png")})
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "experimental"
    assert "candidate_count" in body and "annotated_image" in body
    assert body["feature_order"] == ["gray_mean", "gray_std", "red_mean", "green_mean", "blue_mean", "area", "perimeter", "circularity"]
    assert "not validated" in body["warning"].lower()


def test_large_image_rejected_as_not_a_crop():
    r = client.post("/api/ai/predict-crop", files={"file": ("tile.png", _png(_crop(size=256)), "image/png")})
    assert r.status_code == 422 and r.json()["detail"]["error"] == "NOT_A_NUCLEUS_CROP"


def test_non_image_rejected():
    r = client.post("/api/ai/predict-crop", files={"file": ("x.png", b"not an image", "image/png")})
    assert r.status_code == 400


def test_wrong_media_type_rejected():
    r = client.post("/api/ai/predict-crop", files={"file": ("x.txt", b"hello", "text/plain")})
    assert r.status_code == 415


def test_feature_extraction_is_finite_and_ordered():
    f = CropPredictionService.extract_features(_crop())
    assert list(f)[:3] == ["gray_mean", "gray_std", "red_mean"] and all(np.isfinite(list(f.values())))
    assert 0 < f["area"] <= 32 * 32


@pytest.mark.skipif(not (settings.MODELS_DIR / DT_FILE).is_file(), reason="Decision Tree file not present")
def test_prediction_returns_probabilities():
    CropPredictionService.reset_cache()
    r = client.post("/api/ai/predict-crop", files={"file": ("c.png", _png(_crop()), "image/png")})
    assert r.status_code == 200
    body = r.json()
    assert body["classes"] == CLASS_LABELS and "disclaimer" in body
    dt = body["decision_tree"]
    assert abs(sum(dt["probabilities"].values()) - 1.0) < 1e-6
    if not body["cnn"].get("unavailable"):
        assert abs(sum(body["cnn"]["probabilities"].values()) - 1.0) < 1e-4


def test_status_endpoint_lists_both_models():
    r = client.get("/api/ai/crop-model-status")
    assert r.status_code == 200 and {"cnn", "decision_tree", "reported_test_metrics"} <= set(r.json())
