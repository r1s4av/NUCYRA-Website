"""Single-nucleus crop prediction (CNN + Decision Tree).

The models were trained on 32x32 RGB crops centred on ONE nucleus (CNN) and on 8 features computed from such
crops (Decision Tree). This service therefore accepts a nucleus-centred crop only - never a whole tissue tile.
Feature extraction replicates Member 1's training code exactly (grayscale, 3x3 Gaussian, Otsu, largest contour).
"""
from __future__ import annotations

from threading import RLock
from typing import Any

import cv2
import joblib
import numpy as np

from app.config import settings

CLASS_LABELS = ["Neoplastic", "Inflammatory", "Connective", "Dead", "Epithelial"]
FEATURE_ORDER = ["gray_mean", "gray_std", "red_mean", "green_mean", "blue_mean", "area", "perimeter", "circularity"]
CNN_FILE = "NUCYRA_CNN_best.keras"
DT_FILE = "NUCYRA_DecisionTree.joblib"
DISCLAIMER = (
    "Educational research prototype. The models were trained on 32x32 nucleus-centred crops from a public "
    "H&E dataset; CNN test accuracy is about 66% and Decision Tree accuracy about 47%. "
    "Class names follow the PanNuke / HoVer-Net numbering (1 Neoplastic, 2 Inflammatory, 3 Connective, 4 Dead, 5 Epithelial). Not a diagnostic tool."
)


class CropPredictionService:
    _lock = RLock()
    _dt: Any = None
    _cnn: Any = None
    _cnn_error: str | None = None
    _dt_error: str | None = None

    # ------------------------------------------------------------------ image handling
    @staticmethod
    def preprocess(image_bgr: np.ndarray) -> np.ndarray:
        """Centre-crop to a square, resize to 32x32 (INTER_AREA) and return an RGB uint8 array."""
        if image_bgr is None or image_bgr.ndim != 3:
            raise ValueError("Image could not be decoded as a colour image.")
        h, w = image_bgr.shape[:2]
        if min(h, w) < 16:
            raise ValueError("Image is too small; a nucleus crop must be at least 16x16 pixels.")
        s = min(h, w)
        y0, x0 = (h - s) // 2, (w - s) // 2
        sq = image_bgr[y0:y0 + s, x0:x0 + s]
        rgb = cv2.cvtColor(sq, cv2.COLOR_BGR2RGB)
        return cv2.resize(rgb, (32, 32), interpolation=cv2.INTER_AREA) if s != 32 else rgb

    @staticmethod
    def extract_features(rgb32: np.ndarray) -> dict[str, float]:
        gray = cv2.cvtColor(rgb32, cv2.COLOR_RGB2GRAY)
        blurred = cv2.GaussianBlur(gray, (3, 3), 0)
        _, binary = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
        contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        area = perimeter = circularity = 0.0
        if contours:
            c = max(contours, key=cv2.contourArea)
            area, perimeter = float(cv2.contourArea(c)), float(cv2.arcLength(c, True))
            circularity = float(4 * np.pi * area / perimeter ** 2) if perimeter > 0 else 0.0
        return {
            "gray_mean": float(gray.mean()), "gray_std": float(gray.std()),
            "red_mean": float(rgb32[:, :, 0].mean()), "green_mean": float(rgb32[:, :, 1].mean()),
            "blue_mean": float(rgb32[:, :, 2].mean()), "area": area, "perimeter": perimeter, "circularity": circularity,
        }

    # ------------------------------------------------------------------ model loading
    @classmethod
    def _load_dt(cls):
        with cls._lock:
            if cls._dt is not None or cls._dt_error is not None:
                return cls._dt
            path = settings.MODELS_DIR / DT_FILE
            if not path.is_file():
                cls._dt_error = f"{DT_FILE} not found in models directory."
                return None
            try:
                cls._dt = joblib.load(path)
                names = getattr(cls._dt, "feature_names_in_", None)
                if names is not None and list(names) != FEATURE_ORDER:
                    cls._dt, cls._dt_error = None, f"Unexpected feature order: {list(names)}"
            except Exception as exc:  # noqa: BLE001
                cls._dt, cls._dt_error = None, f"{type(exc).__name__}: {exc}"
            return cls._dt

    @classmethod
    def _load_cnn(cls):
        with cls._lock:
            if cls._cnn is not None or cls._cnn_error is not None:
                return cls._cnn
            path = settings.MODELS_DIR / CNN_FILE
            if not path.is_file():
                cls._cnn_error = f"{CNN_FILE} not found in models directory."
                return None
            try:
                import os
                os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "3")
                import keras  # TensorFlow/Keras is an optional dependency (see requirements-ai.txt)
            except ImportError:
                cls._cnn_error = "TensorFlow/Keras is not installed (pip install -r requirements-ai.txt)."
                return None
            try:
                cls._cnn = keras.models.load_model(path)
            except Exception as exc:  # noqa: BLE001
                cls._cnn, cls._cnn_error = None, f"{type(exc).__name__}: {exc}"
            return cls._cnn

    @classmethod
    def reset_cache(cls) -> None:
        with cls._lock:
            cls._dt = cls._cnn = cls._cnn_error = cls._dt_error = None

    @classmethod
    def status(cls) -> dict:
        dt, cnn = cls._load_dt(), cls._load_cnn()
        return {
            "classes": CLASS_LABELS,
            "decision_tree": {"available": dt is not None, "error": cls._dt_error, "file": DT_FILE},
            "cnn": {"available": cnn is not None, "error": cls._cnn_error, "file": CNN_FILE},
            "reported_test_metrics": {
                "note": "Same 4,929 held-out test crops (split by source image).",
                "cnn": {"accuracy": 0.6622, "macro_f1": 0.614}, "decision_tree": {"accuracy": 0.473, "macro_f1": 0.417},
            },
            "disclaimer": DISCLAIMER,
        }

    # ------------------------------------------------------------------ prediction
    @classmethod
    def predict(cls, image_bgr: np.ndarray) -> dict:
        rgb32 = cls.preprocess(image_bgr)
        feats = cls.extract_features(rgb32)
        out: dict[str, Any] = {"classes": CLASS_LABELS, "input_size": [32, 32], "features": feats, "disclaimer": DISCLAIMER}
        dt, cnn = cls._load_dt(), cls._load_cnn()
        if dt is not None:
            import pandas as pd
            row = pd.DataFrame([[feats[k] for k in FEATURE_ORDER]], columns=FEATURE_ORDER)
            proba = dt.predict_proba(row)[0]
            classes = [int(c) for c in dt.classes_]
            full = [float(proba[classes.index(i)]) if i in classes else 0.0 for i in range(1, 6)]
            out["decision_tree"] = {"predicted": CLASS_LABELS[int(np.argmax(full))], "probabilities": dict(zip(CLASS_LABELS, full))}
        else:
            out["decision_tree"] = {"unavailable": True, "reason": cls._dt_error}
        if cnn is not None:
            p = np.asarray(cnn.predict(rgb32[None].astype("float32") / 255.0, verbose=0))[0]
            out["cnn"] = {"predicted": CLASS_LABELS[int(np.argmax(p))], "confidence": float(p.max()),
                          "probabilities": dict(zip(CLASS_LABELS, [float(v) for v in p]))}
        else:
            out["cnn"] = {"unavailable": True, "reason": cls._cnn_error}
        return out
