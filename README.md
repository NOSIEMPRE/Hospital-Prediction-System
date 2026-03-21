# IE-MLOps-Group-Project-Team3

**Hospital Readmission Risk Prediction** — An end-to-end MLOps system for proactive patient care.

![CI/CD](https://github.com/NOSIEMPRE/Hospital-Prediction-System/actions/workflows/ci-cd.yml/badge.svg)

---

## Project Overview

This project builds a machine learning system to predict 30-day readmission risk for diabetic inpatients. Risk scores are served via a FastAPI REST API with SHAP explainability, a Streamlit clinical dashboard, and a React + Node.js full-stack frontend.

- **Dataset**: Diabetes 130-US Hospitals (UCI ML Repository, id 296) — Strack et al., 2014
- **Target**: Binary classification — readmitted within 30 days (yes/no)
- **Model**: XGBoost pipeline tracked with MLflow, quality-gated (PR-AUC ≥ 0.15)
- **Live API**: [hospital-readmission-risk-predictor-pcv7.onrender.com](https://hospital-readmission-risk-predictor-pcv7.onrender.com)

---

## Team

Marian, Marco, Yaxin, Lorenz, Jorge, Omar

---

## Project Roadmap

| Phase | Module | Description |
| ----- | ------ | ----------- |
| 1 | [01-initial-notebook](01-initial-notebook/README.md) | EDA, baseline Logistic Regression |
| 2 | [02-data-sampling-feature](02-data-sampling-feature/README.md) | Feature engineering, patient-level split |
| 3 | [03-experiment-tracking](03-experiment-tracking/README.md) | MLflow, XGBoost/LightGBM, Optuna tuning |
| 4 | [04-deployment](04-deployment/README.md) | FastAPI model serving |
| 5 | [05-monitoring](05-monitoring/README.md) | Drift detection with Evidently |
| 6 | [06-cicd](06-cicd/README.md) | CI/CD, Docker, GHCR, Render, Streamlit UI, React dashboard |

---

## Repository Structure

```text
├── 01-initial-notebook/           # EDA & baseline model
├── 02-data-sampling-feature/      # Feature engineering
├── 03-experiment-tracking/        # MLflow experiments
├── 04-deployment/                 # FastAPI serving (standalone)
├── 05-monitoring/                 # Drift detection (standalone)
├── 06-cicd/                       # Production CI/CD module
│   ├── train.py                   # XGBoost training + quality gate
│   ├── app.py                     # FastAPI service (SHAP, logging, CORS)
│   ├── streamlit_app.py           # Clinical Streamlit dashboard
│   ├── test_api.py                # API integration tests
│   ├── test_train.py              # Unit tests for train.py
│   ├── config.yaml                # Features, hyperparameters, quality gate threshold
│   ├── Dockerfile                 # Production container
│   ├── requirements.txt
│   ├── data/
│   │   └── predictions.log        # Append-only prediction audit log (CSV)
│   ├── models/                    # Saved MLflow model artifact
│   └── frontend/                  # React + Node.js dashboard
│       ├── client/                # Vite + React (5 pages)
│       ├── server/                # Express proxy (Node.js)
│       ├── Dockerfile
│       └── docker-compose.yml
├── .github/workflows/
│   ├── ci-cd.yml                  # Main pipeline (lint → test → build → deploy)
│   └── train.yml                  # Reusable training job
├── data/
│   ├── diabetic_data.csv          # Raw dataset (download from UCI)
│   ├── IDS_mapping.csv
│   └── processed/                 # train.csv, val.csv, test.csv
├── render.yaml                    # Render.com deployment config
├── WALKTHROUGH_EN.md              # Full technical walkthrough
└── README.md
```

> **Note on repeated filenames**: `app.py`, `train.py`, and `test_api.py` appear in modules 04, 05, and 06. Each version intentionally evolves — basic serving → monitoring hooks → CI/CD + SHAP integration.

---

## Key Deliverables

| Deliverable | Status |
| :--- | :---: |
| Model training with quality gate (`train.py`, MLflow, PR-AUC ≥ 0.15) | ✅ |
| FastAPI serving with SHAP explainability and prediction logging (`app.py`) | ✅ |
| Unit + integration tests | ✅ |
| Dockerfile | ✅ |
| CI/CD workflow (lint → test → build → push) | ✅ |
| Render deployment manifest (`render.yaml`) | ✅ |
| Live API on Render | ✅ |
| Streamlit clinical dashboard | ✅ |
| React + Node.js full-stack frontend | ✅ |

---

## Quick Start

### 1. Clone and set up

```bash
git clone https://github.com/NOSIEMPRE/Hospital-Prediction-System.git
cd IE_MLOps_Group-Project_Team3
pip install -r 06-cicd/requirements.txt
```

### 2. Download data

Download [Diabetes 130-US Hospitals](https://archive.ics.uci.edu/dataset/296) and place `diabetic_data.csv` in `data/`.

### 3. Train and run API

```bash
cd 06-cicd
python train.py    # trains model, enforces quality gate, writes run_id.txt
python app.py      # starts API at http://localhost:9696
```

### 4. Run Streamlit dashboard

```bash
streamlit run 06-cicd/streamlit_app.py
# → http://localhost:8501
```

### 5. Run React frontend

```bash
# Terminal 1 — Node.js proxy
cd 06-cicd/frontend/server && npm install && npm run dev

# Terminal 2 — React client
cd 06-cicd/frontend/client && npm install && npm run dev
# → http://localhost:5173
```

### 6. Test via curl

```bash
curl http://localhost:9696/health

curl -X POST http://localhost:9696/predict \
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

## Documentation

See [WALKTHROUGH_EN.md](WALKTHROUGH_EN.md) for a full technical walkthrough of the entire MLOps pipeline — from raw data to cloud deployment.

---

## References

- Strack, B., et al. (2014). Impact of HbA1c Measurement on Hospital Readmission Rates. *BioMed Research International*.
- UCI Machine Learning Repository. (2014). Diabetes 130-US Hospitals.
- Huyen, C. (2022). *Designing Machine Learning Systems*. O'Reilly Media.
- IE University. (2026). *Machine Learning Operations* — Final Group Project.
