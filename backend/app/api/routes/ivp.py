import time
import json
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.schemas.ivp_schemas import IvpStepConfig, ProcessImageResponse
from app.services.ivp_service import IvpService

router = APIRouter(prefix="/ivp", tags=["Image Processing Studio"])

@router.post("/process", response_model=ProcessImageResponse)
async def process_single_operation(
    file: UploadFile = File(..., description="Histopathology image file (PNG, JPEG, TIFF, BMP)"),
    config_json: str = Form(..., description="Serialized JSON string of IvpStepConfig")
):
    """
    Applies a verified OpenCV image-processing operation to an in-memory uploaded image.
    Never persists uploaded data to disk.
    Computes mathematical metrics: mean, std, contrast, entropy, and PSNR vs reference.
    """
    try:
        config_dict = json.loads(config_json)
        config = IvpStepConfig(**config_dict)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Malformed operation configuration: {str(e)}")

    # Read uploaded bytes into RAM
    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Empty file payload received.")

    try:
        original_bgr = IvpService.validate_and_decode(contents)
    except ValueError as val_err:
        raise HTTPException(status_code=400, detail=str(val_err))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to decode image data.")

    # Calculate baseline original metrics
    original_metrics = IvpService.calculate_metrics(original_bgr)

    # Execute processing and measure wall-clock latency
    t0 = time.perf_counter()
    try:
        processed_img, scientific_note = IvpService.apply_operation(original_bgr, config)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image processing algorithm failed: {str(e)}")
    t1 = time.perf_counter()
    latency_ms = (t1 - t0) * 1000.0

    # Calculate processed metrics and PSNR against the original
    processed_metrics = IvpService.calculate_metrics(
        processed_img, 
        reference_np=original_bgr, 
        execution_time_ms=latency_ms
    )

    # Encode to base64
    base64_img = IvpService.encode_to_base64(processed_img, format="png")

    return ProcessImageResponse(
        success=True,
        image_base64=f"data:image/png;base64,{base64_img}",
        format="png",
        operation_applied=config.operation,
        metrics=processed_metrics,
        reference_metrics=original_metrics,
        scientific_note=scientific_note
    )
