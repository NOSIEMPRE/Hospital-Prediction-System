# IE-MLOps-Group-Project-Team3

**Hospital Readmission Risk Prediction** — An end-to-end MLOps system for proactive patient care.

![CI/CD](https://github.com/NOSIEMPRE/Hospital-Prediction-System/actions/workflows/ci-cd.yml/badge.svg)

---

## Project Overview

This project builds a machine learning system to predict 30-day readmission risk for diabetic inpatients. Risk scores are served via a FastAPI REST API, enabling care coordinators to prioritize follow-up for high-risk patients.

- **Dataset**: Diabetes 130-US Hospitals (UCI ML Repository, id 296) — Strack et al., 2014
- **Target**: Binary classification — readmitted within 30 days (yes/no)
- **Model**: XGBoost pipeline tracked with MLflow
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
| 6 | [06-cicd](06-cicd/README.md) | CI/CD, Docker, GHCR, Render, Streamlit UI |

---

## Repository Structure

```text
├── 01-initial-notebook/           # EDA & baseline model
│   ├── hospital_readmission_prediction.ipynb
│   ├── eda_diabetes_readmission.ipynb
│   └── README.md
├── 02-data-sampling-feature/      # Feature engineering
│   ├── features.ipynb             # CCS, Charlson, train/val/test split
│   ├── hospital_readmission_data_fe.ipynb
│   └── README.md
├── 03-experiment-tracking/        # MLflow experiments
│   ├── scenario-1.ipynb           # Baseline (Logistic Regression)
│   ├── scenario-2.ipynb           # XGBoost/LightGBM + Optuna
│   └── README.md
├── 04-deployment/                 # FastAPI serving (standalone)
│   ├── train.py, app.py, test_api.py
│   └── README.md
├── 05-monitoring/                 # Drift detection (standalone)
│   ├── train.py, app.py, simulate.py, monitor.py, test_api.py
│   └── README.md
├── 06-cicd/                       # Production CI/CD module
│   ├── train.py                   # Training (XGBoost, MLflow)
│   ├── app.py                     # FastAPI service
│   ├── streamlit_app.py           # Live test UI
│   ├── test_api.py                # API integration tests
│   ├── test_train.py              # Unit tests for train.py
│   ├── config.yaml                # Feature & model configuration
│   ├── Dockerfile
│   ├── requirements.txt
│   └── README.md
├── .github/workflows/
│   ├── ci-cd.yml                  # Main pipeline (lint → test → build → deploy)
│   └── train.yml                  # Reusable training job
├── data/
│   ├── diabetic_data.csv          # Raw dataset (download from UCI)
│   ├── IDS_mapping.csv
│   ├── processed/                 # train.csv, val.csv, test.csv
│   └── README.md
├── docs/                          # Proposals and assignment PDFs
├── render.yaml                    # Render.com deployment config
├── .flake8                        # Linting config (max-line-length = 88)
└── README.md
```

> **Note on repeated filenames**: `app.py`, `train.py`, and `test_api.py` appear in modules 04, 05, and 06. Each version is intentionally different — they evolve across stages (basic serving → monitoring hooks → CI/CD integration). Each folder is independently runnable.

---

## Key Deliverables

| Deliverable | Status |
| :--- | :---: |
| Model training script (`train.py`, MLflow) | ✅ |
| FastAPI serving (`app.py`) | ✅ |
| Unit + integration tests | ✅ |
| Dockerfile | ✅ |
| CI/CD workflow (lint → test → build → push) | ✅ |
| Render deployment manifest (`render.yaml`) | ✅ |
| Live API on Render | ✅ |
| Streamlit live test UI | ✅ |

---

## Quick Start

### 1. Clone and set up

```bash
git clone https://github.com/NOSIEMPRE/Hospital-Prediction-System.git
cd IE_MLOps_Group-Project_Team3
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r 06-cicd/requirements.txt
```

### 2. Download data

Download [Diabetes 130-US Hospitals](https://archive.ics.uci.edu/dataset/296) and place `diabetic_data.csv` in `data/`.

### 3. Train and run API

```bash
cd 06-cicd
python train.py    # trains model, writes run_id.txt
python app.py      # starts API at http://localhost:9696
```

### 4. Run Streamlit UI

```bash
# in a new terminal
streamlit run 06-cicd/streamlit_app.py
```

- **Quick demo**: one-click prediction with sample patient
- **Custom form**: enter patient data and call `/predict`
- **Sidebar**: set API URL (localhost or Render) and check health

### 5. Test via curl

```bash
# Health check
curl http://localhost:9696/health

# Predict
curl -X POST http://localhost:9696/predict \
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

## References

- Strack, B., et al. (2014). Impact of HbA1c Measurement on Hospital Readmission Rates. *BioMed Research International*.
- UCI Machine Learning Repository. (2014). Diabetes 130-US Hospitals.
- Huyen, C. (2022). *Designing Machine Learning Systems*. O'Reilly Media.
- IE University. (2026). *Machine Learning Operations* — Final Group Project.
