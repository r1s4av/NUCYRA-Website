import os
from pathlib import Path
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseModel):
    PROJECT_NAME: str = "NUCYRA - AI Histopathology Analysis Platform"
    API_V1_PREFIX: str = "/api"
    BACKEND_HOST: str = os.getenv("BACKEND_HOST", "127.0.0.1")
    BACKEND_PORT: int = int(os.getenv("BACKEND_PORT", "8000"))
    
    # CORS: Allow local frontend dev server
    ALLOWED_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    
    # Upload limits and validation
    MAX_UPLOAD_SIZE_BYTES: int = 15 * 1024 * 1024  # 15 MB
    MAX_IMAGE_DIMENSION: int = 4096                # Max width or height in px
    ALLOWED_CONTENT_TYPES: set[str] = {
        "image/png",
        "image/jpeg",
        "image/jpg",
        "image/tiff",
        "image/bmp",
    }
    
    # Models directory
    MODELS_DIR: Path = BASE_DIR / "models"

settings = Settings()
