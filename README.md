# IE-MLOps-Group-Project-Team3

**Hospital Readmission Risk Prediction** — An end-to-end MLOps system for proactive patient care.

![CI/CD](https://github.com/NOSIEMPRE/Hospital-Prediction-System/actions/workflows/ci-cd.yml/badge.svg)

---

## Project Overview

This project builds a machine learning system to predict 30-day readmission risk for diabetic inpatients. Risk scores are served via a FastAPI REST API with SHAP explainability, a Streamlit clinical dashboard, and a React + Node.js full-stack frontend.

- **Dataset**: Diabetes 130-US Hospitals (UCI ML Repository, id 296) — Strack et al., 2014
- **Target**: Binary classification — readmitted within 30 days (yes/no)
- **Model**: XGBoost pipeline tracked with MLflow, quality-gated (PR-AUC ≥ 0.15)
- **Live API docs**: [hospital-prediction-system.onrender.com/docs](https://hospital-prediction-system.onrender.com/docs)
- **Streamlit dashboard**: [hospital-prediction-system.streamlit.app](https://hospital-prediction-system.streamlit.app)
- **React platform**: [hospital-prediction-system-1.onrender.com](https://hospital-prediction-system-1.onrender.com)
- **Walkthrough**: [WALKTHROUGH_EN.md](WALKTHROUGH_EN.md)

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
cd Hospital-Prediction-System
```

It is recommended to create a dedicated virtual environment to avoid conflicts with your base environment:

```bash
# Option A — conda
conda create -n mlops python=3.11
conda activate mlops

# Option B — venv
python -m venv .venv
source .venv/bin/activate   # Mac/Linux
```

Then install dependencies:

```bash
pip install -r 06-cicd/requirements.txt
```

> Remember to activate the environment (`conda activate mlops` or `source .venv/bin/activate`) in every new terminal window before running any commands.

### 2. Download data

Download [Diabetes 130-US Hospitals](https://archive.ics.uci.edu/dataset/296) and place `diabetic_data.csv` in `data/`.

### 3. Train model (MLflow)

```bash
cd 06-cicd
python train.py
```

This will:

- Run feature engineering and patient-level train/val split
- Train an XGBoost pipeline tracked in MLflow (`mlruns/`)
- Enforce the quality gate (PR-AUC ≥ 0.15) — raises `ModelQualityError` if not met
- Save the model artifact to `models/model/` and write `run_id.txt`

**View MLflow experiment UI** (optional, open in a separate terminal):

```bash
cd 06-cicd
mlflow ui --backend-store-uri sqlite:///mlflow.db
# → http://localhost:5000
```

Browse runs, compare metrics (PR-AUC, ROC-AUC), and inspect logged parameters.

### 4. Run FastAPI

```bash
cd 06-cicd
python app.py
# → http://localhost:9696
```

Key endpoints:

| Endpoint | Method | Description |
| --- | --- | --- |
| `/health` | GET | Model status and run ID |
| `/predict` | POST | Single patient risk score + SHAP values |
| `/predict/batch` | POST | Batch predictions |
| `/docs` | GET | Interactive API documentation (Swagger UI) |

**Interactive API docs** — open in browser after starting:

```text
http://localhost:9696/docs
```

Fill in patient fields and test `/predict` directly from the browser — no curl needed.

**Prediction audit log** — every call to `/predict` is appended to:

```bash
cat 06-cicd/data/predictions.log
```

**Test via curl:**

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
    "A1Cresult": "not_tested", "max_glu_serum": "not_tested"
  }'
```

### 5. Run Streamlit dashboard

```bash
streamlit run 06-cicd/streamlit_app.py
# → http://localhost:8501
```

The sidebar lets you switch between **Local API** (`http://localhost:9696`, requires `app.py` running) and **Cloud API** (Render, no local setup needed but subject to cold-start delays).

### 6. Run React frontend

The React frontend uses a 3-layer architecture. All 3 processes must be running at the same time:

```text
Browser (5173) → Node.js proxy (3001) → FastAPI (9696)
```

No need to clone again — open 3 separate terminal windows and `cd` into the same local folder from each.

#### Terminal 1 — FastAPI ML API (keep running from step 4)

Serves the machine learning model and handles predictions.

```bash
cd 06-cicd
python app.py
# → http://localhost:9696
```

#### Terminal 2 — Node.js proxy (backend middleware)

Sits between the React UI and FastAPI. Handles request forwarding, CORS, and error handling. The React app never calls FastAPI directly.

Before starting, create the environment file:

```bash
cd 06-cicd/frontend/server
echo 'ML_API_URL=http://localhost:9696' > .env
```

Then start the proxy:

```bash
npm install
npm run dev
# → http://localhost:3001
# You should see: 📡 ML API: http://localhost:9696
```

#### Terminal 3 — React client (UI)

Renders the frontend pages in the browser. Sends all API calls to the Node.js proxy, not to FastAPI.

```bash
cd 06-cicd/frontend/client
npm install
npm run dev
# → Open http://localhost:5173 in your browser
```

### 7. Deploy to Render (CI/CD)

Render deployment is triggered automatically by the CI/CD pipeline on every push to `main`. To trigger manually:

1. Go to **GitHub Actions → CI/CD Pipeline**
2. Click **Run workflow**

The pipeline runs: lint → train → test → build Docker image → push to GHCR → deploy to Render.

**Live services** (no local setup required):

```text
https://hospital-prediction-system.onrender.com/health       ← FastAPI
https://hospital-prediction-system.onrender.com/docs         ← API docs
https://hospital-prediction-system.streamlit.app             ← Streamlit dashboard
https://hospital-prediction-system-1.onrender.com            ← React platform
```

> Note: Render free tier has a cold-start delay of ~30–60 seconds after periods of inactivity.

### 8. Run Evidently monitoring report

Evidently generates a static HTML report comparing training data distribution against production traffic. It does **not** require a running server.

```bash
cd 05-monitoring
python simulate.py   # simulate production traffic (calls the API ~100 times)
python monitor.py    # generate monitoring_report.html
open monitoring_report.html   # open in browser (Mac)
```

The report shows:

- Feature drift (KS test / chi-squared for each input feature)
- Target drift (has the readmission rate shifted?)
- Model performance metrics (precision, recall, F1)

> Evidently does not have a live web dashboard in this project — the output is a static HTML file generated on demand.

---

## Documentation

See [WALKTHROUGH_EN.md](WALKTHROUGH_EN.md) for a full technical walkthrough of the entire MLOps pipeline — from raw data to cloud deployment.

---

## Pipeline Architecture

```mermaid
flowchart LR
    DATA[("diabetic_data.csv\n101,766 records")]

    subgraph TRAIN["Training  —  train.py"]
        direction TB
        FE["Feature Engineering\nDictVectorizer"] --> SPLIT["Stratified Split\n80/20 by patient"]
        SPLIT --> MODEL["XGBoost Pipeline"]
        MODEL --> QG{"Quality Gate\nPR-AUC >= 0.15"}
        QG -- fail --> ERR["ModelQualityError\nblocks pipeline"]
        QG -- pass --> MLFLOW["MLflow\ntrack metrics & artifacts"]
        MLFLOW --> PKL["model.pkl"]
    end

    subgraph SERVE["Serving  —  app.py"]
        direction TB
        FASTAPI["FastAPI  :9696"]
        FASTAPI --> P1["/predict"]
        FASTAPI --> P2["/predict/batch"]
        FASTAPI --> P3["/health"]
        FASTAPI --> LOG["predictions.log"]
    end

    subgraph CICD["CI/CD  —  GitHub Actions"]
        direction TB
        GH["git push to main"] --> PIPE["lint → train → test"]
        PIPE --> DOCKER["Docker image\nbaked model → GHCR"]
        DOCKER --> RENDER["Render\ncloud deployment"]
    end

    subgraph CLIENTS["Frontends"]
        direction TB
        ST["Streamlit  :8501"]
        REACT["React  :5173"] --> PROXY["Node.js Proxy  :3001"]
    end

    subgraph MONITOR["Monitoring  —  Evidently"]
        direction TB
        SIM["simulate.py"] --> MON["monitor.py"]
        MON --> REPORT["monitoring_report.html"]
    end

    DATA --> TRAIN
    PKL --> SERVE
    PKL --> CICD
    SERVE --> CLIENTS
    SERVE --> MONITOR
```

---

## References

- Strack, B., et al. (2014). Impact of HbA1c Measurement on Hospital Readmission Rates. *BioMed Research International*.
- UCI Machine Learning Repository. (2014). Diabetes 130-US Hospitals.
- Huyen, C. (2022). *Designing Machine Learning Systems*. O'Reilly Media.
- IE University. (2026). *Machine Learning Operations* — Final Group Project.
