import base64
import cv2
import numpy as np
from fastapi import APIRouter, File, HTTPException, UploadFile
from app.config import settings
from app.services.model_service import ModelService
from app.services.crop_prediction_service import CropPredictionService, CLASS_LABELS, FEATURE_ORDER
from app.services.nucleus_service import NucleusService

router = APIRouter(prefix="/ai", tags=["AI Insights & Historical Models"])

@router.get("/metrics")
def get_ai_metrics():
    """Returns verified historical academic benchmarks and model asset status."""
    return ModelService.get_historical_evaluation()

@router.get("/model-status")
def get_model_status():
    """Returns filesystem presence and metadata for required joblib model files."""
    return ModelService.get_models_status()

@router.post("/predict")
async def predict_image(file: UploadFile = File(..., description="Histopathology image for experimental whole-image analysis")):
    """Experimental candidate detection + per-candidate model inference.

    This is deliberately labelled experimental: connected-component candidates are not
    validated instance segmentation, so counts and predictions must not be treated as diagnostic.
    """
    if file.content_type not in settings.ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=415, detail={"error": "UNSUPPORTED_MEDIA_TYPE", "message": "Upload a PNG, JPEG, TIFF or BMP image."})
    data = await file.read(settings.MAX_UPLOAD_SIZE_BYTES + 1)
    if len(data) > settings.MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(status_code=413, detail={"error": "FILE_TOO_LARGE", "message": "File exceeds the upload limit."})
    image_bgr = cv2.imdecode(np.frombuffer(data, np.uint8), cv2.IMREAD_COLOR)
    if image_bgr is None:
        raise HTTPException(status_code=400, detail={"error": "INVALID_IMAGE", "message": "The file could not be decoded as an image."})
    height, width = image_bgr.shape[:2]
    if max(height, width) > settings.MAX_IMAGE_DIMENSION:
        scale = settings.MAX_IMAGE_DIMENSION / max(height, width)
        image_bgr = cv2.resize(image_bgr, (max(1, int(width * scale)), max(1, int(height * scale))), interpolation=cv2.INTER_AREA)
    rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
    try:
        candidates = NucleusService.extract_candidates(rgb)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail={"error": "CANDIDATE_DETECTION_FAILED", "message": str(exc)}) from exc

    # Bound work and response size for large tiles.
    candidates = candidates[:300]
    dt_model = CropPredictionService._load_dt()
    cnn_model = CropPredictionService._load_cnn()
    dt_error = CropPredictionService._dt_error
    cnn_error = CropPredictionService._cnn_error
    dt_names = getattr(dt_model, "feature_names_in_", None) if dt_model is not None else None
    dt_schema_ok = dt_model is not None and (dt_names is None or list(dt_names) == FEATURE_ORDER)
    if dt_model is not None and not dt_schema_ok:
        dt_error = f"Decision Tree feature order mismatch: {list(dt_names)}"

    annotated = image_bgr.copy()
    class_counts = {name: 0 for name in CLASS_LABELS}
    results = []
    for candidate in candidates:
        x, y, w, h = candidate.bbox
        # Draw candidate contour/bounding box; detector is experimental.
        cv2.rectangle(annotated, (x, y), (x + w, y + h), (0, 220, 255), 1)
        row = {"id": candidate.candidate_id, "bbox": [x, y, w, h], "features": dict(zip(FEATURE_ORDER, candidate.features.as_ordered_vector()))}
        crop = image_bgr[y:y+h, x:x+w]
        if dt_model is not None and dt_schema_ok:
            try:
                import pandas as pd
                vector = pd.DataFrame([candidate.features.as_ordered_vector()], columns=FEATURE_ORDER)
                pred = int(dt_model.predict(vector)[0])
                # PanNuke class IDs are 1..5. Unknown labels are reported, not remapped.
                if pred in range(1, 6):
                    row["decision_tree"] = {"predicted": CLASS_LABELS[pred - 1]}
                    class_counts[CLASS_LABELS[pred - 1]] += 1
                else:
                    row["decision_tree"] = {"unavailable": True, "reason": f"Unknown model class id {pred}"}
            except Exception as exc:  # noqa: BLE001
                row["decision_tree"] = {"unavailable": True, "reason": f"Inference failed: {type(exc).__name__}"}
        else:
            row["decision_tree"] = {"unavailable": True, "reason": dt_error or "Model unavailable or feature schema not verified."}
        if cnn_model is not None:
            try:
                rgb_crop = cv2.cvtColor(crop, cv2.COLOR_BGR2RGB)
                side = max(16, min(128, max(rgb_crop.shape[:2])))
                # Pad candidate to square before resizing; preserve the detected object as much as possible.
                ch, cw = rgb_crop.shape[:2]
                square_side = max(ch, cw)
                padded = np.full((square_side, square_side, 3), 255, dtype=np.uint8)
                oy, ox = (square_side - ch)//2, (square_side - cw)//2
                padded[oy:oy+ch, ox:ox+cw] = rgb_crop
                rgb32 = cv2.resize(padded, (32, 32), interpolation=cv2.INTER_AREA)
                probs = np.asarray(cnn_model.predict(rgb32[None].astype("float32") / 255.0, verbose=0))[0]
                if len(probs) == 5:
                    pred_idx = int(np.argmax(probs))
                    row["cnn"] = {"predicted": CLASS_LABELS[pred_idx], "confidence": float(probs[pred_idx]), "probabilities": dict(zip(CLASS_LABELS, [float(v) for v in probs]))}
                else:
                    row["cnn"] = {"unavailable": True, "reason": f"Expected 5 outputs; received {len(probs)}."}
            except Exception as exc:  # noqa: BLE001
                row["cnn"] = {"unavailable": True, "reason": f"Inference failed: {type(exc).__name__}"}
        else:
            row["cnn"] = {"unavailable": True, "reason": cnn_error or "CNN unavailable."}
        results.append(row)

    ok, encoded = cv2.imencode(".jpg", annotated, [int(cv2.IMWRITE_JPEG_QUALITY), 85])
    if not ok:
        raise HTTPException(status_code=500, detail={"error": "ANNOTATION_FAILED", "message": "Could not encode the annotated image."})
    return {
        "status": "experimental", "uploaded_filename": file.filename,
        "image_size": [int(image_bgr.shape[1]), int(image_bgr.shape[0])],
        "candidate_count": len(candidates), "candidate_limit": 300,
        "classes": CLASS_LABELS, "class_counts": class_counts,
        "decision_tree_available": bool(dt_model is not None and dt_schema_ok),
        "cnn_available": cnn_model is not None,
        "decision_tree_reason": dt_error, "cnn_reason": cnn_error,
        "annotated_image": "data:image/jpeg;base64," + base64.b64encode(encoded.tobytes()).decode("ascii"),
        "candidates": results,
        "warning": "Experimental color/stain threshold candidates, not validated nucleus instance segmentation. Overlapping, missed, or non-nuclear regions may be included. Predictions and counts are research-only and not diagnostic.",
        "feature_order": FEATURE_ORDER,
    }


