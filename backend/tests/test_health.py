import io
import numpy as np
from PIL import Image
from fastapi.testclient import TestClient
from app.main import app
from app.config import settings
from app.services.model_service import ModelService

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "opencv_version" in data["runtime"]
    assert "limits" in data
    assert data["limits"]["max_upload_size_mb"] == 15
    assert "models_status" in data
    assert data["models_status"]["all_loaded"] == all(data["models_status"]["models"].values())

def test_ai_metrics_endpoint():
    response = client.get("/api/ai/metrics")
    assert response.status_code == 200
    data = response.json()
    assert "historical_benchmarks" in data
    dt = data["historical_benchmarks"]["decision_tree"]
    assert dt["reported_accuracy_percent"] == 49.83
    assert len(dt["features"]) == 8
    
    # Verify the 8 features
    feature_names = [f["name"] for f in dt["features"]]
    assert "gray_mean" in feature_names
    assert "circularity" in feature_names

def test_model_status_distinguishes_presence_from_loading():
    response = client.get("/api/ai/model-status")
    assert response.status_code == 200
    data = response.json()
    assert data["all_models_present"] is True
    assert data["all_models_loaded"] is True
    assert set(data["models"]) == {"decision_tree", "feature_scaler", "kmeans"}
    for model in data["models"].values():
        assert model["is_present"] is True
        assert model["is_loaded"] is True
        assert model["size_bytes"] > 0
    decision_tree = ModelService._loaded_models["decision_tree"]
    assert list(decision_tree.feature_names_in_) == [
        "gray_mean",
        "gray_std",
        "red_mean",
        "green_mean",
        "blue_mean",
        "area",
        "perimeter",
        "circularity",
    ]
    assert decision_tree.n_features_in_ == 8
    assert ModelService._loaded_models["feature_scaler"].n_features_in_ == 8
    assert ModelService._loaded_models["kmeans"].n_features_in_ == 8
    assert data["models"]["decision_tree"]["input_schema_validated"] is True
    assert data["models"]["feature_scaler"]["input_schema_validated"] is False
    assert "feature order cannot be verified" in data["models"]["feature_scaler"]["schema_validation_error"]

def test_model_status_reports_missing_and_invalid_files(tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "MODELS_DIR", tmp_path)

    missing = ModelService.get_models_status()
    assert missing["all_models_present"] is False
    assert missing["all_models_loaded"] is False
    assert all(not model["is_present"] for model in missing["models"].values())

    for filename in ModelService.EXPECTED_MODELS.values():
        (tmp_path / filename).write_bytes(b"not a serialized model")

    invalid = ModelService.get_models_status()
    assert invalid["all_models_present"] is True
    assert invalid["all_models_loaded"] is False
    assert all(model["is_present"] for model in invalid["models"].values())
    assert all(not model["is_loaded"] and model["load_error"] for model in invalid["models"].values())

def test_ai_predict_returns_experimental_result():
    image = Image.fromarray(np.full((32, 32, 3), 255, dtype=np.uint8), mode="RGB")
    image_bytes = io.BytesIO()
    image.save(image_bytes, format="PNG")

    response = client.post(
        "/api/ai/predict",
        files={"file": ("biopsy.png", image_bytes.getvalue(), "image/png")},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "experimental"
    assert body["candidate_count"] == 0
    assert body["candidates"] == []
    assert "not diagnostic" in body["warning"].lower()
