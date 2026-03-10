# IE-MLOps-Group-Project-Team3

**Hospital Readmission Risk Prediction** — An end-to-end ML system for proactive patient care.

---

## Project Overview

This project builds a machine learning system to predict 30-day readmission risk for diabetic inpatients. Risk scores are pre-computed and served via a FastAPI API, enabling care coordinators to prioritize follow-up for high-risk patients.

- **Dataset**: Diabetes 130-US Hospitals (UCI ML Repository, id 296) — Strack et al., 2014  
- **Target**: Binary classification — readmitted within 30 days (yes/no)  
- **Final Deliverable**: 16 March 2026 (Demo Day)

---

## Team Members

Marian, Marco, Yaxin, Lorenz, Jorge, Omar

---

## Hands-On Roadmap (Final Group Project)

| Phase | Module | Description |
|-------|--------|-------------|
| 1 | **01-initial-notebook** | EDA, data exploration |
| 2 | **02-data-sampling-feature** | Data sampling, feature engineering |
| 3 | **03-experiment-tracking** | MLflow, model selection |
| 4 | **04-deployment** | Model serving (FastAPI) |
| 5 | **05-monitoring** | Drift detection |
| 6 | **06-cicd** | Automation, CI/CD, Docker, Render |

---

## Repository Structure

```
├── 01-initial-notebook/       # EDA
│   ├── eda_diabetes_readmission.ipynb
│   └── README.md
├── 02-data-sampling-feature/  # Feature engineering
├── 03-experiment-tracking/    # MLflow experiments
├── 04-deployment/             # Serving API
├── 05-monitoring/             # Drift detection
├── 06-cicd/                   # CI/CD, Docker, deploy
│   ├── app.py                 # FastAPI service
│   ├── train.py               # Training script
│   ├── test_api.py            # API tests
│   ├── Dockerfile
│   ├── requirements.txt
│   └── README.md
├── .github/workflows/
│   ├── ci-cd.yml              # Main pipeline
│   └── train.yml              # Training job
├── data/                      # Datasets (diabetic_data.csv)
├── docs/                      # Proposals, PDFs
├── render.yaml                # Render.com deployment
├── README.md
└── .flake8
```

---

## Key Deliverables (Final Group Project)

| Deliverable | Status |
| :--- | :--- |
| Model training script (train.py, MLflow) | ✅ |
| Serving API (app.py, FastAPI) | ✅ |
| Dockerfile | ✅ |
| CI/CD workflow (.github/workflows/ci-cd.yml) | ✅ |
| Lint + test + build + deploy | ✅ |
| Deployment manifest (render.yaml) | ✅ |
| Working online endpoint (Render) | ✅ |
| README.md | ✅ |

**Live API:** https://hospital-readmission-risk-predictor-pcv7.onrender.com

---

## Getting Started

### 1. Clone and setup

```bash
git clone <repo-url>
cd IE_MLOps_Group-Project_Team3
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r 06-cicd/requirements.txt
```

### 2. Prepare data

Download [Diabetes 130-US Hospitals](https://archive.ics.uci.edu/dataset/296) and place `diabetic_data.csv` in `data/`.

### 3. Train and deploy

```bash
cd 06-cicd
python train.py
uvicorn app:app --host 0.0.0.0 --port 9696
```

### 4. Test API

**Local:**
```bash
curl http://localhost:9696/health
curl -X POST http://localhost:9696/predict -H "Content-Type: application/json" \
  -d '{"time_in_hospital":3,"num_lab_procedures":41,"num_procedures":0,"num_medications":8,"number_emergency":0,"number_inpatient":0,"number_outpatient":0,"number_diagnoses":9,"care_intensity":0,"admission_type_id":1,"discharge_disposition_id":1,"admission_source_id":7,"age":"[50-60)","gender":"Female","race":"Caucasian","change":"Ch","diabetesMed":"Yes","medication_changed":1,"A1Cresult":"not_tested","max_glu_serum":"not_tested"}'
```

**Online (Render):**
```bash
curl https://hospital-readmission-risk-predictor-pcv7.onrender.com/health
curl -X POST https://hospital-readmission-risk-predictor-pcv7.onrender.com/predict \
  -H "Content-Type: application/json" \
  -d '{"time_in_hospital":3,"num_lab_procedures":41,"num_procedures":0,"num_medications":8,"number_emergency":0,"number_inpatient":0,"number_outpatient":0,"number_diagnoses":9,"care_intensity":0,"admission_type_id":1,"discharge_disposition_id":1,"admission_source_id":7,"age":"[50-60)","gender":"Female","race":"Caucasian","change":"Ch","diabetesMed":"Yes","medication_changed":1,"A1Cresult":"not_tested","max_glu_serum":"not_tested"}'
```

---

## References

- Strack, B., et al. (2014). Impact of HbA1c Measurement on Hospital Readmission Rates. *BioMed Research International*.  
- UCI Machine Learning Repository. (2014). Diabetes 130-US Hospitals.  
- Huyen, C. (2022). *Designing Machine Learning Systems*. O'Reilly Media.
- IE University. (2026). *Machine Learning Operations* — Final Group Project.
