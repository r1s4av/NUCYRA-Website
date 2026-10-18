from typing import Optional, Literal
from pydantic import BaseModel, Field

class ImageMetrics(BaseModel):
    width: int
    height: int
    channels: int
    mean_intensity: float = Field(..., description="Mean pixel luminance [0-255]")
    std_intensity: float = Field(..., description="Root-mean-square (RMS) contrast")
    michelson_contrast: float = Field(..., description="(I_max - I_min) / (I_max + I_min)")
    shannon_entropy: float = Field(..., description="Shannon entropy in bits H = -sum(p * log2(p))")
    histogram: list[int] = Field(..., description="256-bin luminance histogram distribution")
    rgb_histograms: Optional[dict[str, list[int]]] = Field(None, description="RGB channel histograms if color")
    foreground_ratio: Optional[float] = Field(None, description="Ratio of non-zero pixels (for binary masks)")
    candidate_nuclei_count: Optional[int] = Field(None, description="Estimated 8-connected components with nuclear area bounds")
    psnr_db: Optional[float] = Field(None, description="Peak Signal-to-Noise Ratio vs reference original image [dB]")
    execution_time_ms: float = Field(..., description="Backend algorithm latency in milliseconds")

class IvpStepConfig(BaseModel):
    operation: Literal[
        "grayscale",
        "clahe",
        "equalize_hist",
        "gaussian_blur",
        "median_blur",
        "bilateral_filter",
        "otsu_threshold",
        "adaptive_threshold",
        "morphology",
        "sobel",
        "canny",
    ]
    # Parameters for specific operations (optional with defaults)
    gray_mode: Literal["luminance", "mean", "hematoxylin_approx"] = "luminance"
    clahe_clip_limit: float = Field(2.0, ge=0.5, le=20.0)
    clahe_tile_grid: int = Field(8, ge=2, le=32)
    gaussian_kernel: int = Field(5, ge=1, le=31)
    gaussian_sigma: float = Field(1.5, ge=0.1, le=10.0)
    median_kernel: int = Field(5, ge=3, le=31)
    bilateral_d: int = Field(9, ge=1, le=25)
    bilateral_sigma_color: float = Field(75.0, ge=1.0, le=200.0)
    bilateral_sigma_space: float = Field(75.0, ge=1.0, le=200.0)
    threshold_invert: bool = False
    adaptive_method: Literal["gaussian", "mean"] = "gaussian"
    adaptive_block_size: int = Field(11, ge=3, le=99)
    adaptive_c: float = Field(2.0, ge=-20.0, le=20.0)
    morph_op: Literal["opening", "closing", "erosion", "dilation", "gradient", "tophat"] = "opening"
    morph_kernel_shape: Literal["ellipse", "rect", "cross"] = "ellipse"
    morph_kernel_size: int = Field(3, ge=1, le=25)
    morph_iterations: int = Field(1, ge=1, le=10)
    canny_thresh1: float = Field(50.0, ge=0.0, le=255.0)
    canny_thresh2: float = Field(150.0, ge=0.0, le=255.0)
    sobel_ksize: int = Field(3, ge=1, le=7)

class ProcessImageResponse(BaseModel):
    success: bool
    image_base64: str
    format: str = "png"
    operation_applied: str
    metrics: ImageMetrics
    reference_metrics: Optional[ImageMetrics] = None
    scientific_note: Optional[str] = None
