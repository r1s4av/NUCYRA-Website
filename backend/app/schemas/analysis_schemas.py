from typing import Optional
from pydantic import BaseModel, Field
from app.schemas.ivp_schemas import IvpStepConfig, ImageMetrics

class PipelineStep(IvpStepConfig):
    enabled: bool = True
    step_id: str
    title: str

class PipelineRunRequest(BaseModel):
    steps: list[PipelineStep]

class PipelineRunResponse(BaseModel):
    success: bool
    final_image_base64: str
    intermediate_steps: list[dict]
    final_metrics: ImageMetrics
    original_metrics: ImageMetrics
    nuclei_candidates_detected: Optional[int] = None
    scientific_disclaimer: str
