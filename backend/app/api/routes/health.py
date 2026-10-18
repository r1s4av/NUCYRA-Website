from fastapi import APIRouter
import cv2
import numpy as np
import sklearn
from app.config import settings
from app.services.model_service import ModelService

router = APIRouter(prefix="/health", tags=["Health & Status"])

@router.get("")
def get_health_status():
    """Returns platform operational health, runtime versions, and model availability."""
    models_info = ModelService.get_models_status()
    
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "runtime": {
            "opencv_version": cv2.__version__,
            "numpy_version": np.__version__,
            "scikit_learn_version": sklearn.__version__,
        },
        "limits": {
            "max_upload_size_mb": settings.MAX_UPLOAD_SIZE_BYTES // (1024 * 1024),
            "max_image_dimension_px": settings.MAX_IMAGE_DIMENSION,
            "allowed_formats": list(settings.ALLOWED_CONTENT_TYPES)
        },
        "models_status": {
            "all_loaded": models_info["all_models_loaded"],
            "models": {
                name: data["is_loaded"]
                for name, data in models_info["models"].items()
            }
        }
    }
