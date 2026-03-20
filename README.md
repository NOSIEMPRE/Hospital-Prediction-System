# IE-MLOps-Group-Project-Team3

**Hospital Readmission Risk Prediction** — An end-to-end ML system for proactive patient care.

---

## Project Overview

This project builds a machine learning system to predict 30-day readmission risk for diabetic inpatients. Risk scores are served via a FastAPI API, enabling care coordinators to prioritize follow-up for high-risk patients.

- **Dataset**: Diabetes 130-US Hospitals (UCI ML Repository, id 296) — Strack et al., 2014  
- **Target**: Binary classification — readmitted within 30 days (yes/no)  
- **Final Deliverable**: 16 March 2026 (Demo Day)

---

## Team Members

Marian, Marco, Yaxin, Lorenz, Jorge, Omar

---

## Hands-On Roadmap

| Phase | Module | Description |
|-------|--------|-------------|
| 1 | [01-initial-notebook](01-initial-notebook/README.md) | EDA, baseline Logistic Regression |
| 2 | [02-data-sampling-feature](02-data-sampling-feature/README.md) | Feature engineering, patient-level split |
| 3 | [03-experiment-tracking](03-experiment-tracking/README.md) | MLflow, XGBoost/LightGBM, Optuna |
| 4 | [04-deployment](04-deployment/README.md) | Model serving (FastAPI) |
| 5 | [05-monitoring](05-monitoring/README.md) | Drift detection, Evidently |
| 6 | [06-cicd](06-cicd/README.md) | CI/CD, Docker, Render, Streamlit UI |

---

## Repository Structure

```
├── 01-initial-notebook/           # EDA & baseline
│   ├── hospital_readmission_prediction.ipynb
│   ├── eda_diabetes_readmission.ipynb
│   └── README.md
├── 02-data-sampling-feature/      # Feature engineering
│   ├── features.ipynb            # Full FE: CCS, Charlson, train/val/test split
│   ├── hospital_readmission_data_fe.ipynb
│   └── README.md
├── 03-experiment-tracking/       # MLflow experiments
│   ├── scenario-1.ipynb           # Baseline (LR)
│   ├── scenario-2.ipynb           # XGBoost/LightGBM + Optuna
│   └── README.md
├── 04-deployment/                # FastAPI serving
│   ├── train.py, app.py, test_api.py
│   └── README.md
├── 05-monitoring/                # Drift detection
│   ├── train.py, app.py, simulate.py, monitor.py
│   └── README.md
├── 06-cicd/                      # CI/CD & production
│   ├── train.py                  # Training (XGBoost, MLflow)
│   ├── app.py                    # FastAPI service
│   ├── streamlit_app.py          # Live test UI
│   ├── test_api.py, Dockerfile
│   ├── .streamlit/config.toml
│   ├── requirements.txt
│   └── README.md
├── .github/workflows/
│   ├── ci-cd.yml                 # Main pipeline
│   └── train.yml                 # Training job
├── data/                         # Datasets
│   ├── diabetic_data.csv         # Raw (download from UCI)
│   ├── processed/                # train.csv, val.csv, test.csv
│   └── README.md
├── docs/                         # Proposals, PDFs
├── render.yaml                   # Render.com deployment
├── README.md
└── .flake8
```

---

## Key Deliverables

| Deliverable | Status |
| :--- | :--- |
| Model training script (train.py, MLflow) | ✅ |
| Serving API (app.py, FastAPI) | ✅ |
| Dockerfile | ✅ |
| CI/CD workflow (.github/workflows/ci-cd.yml) | ✅ |
| Lint + test + build + deploy | ✅ |
| Deployment manifest (render.yaml) | ✅ |
| Working online endpoint (Render) | ✅ |
| Streamlit live test UI | ✅ |
| README.md | ✅ |

**Live API:** https://hospital-readmission-risk-predictor-pcv7.onrender.com

---

## Getting Started

### 1. Clone and setup

```bash
git clone https://github.com/NOSIEMPRE/Hospital-Prediction-System.git
cd IE_MLOps_Group-Project_Team3
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r 06-cicd/requirements.txt
```

### 2. Prepare data

Download [Diabetes 130-US Hospitals](https://archive.ics.uci.edu/dataset/296) and place `diabetic_data.csv` in `data/`.

### 3. Train and run API

```bash
cd 06-cicd
python train.py
python app.py
```

API runs at http://localhost:9696

### 4. Live test (Streamlit)

In a new terminal:

```bash
cd 06-cicd
streamlit run streamlit_app.py
```

- **Quick demo**: One-click prediction with sample patient  
- **Custom form**: Enter patient data and call `/predict`  
- **Sidebar**: Set API URL (localhost or Render) and check health

### 5. Test API (curl)

**Local:**
```bash
curl http://localhost:9696/health
curl -X POST http://localhost:9696/predict -H "Content-Type: application/json" \
  -d '{"time_in_hospital":3,"num_lab_procedures":41,"num_procedures":0,"num_medications":8,"number_emergency":0,"number_inpatient":0,"number_outpatient":0,"number_diagnoses":9,"care_intensity":0,"admission_type_id":1,"discharge_disposition_id":1,"admission_source_id":7,"age":"[50-60)","gender":"Female","race":"Caucasian","change":"Ch","diabetesMed":"Yes","medication_changed":1,"A1Cresult":"not_tested","max_glu_serum":"not_tested"}'
```

**Online (Render):**
```bash
curl https://hospital-readmission-risk-predictor-pcv7.onrender.com/health
```

---

## References

- Strack, B., et al. (2014). Impact of HbA1c Measurement on Hospital Readmission Rates. *BioMed Research International*.  
- UCI Machine Learning Repository. (2014). Diabetes 130-US Hospitals.  
- Huyen, C. (2022). *Designing Machine Learning Systems*. O'Reilly Media.
- IE University. (2026). *Machine Learning Operations* — Final Group Project.
