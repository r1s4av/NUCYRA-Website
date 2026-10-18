# NUCYRA — Premium AI Histopathology Analysis Platform

[![Platform](https://img.shields.io/badge/Platform-Web-0ea5e9.svg)](#)
[![Backend](https://img.shields.io/badge/Backend-FastAPI%20%7C%20OpenCV-0284c7.svg)](#)
[![Frontend](https://img.shields.io/badge/Frontend-React%2018%20%7C%20TypeScript%20%7C%20Tailwind-06b6d4.svg)](#)
[![Academic Prototype](https://img.shields.io/badge/Status-Educational%20Research-amber.svg)](#)

> **Scientific Subtitle**: AI-Assisted Histopathology Nuclei Analysis  
> **Notice**: Educational research prototype for biomedical image processing and machine learning evaluation. Not a diagnostic medical device.

---

## 🔬 Project Overview

NUCYRA is an academic, research-grade biomedical web platform developed to demonstrate nuclei-focused image processing pipelines, morphological feature inspection, and machine learning model evaluation on histopathology tissue imagery.

### Key Capabilities
- **Analysis Lab**: Upload histopathology images (PNG, JPEG, TIFF up to 15MB) with drag-and-drop. Configure multi-stage image processing pipelines (CLAHE, Gaussian/Median filtering, Otsu/Adaptive binarization, morphological opening/closing/erosion/dilation, Sobel, Canny edge detection). View real-time backend OpenCV output, split comparison slider, zoom/pan inspector, and quantitative image metrics.
- **IVP Studio**: Interactive laboratory to explore foundational biomedical image processing operations step-by-step with real-time intensity histograms, Shannon entropy, contrast, and candidate nuclei density.
- **AI Insights**: Historical benchmark dashboard presenting academic evaluation metrics for the 8-feature Decision Tree classifier (~49.83% test accuracy) and K-Means clustering (ARI ~0.055, NMI ~0.073). Includes live model status detection and documented asset drop zones.
- **Methodology**: Mathematical definitions for the 8 nuclear morphometric and colorimetric features (`gray_mean`, `gray_std`, `red_mean`, `green_mean`, `blue_mean`, `area`, `perimeter`, `circularity`), processing workflow, and transparent scientific boundaries.

---

## 🛡️ Non-Negotiable Scientific Integrity

1. **In-Memory Image Processing**: All uploaded images are processed in RAM using OpenCV/NumPy. No user uploads are written to disk.
2. **Zero Fabricated Data**: If trained model files or report figures are not present locally, the UI displays polished educational empty states rather than synthesizing false numbers or mock microscopy tiles.
3. **Guardrail on Whole-Image Classification**: The Decision Tree was trained on individual segmented nucleus feature vectors. Upload-based classification of whole histology tiles is strictly disabled with a scientific explanation until a validated per-nucleus instance segmentation pipeline is linked.

---

## 📁 Repository Layout

```text
NUCYRA-Website/
├── .gitignore                      # Strict safety rules (blocks datasets, weights, patient data)
├── .env.example                    # Template environment variables
├── README.md                       # Master documentation
├── backend/
│   ├── requirements.txt            # Python dependencies (FastAPI, OpenCV, NumPy, etc.)
│   ├── run.py                      # Standalone backend server entrypoint
│   ├── app/
│   │   ├── main.py                 # FastAPI application & CORS configuration
│   │   ├── config.py               # Server settings and safety constraints
│   │   ├── api/routes/             # Endpoints: health, ivp, analysis, ai
│   │   ├── schemas/                # Pydantic request/response schemas
│   │   └── services/               # OpenCV image processing & Model loader
│   ├── models/
│   │   └── README.md               # Drop zone guide for NUCYRA_DecisionTree.joblib, etc.
│   └── tests/                      # Automated pytest suite
└── frontend/
    ├── package.json                # React, TypeScript, Tailwind, Lucide, Recharts
    ├── vite.config.ts
    ├── src/
    │   ├── pages/                  # Home, AnalysisLab, IvpStudio, AiInsights, Methodology
    │   ├── components/             # Reusable UI, Layout, Image Comparison, Charts
    │   └── services/api.ts         # Typed API client
    └── public/
        └── results/
            └── README.md           # Drop zone guide for confusion matrices & reports
```

---

## 🚀 Quickstart Guide (Windows PowerShell)

### Prerequisites
- Python 3.10+ (tested on Python 3.13)
- Node.js 18+ (tested on Node 22.x) & npm

### Terminal 1: Backend Setup & Launch

```powershell
# 1. Navigate to backend directory
cd c:\Users\risha\Documents\NUCYRA-Website\backend

# 2. Create and activate a Python virtual environment
python -m venv .venv
.venv\Scripts\Activate.ps1

# 3. Install backend dependencies
python -m pip install --upgrade pip
pip install -r requirements.txt

# 4. Run automated tests to verify image processing & endpoints
pytest

# 5. Start the FastAPI server
python run.py
```
*Backend runs on: `http://127.0.0.1:8000` (API documentation at `http://127.0.0.1:8000/docs`)*

---

### Terminal 2: Frontend Setup & Launch

```powershell
# 1. Open a new PowerShell window and navigate to frontend directory
cd c:\Users\risha\Documents\NUCYRA-Website\frontend

# 2. Install dependencies
npm install

# 3. Type check and build test
npm run build

# 4. Start Vite development server
npm run dev
```
*Frontend runs on: `http://localhost:5173`*

---

## 📊 External Project Asset Drops

If you wish to integrate the trained models or evaluation reports from your Google Drive project:
- **Models**: Copy `NUCYRA_DecisionTree.joblib`, `NUCYRA_FeatureScaler.joblib`, `NUCYRA_KMeans.joblib` into `backend/models/`.
- **Reports**: Copy `decision_tree_confusion_matrix.png`, `decision_tree_classification_metrics.csv`, `kmeans_cluster_comparison.csv` into `frontend/public/results/`.
*(The app runs cleanly in standalone mode if these files are absent).*

---
## Added in the final integration (Member 3)
- **Quantitative Analysis page** (`frontend/src/pages/QuantitativeAnalysisPage.tsx`): IVP analysis, Decision Tree vs CNN on the same 4,929 test crops, Member 2 segmentation comparison, class-imbalance and galleries. Data in `frontend/public/results/quantitative/summary.json`.
- **Nucleus-crop demo**: `POST /api/ai/predict-crop` (one 32x32 to 128x128 RGB nucleus crop, returns CNN and Decision Tree predictions with probabilities) and `GET /api/ai/crop-model-status`.
- `POST /api/ai/predict` (whole image) intentionally returns 501: the models classify single nuclei, not full slides.
- Model files in `backend/models/` (CNN `.keras`, Decision Tree/Scaler/KMeans `.joblib`). Install AI extras with `pip install -r backend/requirements-ai.txt`.
- Tests: `cd backend && pip install pytest httpx && pytest` (20 tests).
- Class names are Neoplastic, Inflammatory, Connective, Dead and Epithelial (labels 1-5, PanNuke / HoVer-Net numbering).
