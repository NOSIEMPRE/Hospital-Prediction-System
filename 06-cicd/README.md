# 06 – CI/CD

**Hospital Readmission Risk Prediction** — Automated training, testing, and deployment pipeline

---

## Overview

This is the production module. Every push to `main` triggers a GitHub Actions pipeline that trains the model, enforces a quality gate, lints and tests the code, builds a Docker image, and pushes it to GitHub Container Registry (GHCR). The image is deployed to Render.

**Live API**: [hospital-readmission-risk-predictor-pcv7.onrender.com](https://hospital-readmission-risk-predictor-pcv7.onrender.com)

---

## Contents

```text
06-cicd/
├── train.py              # XGBoost training, MLflow logging, quality gate
├── app.py                # FastAPI service (SHAP, prediction logging, CORS)
├── streamlit_app.py      # Clinical Streamlit dashboard (3 pages)
├── test_api.py           # Integration tests for /health and /predict
├── test_train.py         # Unit tests for train.py
├── config.yaml           # Hyperparameters, features, quality gate threshold
├── Dockerfile            # Production container
├── requirements.txt
├── data/
│   └── predictions.log   # Append-only audit log written by app.py (CSV)
├── models/               # Saved MLflow model artifact
│   └── model/
├── frontend/             # React + Node.js dashboard
│   ├── client/           # Vite + React (Login, Intake, Batch, Dashboard, Monitoring)
│   ├── server/           # Express proxy (Node.js, port 3001)
│   ├── Dockerfile
│   └── docker-compose.yml
└── README.md
```

---

## What's New (vs Phase 04)

| Feature | Detail |
| ------- | ------ |
| **Quality gate** | `train.py` raises `ModelQualityError` and blocks CI/CD if PR-AUC < `min_pr_auc` (default 0.15) |
| **SHAP explainability** | `app.py` computes per-prediction SHAP values and returns them in the `/predict` response |
| **Prediction logging** | Every `/predict` call is appended to `data/predictions.log` (CSV) for audit and monitoring |
| **CORS middleware** | FastAPI accepts cross-origin requests from the React frontend |
| **`care_intensity` auto-computed** | Now optional in the request; API computes it if not provided |
| **React + Node.js frontend** | Full-stack dashboard with glassmorphism dark theme, SHAP waterfall charts, batch scoring |
| **Streamlit redesign** | Premium clinical navy UI with Plotly gauges, batch processing, system telemetry page |

---

## CI/CD Pipeline

```text
git push main
  └─ Train Model (train.yml)
       ├─ python train.py
       ├─ Quality gate: PR-AUC ≥ min_pr_auc (blocks pipeline if fails)
       └─ Upload artifact: run_id.txt + models/
  └─ Build, Test, and Deploy (ci-cd.yml)
       ├─ Download trained-model artifact
       ├─ Lint: flake8 .
       ├─ Unit tests: pytest test_train.py
       ├─ Build Docker image
       ├─ Integration tests: pytest test_api.py (against running container)
       └─ Push image to GHCR (ghcr.io/<owner>/<repo>:latest + :<sha>)
```

---

## Local Development

### Setup

```bash
cd 06-cicd
pip install -r requirements.txt
```

Ensure `../data/diabetic_data.csv` exists.

### Train + serve

```bash
python train.py   # trains model, enforces quality gate, writes run_id.txt and models/
python app.py     # starts API at http://localhost:9696
```

### Run tests

```bash
# Unit tests (no server needed)
PYTHONPATH=. python -m pytest -q test_train.py

# Integration tests (app.py must be running)
PYTHONPATH=. python -m pytest -q test_api.py
```

### Streamlit dashboard

```bash
streamlit run streamlit_app.py
# → http://localhost:8501
# Pages: Patient Intake | Batch Processing | System Monitoring
```

### React + Node.js frontend

```bash
# Terminal 1
cd frontend/server && npm install && npm run dev   # Express proxy on :3001

# Terminal 2
cd frontend/client && npm install && npm run dev   # React on :5173
```

Or run the full stack with Docker:

```bash
cd frontend && docker-compose up --build
# → http://localhost:3001
```

---

## API Endpoints

| Endpoint | Method | Description |
| -------- | ------ | ----------- |
| `/` | GET | Welcome message |
| `/health` | GET | Status, model loaded flag, run ID |
| `/predict` | POST | Returns `risk_score` (0–1), `model_version`, `shap_values` |
| `/docs` | GET | Swagger UI |

### Example

```bash
curl https://hospital-readmission-risk-predictor-pcv7.onrender.com/health

curl -X POST https://hospital-readmission-risk-predictor-pcv7.onrender.com/predict \
  -H "Content-Type: application/json" \
  -d '{
    "time_in_hospital": 3, "num_lab_procedures": 41,
    "num_procedures": 0, "num_medications": 8,
    "number_emergency": 0, "number_inpatient": 0,
    "number_outpatient": 0, "number_diagnoses": 9,
    "admission_type_id": 1, "discharge_disposition_id": 1,
    "admission_source_id": 7, "age": "[50-60)",
    "gender": "Female", "race": "Caucasian",
    "change": "Ch", "diabetesMed": "Yes",
    "medication_changed": 1,
    "A1Cresult": "not_tested", "max_glu_serum": "not_tested"
  }'
```

---

## Docker

### Build and run locally

```bash
docker build -t hospital-readmission-app .
docker run -p 9696:9696 hospital-readmission-app
```

### Pull from GHCR

```bash
docker pull ghcr.io/nosiempre/hospital-prediction-system:latest
docker run -p 9696:9696 ghcr.io/nosiempre/hospital-prediction-system:latest
```

---

## Deploy to Render

1. Ensure CI/CD has run successfully and the image is in GHCR
2. Make the package **public**: GitHub → Packages → Settings → Change visibility
3. On Render: New Web Service → "Deploy an existing image"
4. Image URL: `ghcr.io/nosiempre/hospital-prediction-system:latest`
5. Port: `9696`
6. Verify: `curl https://<your-service>.onrender.com/health`

---

## Troubleshooting

| Issue | Fix |
| ----- | --- |
| `run_id.txt not found` | Run `python train.py` first |
| `models/` directory missing | Run `python train.py` — it creates the artifact |
| Quality gate blocks training | Model PR-AUC too low; check data or tune `min_pr_auc` in `config.yaml` |
| `data/predictions.log` not found | Created automatically on first `/predict` call |
| Render cold start slow | First request may take 30–60s on free tier |
| Lint fails locally | Run `flake8 .` from `06-cicd/` to see all violations |
