from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import settings
from app.api.routes import health, ivp, analysis, ai

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Research-grade biomedical image processing and machine learning analysis platform for digital histopathology.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration strictly allowing local frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# Safe global exception handler: never leak tracebacks or file paths to user
@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "error": "INTERNAL_SERVER_ERROR",
            "message": "An error occurred during biomedical image processing.",
            "detail": str(exc)
        }
    )

# Mount routes under /api
app.include_router(health.router, prefix=settings.API_V1_PREFIX)
app.include_router(ivp.router, prefix=settings.API_V1_PREFIX)
app.include_router(analysis.router, prefix=settings.API_V1_PREFIX)
app.include_router(ai.router, prefix=settings.API_V1_PREFIX)

@app.get("/")
def root():
    return {
        "platform": settings.PROJECT_NAME,
        "status": "operational",
        "docs_url": "/docs",
        "health_check": f"{settings.API_V1_PREFIX}/health"
    }
