# NUCYRA whole-image AI update

The `POST /api/ai/predict` endpoint now runs an **experimental** stain-threshold / connected-component candidate detector, computes the eight per-candidate features in the documented order, attempts Decision Tree and CNN inference, and returns a JPEG overlay plus per-candidate results. The AI Insights page renders these results.

## Important limitations

- This is a prototype candidate detector, not validated nucleus instance segmentation. Connected components can merge overlapping nuclei or include non-nuclear regions and miss real nuclei.
- The Decision Tree output is only enabled when the saved model's feature schema is compatible with the expected order (or its metadata does not specify names). The provided historical model file emits a scikit-learn version warning in the current environment; use the model's training scikit-learn version for reproducibility.
- CNN inference is optional and requires `pip install -r requirements-ai.txt` in the backend environment.
- Results are for research/education only and are not diagnostic. The existing `/api/ai/predict-crop` endpoint and IVP endpoints are unchanged.
- The endpoint processes at most 300 candidates per upload and respects the configured upload size limit.

## Run locally

Backend: from `backend`, install `requirements.txt`, then run `python run.py`.
For CNN support, also install `requirements-ai.txt`.

Frontend: from `frontend`, run `npm install` then `npm run dev` (or `npm run build`).

The backend test suite was run after this change: 20 passed. TypeScript type-check (`tsc --noEmit`) passed. A full Vite build could not be verified in the packaging environment because the uploaded `node_modules` lacked the platform-specific Rollup optional dependency; reinstall frontend dependencies on the target machine if that occurs.
