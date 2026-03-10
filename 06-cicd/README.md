# 06 – CI/CD: Automated Training & Deployment

**Hospital Readmission Risk Prediction** — End-to-end MLOps pipeline

## Overview

- **train.py** — Model training, saves to `models/model/`
- **app.py** — FastAPI serving API
- **Dockerfile** — Containerized service
- **CI/CD** — GitHub Actions: train → lint → build → test → push to GHCR

## Workflow

```
Git Push (main) → CI/CD Pipeline
  1. Train model (train.yml) → artifact: run_id.txt, models/
  2. Lint (flake8)
  3. Build & test Docker image
  4. Push to GHCR (ghcr.io/<owner>/<repo>:latest)
```

## Prerequisites

**Data:** Download [Diabetes 130-US Hospitals](https://archive.ics.uci.edu/dataset/296) and place `diabetic_data.csv` in `data/` (project root).

## Local Development

```bash
cd 06-cicd
pip install -r requirements.txt
python train.py
python app.py
# In another terminal:
python -m pytest -q test_api.py
```

## API Endpoints

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/` | GET | Welcome message |
| `/health` | GET | Health check, model status |
| `/predict` | POST | Risk score (0–1) for 30-day readmission |

## Deploy to Render

1. Push to GitHub, wait for CI/CD to succeed
2. Make GHCR image **public** (Packages → Settings → Danger Zone)
3. Create Web Service on Render: "Deploy an existing image"
4. Image URL: `ghcr.io/<owner>/<repo>:latest` (e.g. `ghcr.io/nosiempre/ie_mlops_group-project_team3:latest`)
5. Verify: `curl https://<service>.onrender.com/health`

**Live API:** https://hospital-readmission-risk-predictor-pcv7.onrender.com
