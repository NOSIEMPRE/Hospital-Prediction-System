# 06 – CI/CD

**Hospital Readmission Risk Prediction** — Automated training, testing, and deployment pipeline

---

## Overview

This is the production module. Every push to `main` triggers a GitHub Actions pipeline that trains the model, lints and tests the code, builds a Docker image, and pushes it to GitHub Container Registry (GHCR). The image is deployed to Render.

**Live API**: [hospital-prediction-system.onrender.com](https://hospital-prediction-system.onrender.com)

---

## Contents

```text
06-cicd/
├── train.py           # XGBoost training, MLflow logging, writes run_id.txt + models/
├── app.py             # FastAPI service (loads model at startup)
├── streamlit_app.py   # Interactive test UI
├── test_api.py        # Integration tests for /health and /predict
├── test_train.py      # Unit tests for train.py (prepare_features, DictVectorizerWrapper, etc.)
├── config.yaml        # Feature columns and model hyperparameters
├── Dockerfile         # Multi-stage build for production container
├── requirements.txt
├── run_id.txt         # Written by train.py, read by app.py
├── models/            # Saved MLflow model artifact
├── .streamlit/
│   └── config.toml    # Streamlit theme config
└── README.md
```

---

## CI/CD Pipeline

```text
git push main
  └─ Train Model (train.yml)
       ├─ python train.py
       └─ Upload artifact: run_id.txt + models/
  └─ Build, Test, and Deploy (ci-cd.yml)
       ├─ Download trained-model artifact
       ├─ Lint: flake8 .
       ├─ Unit tests: pytest test_train.py
       ├─ Build Docker image
       ├─ Integration tests: pytest test_api.py (against running container)
       └─ Push image to GHCR (ghcr.io/<owner>/<repo>:latest + :<sha>)
```

Linting uses `.flake8` at the project root (`max-line-length = 88`).

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
python train.py   # trains model, writes run_id.txt and models/
python app.py     # starts API at http://localhost:9696
```

### Run tests

```bash
# Unit tests (no server needed)
python -m pytest -q test_train.py

# Integration tests (app.py must be running)
python -m pytest -q test_api.py
```

### Streamlit UI

```bash
streamlit run streamlit_app.py
```

- **Quick demo**: one-click prediction with a sample patient
- **Custom form**: enter patient data and call `/predict`
- **Sidebar**: configure API URL (localhost or Render) and check health status

---

## API Endpoints

| Endpoint | Method | Description |
| -------- | ------ | ----------- |
| `/` | GET | Welcome message |
| `/health` | GET | Service status, model loaded flag, run ID |
| `/predict` | POST | Returns `risk_score` (0–1) and `model_version` |
| `/docs` | GET | Swagger UI |

### Example

```bash
curl https://hospital-prediction-system.onrender.com/health

curl -X POST https://hospital-prediction-system.onrender.com/predict \
  -H "Content-Type: application/json" \
  -d '{
    "time_in_hospital": 3, "num_lab_procedures": 41,
    "num_procedures": 0, "num_medications": 8,
    "number_emergency": 0, "number_inpatient": 0,
    "number_outpatient": 0, "number_diagnoses": 9,
    "care_intensity": 0, "admission_type_id": 1,
    "discharge_disposition_id": 1, "admission_source_id": 7,
    "age": "[50-60)", "gender": "Female", "race": "Caucasian",
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

The `render.yaml` at the project root automates this configuration.

---

## Troubleshooting

| Issue | Fix |
| ----- | --- |
| `run_id.txt not found` | Run `python train.py` first |
| `models/` directory missing | Run `python train.py` — it creates the artifact |
| Render cold start slow | First request may take 30–60s; subsequent requests are fast |
| Lint fails locally | Run `flake8 .` from `06-cicd/` to see all violations |
