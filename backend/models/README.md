# NUCYRA — AI Model Asset Directory

This directory is the designated local storage path for approved, serialized machine learning models from the NUCYRA academic project.

> [!IMPORTANT]
> Model binaries are strictly excluded from version control via `.gitignore`. Do not commit `.joblib` files to git repositories.

---

## Expected Model Files

If you wish to load the pre-trained models from your Google Drive / Colab environment (`03_AI_Models/`), place copies of the following files here:

1. **`NUCYRA_DecisionTree.joblib`**
   - **Type**: Supervised `DecisionTreeClassifier` (scikit-learn).
   - **Input Features (8-D per-nucleus vector)**:
     1. `gray_mean`
     2. `gray_std`
     3. `red_mean`
     4. `green_mean`
     5. `blue_mean`
     6. `area`
     7. `perimeter`
     8. `circularity`
   - **Reported Historical Test Accuracy**: ~49.83%.

2. **`NUCYRA_FeatureScaler.joblib`**
   - **Type**: Fitted `StandardScaler` or `MinMaxScaler` used during training.
   - **Purpose**: Normalizes the 8 morphological and colorimetric features prior to inference.
   - The current saved scaler has eight inputs but no `feature_names_in_` metadata. Its feature order is therefore not verified, and it must not be treated as inference-ready based on feature count alone.

3. **`NUCYRA_KMeans.joblib`**
   - **Type**: Unsupervised `KMeans` clustering estimator.
   - **Reported Historical Metrics**: Adjusted Rand Index (ARI) ~0.055, Normalized Mutual Information (NMI) ~0.073.
   - **Note**: Unsupervised clusters represent geometric and intensity groupings; they are not confirmed clinical tumor grades.

---

## Safe Startup Behavior

- If these files are absent, the NUCYRA backend will start normally without errors.
- Image processing (IVP Studio & Analysis Lab) works 100% independently of model files.
- `/api/ai/model-status` reports file presence separately from deserialization (`is_present` and `is_loaded` per model, plus `all_models_present` and `all_models_loaded`).
- `/api/health` reflects successful deserialization in its `models_status.all_loaded` field; a present but invalid or incompatible file is not reported as loaded.
- Scikit-learn version compatibility warnings are exposed by `/api/ai/model-status`. Successful deserialization does not verify model accuracy or enable inference on whole images.

---

## Scientific Guardrail

> [!CAUTION]
> The Decision Tree was trained on individual segmented nucleus features. Whole-slide or tile-level tissue images cannot be passed directly into this model without an upstream instance segmentation pipeline.

## Experimental Candidate Features

`app/services/nucleus_service.py` provides image-derived candidates and a separate helper for ground-truth instance maps. Candidate detection uses an approximate optical-density stain channel, global Otsu thresholding, and 8-connected components with a 15–5000 pixel area filter. Candidate masks are local to their `(x, y, width, height)` bounding box. It does not split touching nuclei and has not been validated as an instance-segmentation model.

Features use RGB input in 8-bit [0, 255] units. Grayscale uses OpenCV RGB-to-gray conversion; area is the foreground pixel count in pixels²; perimeter is the sum of external OpenCV contour arc lengths in pixels; holes are not included in that perimeter. Ground-truth instance features are available for validation only and are not used as image-derived candidates.

On four locally available annotated train patches (indices 0, 10, 100, and 1000), candidate-to-annotation foreground-pixel IoU ranged from 0.000 to 0.515. This is not acceptable validation for inference. A feature-vector check on patch 0, annotated instance 1, matched an independent NumPy/OpenCV recomputation for grayscale and RGB statistics, pixel area, and external-contour perimeter. The measured per-instance feature distribution did not establish compatibility with the saved scaler. Inference therefore remains disabled with HTTP 501 until segmentation and the scaler input schema are validated against the actual model training data.
