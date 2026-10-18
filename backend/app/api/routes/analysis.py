import time
import json
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.schemas.analysis_schemas import PipelineRunResponse, PipelineStep
from app.services.ivp_service import IvpService

router = APIRouter(prefix="/analysis", tags=["Analysis Lab"])

PRESETS = [
    {
        "id": "nuclei_binarization",
        "name": "Nuclei Segmentation Pipeline",
        "description": "Standard workflow: Hematoxylin enhancement, contrast equalization, noise filtering, Otsu binarization, and morphological opening to isolate nuclear regions.",
        "steps": [
            {"step_id": "s1", "title": "Grayscale Luminance", "operation": "grayscale", "gray_mode": "luminance", "enabled": True},
            {"step_id": "s2", "title": "CLAHE Contrast Boost", "operation": "clahe", "clahe_clip_limit": 2.5, "clahe_tile_grid": 8, "enabled": True},
            {"step_id": "s3", "title": "Gaussian Smoothing", "operation": "gaussian_blur", "gaussian_kernel": 5, "gaussian_sigma": 1.2, "enabled": True},
            {"step_id": "s4", "title": "Otsu Binarization", "operation": "otsu_threshold", "threshold_invert": True, "enabled": True},
            {"step_id": "s5", "title": "Morphological Opening", "operation": "morphology", "morph_op": "opening", "morph_kernel_shape": "ellipse", "morph_kernel_size": 3, "morph_iterations": 1, "enabled": True}
        ]
    },
    {
        "id": "edge_detection",
        "name": "Nuclear Membrane Contours",
        "description": "Highlights nuclear envelope boundaries using edge-preserving bilateral filtering followed by Canny hysteresis edge detection.",
        "steps": [
            {"step_id": "s1", "title": "Grayscale Luminance", "operation": "grayscale", "gray_mode": "luminance", "enabled": True},
            {"step_id": "s2", "title": "Bilateral Edge Filter", "operation": "bilateral_filter", "bilateral_d": 9, "bilateral_sigma_color": 75.0, "bilateral_sigma_space": 75.0, "enabled": True},
            {"step_id": "s3", "title": "Canny Edge Detection", "operation": "canny", "canny_thresh1": 50.0, "canny_thresh2": 150.0, "enabled": True}
        ]
    },
    {
        "id": "contrast_enhanced",
        "name": "Deep Contrast Inspection",
        "description": "Adaptive histogram enhancement to distinguish subtle chromatic transitions in chromatin condensation.",
        "steps": [
            {"step_id": "s1", "title": "CLAHE Color Enhancement", "operation": "clahe", "clahe_clip_limit": 3.0, "clahe_tile_grid": 8, "enabled": True},
            {"step_id": "s2", "title": "Median Despeckle", "operation": "median_blur", "median_kernel": 3, "enabled": True}
        ]
    }
]

@router.get("/presets")
def get_presets():
    """Returns curated educational pipeline presets for histopathology analysis."""
    return {"presets": PRESETS}

@router.post("/pipeline", response_model=PipelineRunResponse)
async def run_analysis_pipeline(
    file: UploadFile = File(..., description="Histopathology image tile"),
    pipeline_json: str = Form(..., description="JSON serialized array of PipelineStep objects")
):
    """
    Executes a multi-stage sequential image-processing pipeline entirely in RAM.
    Provides intermediate feedback and quantitative nuclear candidate counts.
    """
    try:
        steps_raw = json.loads(pipeline_json)
        steps = [PipelineStep(**s) for s in steps_raw]
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Invalid pipeline configuration: {str(e)}")

    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Empty image payload.")

    try:
        current_img = IvpService.validate_and_decode(contents)
    except ValueError as val_err:
        raise HTTPException(status_code=400, detail=str(val_err))

    original_img = current_img.copy()
    original_metrics = IvpService.calculate_metrics(original_img)

    intermediate_results = []
    total_start = time.perf_counter()

    for step in steps:
        if not step.enabled:
            continue
        
        t0 = time.perf_counter()
        current_img, note = IvpService.apply_operation(current_img, step)
        t1 = time.perf_counter()

        step_latency = (t1 - t0) * 1000.0
        step_metrics = IvpService.calculate_metrics(current_img, reference_np=original_img, execution_time_ms=step_latency)

        intermediate_results.append({
            "step_id": step.step_id,
            "title": step.title,
            "operation": step.operation,
            "note": note,
            "latency_ms": round(step_latency, 2),
            "mean_intensity": step_metrics.mean_intensity,
            "shannon_entropy": step_metrics.shannon_entropy
        })

    total_latency = (time.perf_counter() - total_start) * 1000.0
    final_metrics = IvpService.calculate_metrics(current_img, reference_np=original_img, execution_time_ms=total_latency)
    final_base64 = IvpService.encode_to_base64(current_img, format="png")

    disclaimer = (
        "Educational Research Notice: Connected component estimates and threshold binarization "
        "demonstrate algorithmic image processing principles and are not clinically validated diagnostic segmentation masks."
    )

    return PipelineRunResponse(
        success=True,
        final_image_base64=f"data:image/png;base64,{final_base64}",
        intermediate_steps=intermediate_results,
        final_metrics=final_metrics,
        original_metrics=original_metrics,
        nuclei_candidates_detected=final_metrics.candidate_nuclei_count,
        scientific_disclaimer=disclaimer
    )