@router.get("/crop-model-status")
def get_crop_model_status():
    """Availability of the single-nucleus-crop models (CNN + Decision Tree) and their reported test metrics."""
    return CropPredictionService.status()


@router.post("/predict-crop")
async def predict_nucleus_crop(file: UploadFile = File(..., description="Image of ONE nucleus, centred (e.g. a 32x32 crop)")):
    """
    Classifies a single nucleus-centred crop with the CNN and the Decision Tree (Neoplastic, Inflammatory, Connective, Dead, Epithelial).
    This is NOT whole-image classification: whole tissue tiles are still rejected by /predict.
    The image is centre-cropped to a square and resized to 32x32, as in training.
    """
    if file.content_type not in settings.ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=415, detail={"error": "UNSUPPORTED_MEDIA_TYPE", "message": "Upload a PNG, JPEG, TIFF or BMP image."})
    data = await file.read(settings.MAX_UPLOAD_SIZE_BYTES + 1)
    if len(data) > settings.MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(status_code=413, detail={"error": "FILE_TOO_LARGE", "message": "File exceeds the upload limit."})
    image = cv2.imdecode(np.frombuffer(data, np.uint8), cv2.IMREAD_COLOR)
    if image is None:
        raise HTTPException(status_code=400, detail={"error": "INVALID_IMAGE", "message": "The file could not be decoded as an image."})
    h, w = image.shape[:2]
    if max(h, w) > 128:
        raise HTTPException(status_code=422, detail={
            "error": "NOT_A_NUCLEUS_CROP",
            "message": f"The image is {w}x{h}px. This endpoint classifies a single nucleus crop (up to 128x128px, ideally 32x32). "
                       "Whole tissue tiles are not supported because no validated nucleus detector is linked."})
    try:
        return CropPredictionService.predict(image)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail={"error": "INVALID_CROP", "message": str(exc)}) from exc
