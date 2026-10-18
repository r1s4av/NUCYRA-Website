from pathlib import Path
from threading import RLock
from typing import Any
import warnings

import joblib
from app.config import settings

class ModelService:
    EXPECTED_MODELS = {
        "decision_tree": "NUCYRA_DecisionTree.joblib",
        "feature_scaler": "NUCYRA_FeatureScaler.joblib",
        "kmeans": "NUCYRA_KMeans.joblib"
    }
    
    # 8 verified per-nucleus features
    PER_NUCLEUS_FEATURES = [
        {"name": "gray_mean", "category": "intensity", "unit": "a.u. (0-255)", "description": "Mean pixel intensity across grayscale converted nucleus area"},
        {"name": "gray_std", "category": "intensity", "unit": "a.u.", "description": "Standard deviation of grayscale intensity within nuclear boundary (internal texture/chromatin heterogeneity)"},
        {"name": "red_mean", "category": "chromatic", "unit": "a.u. (0-255)", "description": "Mean intensity in Red channel (eosin/counterstain absorption)"},
        {"name": "green_mean", "category": "chromatic", "unit": "a.u. (0-255)", "description": "Mean intensity in Green channel (primary hematoxylin absorption spectrum)"},
        {"name": "blue_mean", "category": "chromatic", "unit": "a.u. (0-255)", "description": "Mean intensity in Blue channel"},
        {"name": "area", "category": "morphometric", "unit": "pixels^2", "description": "Total enclosed pixel count of the nuclear mask A = sum(1)"},
        {"name": "perimeter", "category": "morphometric", "unit": "pixels", "description": "Total arc length of the outer contour boundary"},
        {"name": "circularity", "category": "morphometric", "unit": "ratio (0-1]", "description": "Isoperimetric quotient C = 4*pi*Area / (Perimeter^2)"}
    ]

    HISTORICAL_METRICS = {
        "decision_tree": {
            "reported_accuracy_percent": 49.83,
            "feature_count": 8,
            "features": PER_NUCLEUS_FEATURES,
            "validation_note": "Historical academic test benchmark. Evaluated on segmented nucleus crops from H&E histopathology tiles."
        },
        "kmeans": {
            "reported_ari": 0.055,
            "reported_nmi": 0.073,
            "unsupervised_disclaimer": "Unsupervised cluster assignments represent geometric and photometric groupings. They are mathematically derived and do not correspond directly to confirmed biological tumor grades."
        },
        "scientific_integrity_notice": "Decision Tree and K-Means were trained on isolated individual nuclei feature vectors, not whole tissue images. Direct classification of unsegmented whole-image uploads is intentionally disabled until an instance segmentation pipeline is linked."
    }

    _model_cache: dict[str, tuple[int, int, dict[str, Any]]] = {}
    _loaded_models: dict[str, Any] = {}
    _cache_lock = RLock()

    @classmethod
    def get_models_status(cls) -> dict:
        models_dir: Path = settings.MODELS_DIR
        status = {}
        all_present = True
        all_loaded = True

        with cls._cache_lock:
            for key, filename in cls.EXPECTED_MODELS.items():
                file_path = models_dir / filename
                try:
                    file_stat = file_path.stat()
                    exists = file_path.is_file()
                except OSError:
                    file_stat = None
                    exists = False

                model_status: dict[str, Any] = {
                    "filename": filename,
                    "expected_path": str(file_path),
                    "is_present": exists,
                    "is_loaded": False,
                    "input_schema_validated": False,
                    "schema_validation_error": None,
                    "size_bytes": file_stat.st_size if exists and file_stat else 0,
                    "load_error": None,
                    "load_warnings": [],
                }

                if not exists or file_stat is None:
                    all_present = False
                    all_loaded = False
                    model_status["load_error"] = "Model file is missing or inaccessible."
                    cls._model_cache.pop(key, None)
                    cls._loaded_models.pop(key, None)
                    status[key] = model_status
                    continue

                cached = cls._model_cache.get(key)
                if cached and cached[:2] == (file_stat.st_mtime_ns, file_stat.st_size):
                    model_status.update(cached[2])
                else:
                    try:
                        with warnings.catch_warnings(record=True) as captured:
                            warnings.simplefilter("always")
                            model = joblib.load(file_path)

                        feature_count = getattr(model, "n_features_in_", None)
                        if feature_count != len(cls.PER_NUCLEUS_FEATURES):
                            raise ValueError(
                                f"Expected {len(cls.PER_NUCLEUS_FEATURES)} input features; "
                                f"found {feature_count!r}."
                            )
                        if key == "decision_tree":
                            feature_names = getattr(model, "feature_names_in_", None)
                            expected_names = [feature["name"] for feature in cls.PER_NUCLEUS_FEATURES]
                            if feature_names is None:
                                model_status["schema_validation_error"] = (
                                    "The model has no feature_names_in_ metadata; input feature order "
                                    "cannot be verified."
                                )
                            elif list(feature_names) != expected_names:
                                model_status["schema_validation_error"] = (
                                    "Decision Tree feature order does not match the verified "
                                    f"per-nucleus contract: {list(feature_names)!r}."
                                )
                                raise ValueError(
                                    "Decision Tree feature order does not match the verified "
                                    f"per-nucleus contract: {list(feature_names)!r}."
                                )
                            else:
                                model_status["input_schema_validated"] = True
                        else:
                            feature_names = getattr(model, "feature_names_in_", None)
                            expected_names = [feature["name"] for feature in cls.PER_NUCLEUS_FEATURES]
                            if feature_names is None:
                                model_status["schema_validation_error"] = (
                                    "The model has no feature_names_in_ metadata; input feature order "
                                    "cannot be verified."
                                )
                            elif list(feature_names) != expected_names:
                                model_status["schema_validation_error"] = (
                                    "Model feature names do not match the verified per-nucleus "
                                    f"feature order: {list(feature_names)!r}."
                                )
                            else:
                                model_status["input_schema_validated"] = True

                        model_status.update(
                            is_loaded=True,
                            load_warnings=[str(item.message) for item in captured],
                        )
                        cls._loaded_models[key] = model
                    except Exception as exc:
                        model_status["load_error"] = f"{type(exc).__name__}: {exc}"
                        cls._loaded_models.pop(key, None)

                    cls._model_cache[key] = (
                        file_stat.st_mtime_ns,
                        file_stat.st_size,
                        {
                            "is_loaded": model_status["is_loaded"],
                            "input_schema_validated": model_status["input_schema_validated"],
                            "schema_validation_error": model_status["schema_validation_error"],
                            "load_error": model_status["load_error"],
                            "load_warnings": model_status["load_warnings"],
                        },
                    )

                if not model_status["is_loaded"]:
                    all_loaded = False
                status[key] = model_status

        return {
            "all_models_present": all_present,
            "all_models_loaded": all_loaded,
            "models_directory": str(models_dir),
            "models": status,
            "features_defined": cls.PER_NUCLEUS_FEATURES
        }

    @classmethod
    def get_historical_evaluation(cls) -> dict:
        return {
            "status": cls.get_models_status(),
            "historical_benchmarks": cls.HISTORICAL_METRICS
        }
