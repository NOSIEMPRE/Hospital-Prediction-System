# Technical Walkthrough: Hospital Readmission Risk Prediction — MLOps Pipeline

> **Audience**: After reading this document, you should be able to explain every step of the pipeline end-to-end.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Data](#2-data)
3. [Feature Engineering](#3-feature-engineering)
4. [Experiment Tracking with MLflow](#4-experiment-tracking-with-mlflow)
5. [Model Training](#5-model-training)
6. [Model Serving with FastAPI](#6-model-serving-with-fastapi)
7. [Monitoring with Evidently](#7-monitoring-with-evidently)
8. [Containerization with Docker](#8-containerization-with-docker)
9. [CI/CD Pipeline](#9-cicd-pipeline)
10. [Cloud Deployment on Render](#10-cloud-deployment-on-render)
11. [End-to-End Flow Summary](#11-end-to-end-flow-summary)

---

## 1. Project Overview

This project builds a **production-grade MLOps system** that predicts whether a diabetic hospital patient will be readmitted within 30 days of discharge. It is not just a model — it is a complete pipeline from raw data to a live API deployed on the cloud.

The project is organized into 6 phases:

| Phase | Folder | What it does |
|-------|--------|--------------|
| 1 | `01-initial-notebook/` | Exploratory Data Analysis (EDA) + Logistic Regression baseline |
| 2 | `02-data-sampling-feature/` | Feature engineering + patient-level train/val split |
| 3 | `03-experiment-tracking/` | MLflow experiment tracking + hyperparameter tuning |
| 4 | `04-deployment/` | Standalone FastAPI serving (dev version) |
| 5 | `05-monitoring/` | Drift detection with Evidently |
| 6 | `06-cicd/` | **Production**: Docker + CI/CD + Render deployment |

The **main deliverable** lives in `06-cicd/`. Everything in phases 1–5 is the development journey that led to it.

---

## 2. Data

**Dataset**: Diabetes 130-US Hospitals (UCI Repository, ID 296)

- **Raw file**: `data/diabetic_data.csv`
- **Size**: 101,766 patient encounters, covering 71,518 unique patients
- **Time period**: 1999–2008, 130 US hospitals
- **Target variable**: `readmitted` — whether the patient was readmitted within 30 days

### Target Encoding

The original column has three values:
- `<30` → readmitted within 30 days (**positive**)
- `>30` → readmitted after 30 days (treated as negative for this task)
- `NO` → not readmitted (**negative**)

In `train.py`, it is converted into a **binary target**:
```python
df["target"] = df["readmitted"].isin(["30", "<30"]).astype(int)
```
**Positive rate ≈ 11.2%** — the dataset is heavily class-imbalanced.

### Key Data Quality Issues

| Column | Issue | Fix |
|--------|-------|-----|
| `weight` | 96%+ missing | Dropped entirely |
| `medical_specialty` | Many `?` values | Replaced with `"Unknown"` |
| `payer_code` | Many nulls | Replaced with `"Unknown"` |
| `race` | Some `?` values | Replaced with `"Unknown"` |
| `A1Cresult` | `None` string | Normalized to `"not_tested"` |
| `max_glu_serum` | `None` string | Normalized to `"not_tested"` |
| `age` | Nulls | Default to `"[50-60)"` |

### Train/Validation Split — Patient-Level

This is a **critical design decision**. A naive row-level split would allow the same patient to appear in both train and validation sets (since one patient may have multiple visits), causing **data leakage** — the model learns patient-specific patterns that don't generalize.

The fix: split by **patient ID (`patient_nbr`)**, not by row:
```python
patient_target = df.groupby("patient_nbr")["target"].max()
train_patients, val_patients = train_test_split(
    patient_target.index.tolist(),
    test_size=0.2,
    random_state=42,
    stratify=patient_target.values,   # keeps class ratio
)
df_train = df[df["patient_nbr"].isin(train_patients)]
df_val   = df[df["patient_nbr"].isin(val_patients)]
```
Result: **no patient appears in both sets**. The `stratify` parameter ensures the 11.2% positive rate is maintained in both splits.

---

## 3. Feature Engineering

After cleaning, 20 features are selected for the model. These are defined in `FEATURE_COLS` in `train.py`.

### Feature Categories

**Numeric (Continuous/Count)**:
| Feature | Description |
|---------|-------------|
| `time_in_hospital` | Number of days in hospital (1–14) |
| `num_lab_procedures` | Lab tests conducted |
| `num_procedures` | Non-lab procedures performed |
| `num_medications` | Distinct medications administered |
| `number_emergency` | Emergency visits in prior year |
| `number_inpatient` | Inpatient visits in prior year |
| `number_outpatient` | Outpatient visits in prior year |
| `number_diagnoses` | Number of diagnoses recorded |

**Categorical (Encoded)**:
| Feature | Description |
|---------|-------------|
| `age` | Age group: `[10-20)`, `[20-30)`, ..., `[90-100)` |
| `gender` | Male / Female / Unknown |
| `race` | Caucasian / AfricanAmerican / Hispanic / Asian / Other / Unknown |
| `change` | Was medication changed? `No` or `Ch` |
| `diabetesMed` | Was diabetes medication prescribed? `Yes` or `No` |
| `A1Cresult` | HbA1c test result: `>7`, `>8`, `Norm`, `not_tested` |
| `max_glu_serum` | Max glucose serum: `>200`, `>300`, `Norm`, `not_tested` |
| `admission_type_id` | Type of admission (1=Emergency, 2=Urgent, etc.) |
| `discharge_disposition_id` | Discharge destination ID |
| `admission_source_id` | Referral source ID |

**Derived Features (engineered from existing columns)**:
| Feature | Formula | Meaning |
|---------|---------|---------|
| `care_intensity` | `emergency + inpatient + outpatient` | Total healthcare utilization load |
| `medication_changed` | `1 if change == "Ch" else 0` | Binary version of the `change` flag |

### Feature Vectorization

The model uses a **`DictVectorizer`** from scikit-learn to convert the list of feature dictionaries into a sparse matrix. This automatically one-hot encodes categorical features and passes numerics through unchanged.

A custom wrapper `DictVectorizerWrapper` is created to make it compatible with scikit-learn's `Pipeline` API:
```python
class DictVectorizerWrapper(BaseEstimator, TransformerMixin):
    def __init__(self):
        self.dv = DictVectorizer(sparse=True)
    def fit(self, X, y=None):
        self.dv.fit(X); return self
    def transform(self, X):
        return self.dv.transform(X)
```
The full pipeline is:
```
List of dicts → DictVectorizerWrapper → sparse matrix → XGBoostClassifier
```

---

## 4. Experiment Tracking with MLflow

MLflow is used to track every training run — parameters, metrics, and the model artifact itself. This makes experiments **reproducible and comparable**.

### MLflow Setup

MLflow is configured to use a **local SQLite database** as the tracking backend:
```yaml
# config.yaml
mlflow:
  db: "mlflow.db"
  experiment_name: "hospital-readmission-risk"
```
In `train.py`:
```python
tracking_uri = f"sqlite:///{_SCRIPT_DIR / mlflow_cfg['db']}"
mlflow.set_tracking_uri(tracking_uri)
mlflow.set_experiment(mlflow_cfg["experiment_name"])
```
The `mlflow.db` file is created at `06-cicd/mlflow.db` when training runs.

### What is Logged

Inside `mlflow.start_run()`, the following are recorded:
```python
mlflow.log_params(params)                       # All XGBoost hyperparameters
mlflow.log_metric("pr_auc", pr_auc)             # Primary metric
mlflow.log_metric("roc_auc", roc_auc)           # Secondary metric
mlflow.sklearn.log_model(pipeline, "model")     # Full sklearn Pipeline artifact
```
The `run_id` from each run is saved to `run_id.txt` for the API to reference at startup.

### Why PR-AUC as Primary Metric?

With only 11.2% positive cases, **accuracy is misleading** — a model that always predicts "no readmission" achieves 88.8% accuracy while being completely useless.

- **ROC-AUC**: measures overall discrimination ability
- **PR-AUC (Precision-Recall AUC)**: measures performance specifically on the **positive class** — much more informative for imbalanced datasets

**Baseline** (Logistic Regression, Phase 1): PR-AUC ≈ 0.189
**Tuned** (XGBoost + Optuna, Phase 3): PR-AUC > 0.189 (promotion threshold)

### MLflow UI

To browse experiments locally:
```bash
cd 06-cicd
mlflow ui --backend-store-uri sqlite:///mlflow.db --port 5001
# Open: http://localhost:5001
```

---

## 5. Model Training

The final model is an **XGBoost classifier** wrapped in a scikit-learn `Pipeline`. It is trained in `train.py` with parameters from `config.yaml`.

### Model Architecture

```
Pipeline([
    ("vectorizer", DictVectorizerWrapper()),   # step 1: feature encoding
    ("classifier", XGBClassifier(...))          # step 2: gradient boosting
])
```

Wrapping XGBoost in a Pipeline means the **entire model (feature encoding + classifier) is saved as one artifact**. When loading for prediction, there is no need to separately re-apply the vectorizer.

### Hyperparameters

```yaml
# config.yaml
model:
  objective: "binary:logistic"   # binary classification, probability output
  max_depth: 6                   # maximum tree depth
  learning_rate: 0.1             # shrinkage rate
  n_estimators: 100              # number of trees
  subsample: 0.8                 # fraction of samples per tree
  colsample_bytree: 0.8          # fraction of features per tree
  eval_metric: "aucpr"           # optimize for PR-AUC
```

### Handling Class Imbalance

XGBoost has a built-in parameter `scale_pos_weight` that assigns higher importance to the minority class. It is computed automatically:
```python
scale_pos_weight = (y_train == 0).sum() / max((y_train == 1).sum(), 1)
# ≈ 89 / 11 ≈ 8.1  (negatives / positives)
```
This tells XGBoost: "treat each positive example as if it were ~8x more important than a negative one."

### Quality Gate

After training, a **quality gate** is enforced before the model is saved:
```python
# config.yaml
model:
  min_pr_auc: 0.15

# train.py
if pr_auc < min_pr_auc:
    raise ModelQualityError(f"PR-AUC {pr_auc:.4f} below threshold {min_pr_auc}")
```
If the model does not meet the minimum PR-AUC of 0.15, training **fails with an error** — the model is never saved and CI/CD is blocked. This prevents a degraded model from reaching production.

### Model Saving

After passing the quality gate, the model is saved **twice**:
1. **MLflow artifact store**: logged with `mlflow.sklearn.log_model()` — for experiment tracking
2. **Deployment path**: saved to `06-cicd/models/model/` with `mlflow.sklearn.save_model()` — for baking into Docker

```python
deployment_path = _SCRIPT_DIR / "models" / "model"
if deployment_path.exists():
    shutil.rmtree(deployment_path)  # clean old model
mlflow.sklearn.save_model(pipeline, str(deployment_path))
```

The `models/model/` directory contains the standard MLflow model structure:
```
models/model/
├── MLmodel          # metadata (flavor, input schema)
├── model.pkl        # serialized sklearn pipeline
├── conda.yaml       # conda environment spec
└── requirements.txt # pip requirements
```

### Running Locally

```bash
cd 06-cicd
python train.py
# Output:
# === Hospital Readmission Risk Training ===
# Loading raw data from .../data/diabetic_data.csv ...
# Loaded 50000 rows, target positive rate: 11.xx%
# Training model ...
# PR-AUC: 0.xxx  ROC-AUC: 0.xxx
# MLflow Run ID: <uuid>
# Model saved to .../06-cicd/models/model
# Training complete.
```

---

## 6. Model Serving with FastAPI

`app.py` is the **production API server**. It loads the trained model at startup and serves predictions over HTTP, with SHAP explainability, prediction logging, and request tracing.

### Startup: Loading the Model

FastAPI uses an **async lifespan context manager** to load the model once when the server starts:
```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    global RUN_ID, model, prediction_logger

    # 1. Initialize prediction audit logger
    prediction_logger = PredictionLogger("data/predictions.log")

    # 2. Read the run_id for traceability
    run_id_path = Path("run_id.txt")
    if run_id_path.exists():
        RUN_ID = run_id_path.read_text().strip()

    # 3. Load the model from the saved MLflow directory
    model_path = Path("models/model")
    if model_path.exists():
        model = mlflow.sklearn.load_model(str(model_path))

    yield   # server is now running
```
The `model`, `RUN_ID`, and `prediction_logger` are stored as module-level globals, accessible by all request handlers.

### Middleware

Two middleware layers wrap every request:

**CORS** — allows the React frontend and Streamlit app to call the API from a different origin (port):
```python
app.add_middleware(CORSMiddleware, allow_origins=["*"], ...)
```

**Request tracing** — every request is assigned a unique `X-Request-ID` UUID and response time is logged:
```python
logger.info("%s %s -> %d (%.1fms) [%s]", method, path, status, ms, request_id)
```

### API Endpoints

**`GET /health`** — Health check, used by Render to verify the container is alive:
```json
{
  "status": "ok",
  "run_id": "abc123...",
  "model_loaded": true
}
```

**`POST /predict`** — Single patient prediction, returns risk score + SHAP explainability

**`POST /predict/batch`** — Batch predictions for multiple patients

**`GET /docs`** — Interactive Swagger UI (auto-generated by FastAPI)

### Request Validation with Pydantic

Pydantic automatically validates every incoming request using **strict Literal types** for categorical fields. Invalid inputs are rejected with `422 Unprocessable Entity` before the model is ever called:
```python
class PatientRequest(BaseModel):
    time_in_hospital: int = Field(..., ge=1, le=14)   # must be 1–14
    age: Literal["[0-10)", "[10-20)", ..., "[90-100)"] # only valid age brackets
    gender: Literal["Female", "Male", "Unknown/Invalid"]
    # care_intensity and medication_changed are optional — auto-computed if omitted
```

Two derived fields are **auto-computed** in a `model_validator` if the caller doesn't provide them:
```python
care_intensity = number_emergency + number_inpatient + number_outpatient
medication_changed = 1 if change == "Ch" else 0
```

### Prediction Logic

Each call to `/predict` runs 4 steps:

```python
# 1. Run the sklearn Pipeline: DictVectorizer → XGBoost → probability
feature_dict = patient.model_dump()
pred_proba = model.predict_proba([feature_dict])[0, 1]   # 0.0 – 1.0

# 2. Calculate SHAP values for explainability
vectorizer = model.named_steps["vectorizer"]
classifier = model.named_steps["classifier"]
feature_matrix = vectorizer.transform([feature_dict]).toarray()
explainer = shap.TreeExplainer(classifier)
shap_values = explainer.shap_values(feature_matrix)
# → top features by absolute SHAP value returned in response

# 3. Log to audit trail
prediction_logger.log(request_id, risk_score, model_version)

# 4. Return response
return PredictionResponse(
    risk_score=float(pred_proba),
    model_version=RUN_ID,
    shap_values={"age=[50-60)": 0.12, "number_inpatient": 0.08, ...},
    base_value=0.11,   # average model output (log-odds)
)
```

**SHAP values** quantify each feature's contribution to the individual prediction. A positive SHAP value means the feature pushed the risk score up; negative means it pushed it down. This makes the model's reasoning **transparent and auditable**.

### Prediction Logging

Every prediction is appended to `data/predictions.log` (CSV format):

```text
ts,request_id,risk_score,model_version
2026-03-23T12:00:00,uuid-abc,0.342,5fb8ee64
```

This creates an **append-only audit trail** for downstream monitoring and compliance.

### Auto-generated Documentation

FastAPI auto-generates interactive API docs:

- **Swagger UI**: `http://localhost:9696/docs` — fill fields and test directly in the browser
- **ReDoc**: `http://localhost:9696/redoc`

### Running Locally

```bash
cd 06-cicd
python app.py
# → Uvicorn starts on http://0.0.0.0:9696
```

---

## 7. Monitoring with Evidently

Phase 5 (`05-monitoring/`) adds **data drift detection** using the Evidently library. This addresses a common production problem: model performance degrades silently because the real-world data distribution shifts over time.

### Workflow

1. **Train**: Run `train.py` to train the model and save it.
2. **Simulate**: Run `simulate.py` to make ~100 prediction calls against the API, simulating production traffic.
3. **Monitor**: Run `monitor.py` which uses Evidently to:
   - Compare the training data distribution against the simulated serving data
   - Detect feature drift (are the input distributions changing?)
   - Compute classification performance metrics
   - Generate `monitoring_report.html`

### What Evidently Detects

- **Data drift**: Statistical tests (KS test, chi-squared) to check if feature distributions in production differ significantly from training
- **Target drift**: Has the proportion of readmissions changed over time?
- **Model performance**: Precision, recall, F1 on production data (if labels are available)

### Why This Matters

Without monitoring, the model might silently degrade because hospital admission practices changed, or new drug/diagnosis codes appear that were never in the training data. The team would only discover problems when patients are harmed.

With Evidently: drift is caught early, triggering a retraining cycle.

---

## 8. Containerization with Docker

The `Dockerfile` packages everything needed to run the API into a single **portable, reproducible image**.

### Dockerfile Breakdown

```dockerfile
# 1. Base image: minimal Python 3.12
FROM python:3.12-slim

# 2. Install system dependency: unzip (for model artifact unpacking)
RUN apt-get update -qq && apt-get install -y -qq unzip && rm -rf /var/lib/apt/lists/*

# 3. Set working directory inside container
WORKDIR /app

# 4. Copy & install Python dependencies first (layer caching optimization)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 5. Copy all source code and pre-trained model
COPY . .

# 6. Handle model packaged as zip (from GitHub Actions artifact)
RUN if [ -f models/model.zip ]; then \
      unzip -o models/model.zip -d models/ && rm models/model.zip; \
    fi && echo "Model ready in /app/models"

# 7. Expose port
EXPOSE 9696

# 8. Start the FastAPI server with uvicorn
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "9696"]
```

### Key Design: Model Baked Into Image

The model files (`models/model/`) are **copied into the image during `docker build`**. This means:
- ✅ The image is **self-contained** — no need to download the model at runtime
- ✅ Each image tag corresponds to a specific model version
- ✅ Rollback = pull an older image tag
- ⚠️ The image is larger (~500MB–1GB), but this is acceptable for production

### Layer Caching Optimization

`requirements.txt` is copied and installed **before** the rest of the code. Docker caches each layer independently. If only `app.py` changes (not `requirements.txt`), Docker skips the slow `pip install` step on rebuild — saving several minutes per CI/CD run.

### Building and Running Locally

```bash
cd 06-cicd

# Build image
docker build -t hospital-readmission-app .

# Run container
docker run -p 9696:9696 hospital-readmission-app

# Test
curl http://localhost:9696/health
```

---

## 9. CI/CD Pipeline

This is the **automation backbone** of the project. Every `git push` to `main` automatically triggers training, testing, and deployment — no manual steps needed.

### Two Workflow Files

```
.github/workflows/
├── train.yml      # Reusable: trains the model, uploads artifact
└── ci-cd.yml      # Main: calls train.yml, then build/test/deploy
```

### Complete Pipeline Visualization

```
git push → main
       │
       ▼
┌──────────────────────────────────────────────────────────────┐
│  Job 1: call-train  (runs train.yml)                         │
│                                                              │
│  1. Checkout code                                            │
│  2. Set up Python 3.12                                       │
│  3. pip install -r 06-cicd/requirements.txt                  │
│  4. python 06-cicd/train.py                                  │
│     → reads data/diabetic_data.csv                           │
│     → trains XGBoost model                                   │
│     → saves to 06-cicd/models/model/                         │
│     → writes 06-cicd/run_id.txt                              │
│  5. Upload artifact: "trained-model"                         │
│     (run_id.txt + models/ → retained 7 days)                 │
└──────────────────────────────────────────────────────────────┘
       │
       │ (artifact passed between jobs)
       ▼
┌──────────────────────────────────────────────────────────────┐
│  Job 2: build-test-deploy  (needs: call-train)               │
│                                                              │
│  1. Checkout code                                            │
│  2. Set up Python 3.12                                       │
│  3. pip install requirements + flake8                        │
│  4. rm -rf 06-cicd/models 06-cicd/run_id.txt                 │
│     (remove committed model — replace with fresh artifact)   │
│  5. Download artifact "trained-model" → 06-cicd/             │
│  6. Verify: ls -R 06-cicd/models, cat run_id.txt            │
│  7. LINT: flake8 06-cicd/                                    │
│  8. UNIT TESTS: PYTHONPATH=. pytest test_train.py            │
│  9. BUILD DOCKER: docker build -t hospital-readmission-app . │
│ 10. RUN CONTAINER: docker run -d -p 9696:9696 ...           │
│ 11. HEALTH CHECK LOOP (retry every 5s, up to 2 min):        │
│     curl -sf http://localhost:9696/health                    │
│ 12. INTEGRATION TESTS: PYTHONPATH=. pytest test_api.py      │
│ 13. STOP & REMOVE container                                  │
│ 14. LOGIN to GHCR (GitHub Container Registry)               │
│ 15. TAG image: ghcr.io/<org>/<repo>:latest                   │
│               ghcr.io/<org>/<repo>:<sha7>                    │
│ 16. PUSH both tags to GHCR                                   │
└──────────────────────────────────────────────────────────────┘
       │
       ▼
  (Render polls GHCR for :latest and auto-deploys)
```

### Why Two Jobs?

The `train` step is extracted into a **reusable workflow** (`workflow_call`) so it can also be triggered independently — for example, on a nightly schedule or manually via `workflow_dispatch`. This follows the **separation of concerns** principle: training and deploying are separate responsibilities.

### Artifact Passing Between Jobs

Jobs in GitHub Actions run on **separate virtual machines**. To pass the trained model from Job 1 to Job 2:

```yaml
# Job 1 (train.yml) — UPLOAD
- uses: actions/upload-artifact@v4
  with:
    name: trained-model
    path: |
      06-cicd/run_id.txt
      06-cicd/models/
    retention-days: 7

# Job 2 (ci-cd.yml) — DOWNLOAD
- uses: actions/download-artifact@v4
  with:
    name: trained-model
    path: 06-cicd
```

> **Important**: `upload-artifact@v4` strips common path prefixes. Files uploaded as `06-cicd/models/...` land as `models/...` in the artifact. When downloaded to `06-cicd/`, they become `06-cicd/models/...` again. This is why the workflow deletes any committed `06-cicd/models/` before downloading — to avoid conflicts.

### Health Check Retry Loop

The container may take several seconds to start. A retry loop handles this gracefully:
```bash
for i in $(seq 1 24); do
  curl -sf http://localhost:9696/health && break
  echo "Waiting for app... attempt $i/24"
  sleep 5
done
```
This tries every 5 seconds, up to 24 times = 2 minutes maximum. If the container never becomes healthy, the pipeline fails.

### Image Tagging Strategy

Two tags are pushed:
```
ghcr.io/org/repo:latest          # always points to the newest build
ghcr.io/org/repo:abc1234         # immutable, tied to this exact commit SHA
```
The short SHA makes it possible to identify exactly which commit a running container was built from — critical for debugging production issues.

### Secrets

The only secret needed is `GITHUB_TOKEN`, which GitHub Actions provides **automatically** — no manual configuration required. It is used to authenticate with GHCR (GitHub's container registry).

---

## 10. Cloud Deployment on Render

**Render** is the cloud platform that hosts the Docker container and serves the API publicly.

### How Render Works

1. **Image Source**: Render pulls the Docker image from GHCR.
2. **Health Checks**: Render calls `GET /health` periodically. If it returns non-200, the deployment is considered failed.
3. **Auto-restart**: If the container crashes, Render restarts it automatically.
4. **Free Plan**: The app sleeps after 15 minutes of inactivity, causing a 30–60 second cold start on the next request.

### render.yaml

```yaml
services:
  - type: web
    name: hospital-readmission-api
    runtime: docker
    # dockerImage: ghcr.io/<owner>/<repo>:latest  ← set this manually
    region: oregon
    plan: free
    healthCheckPath: /health
```

### Setup Steps

1. Push the image to GHCR (CI/CD does this automatically on every push to `main`)
2. In Render Dashboard: New Web Service → "Deploy an existing image"
3. Set image URL: `ghcr.io/<owner>/<repo>:latest`
4. Render auto-polls for new `:latest` tags and re-deploys when one is detected

### Frontend Integration

The Streamlit dashboard (`streamlit_app.py`) has a sidebar toggle to switch between:

- **Local API** (`http://localhost:9696`) — requires `python app.py` running locally
- **Cloud API** (`https://hospital-readmission-risk-predictor-pcv7.onrender.com`) — no local setup, but subject to cold-start delays

The React + Node.js frontend (`frontend/`) proxies all API calls through a Node.js Express server (port 3001) to the FastAPI backend.

### Local vs Production Comparison

| Aspect | Local | Render (Production) |
|--------|-------|---------------------|
| API URL | `http://localhost:9696` | `https://hospital-readmission-risk-predictor-pcv7.onrender.com` |
| Model source | Local `models/model/` | Baked into Docker image |
| TLS/HTTPS | No | Yes (Render manages certificates) |
| Availability | Only when you run it | 24/7 (cold start on free tier) |
| Cost | Free | Free (free tier) |

---

## 11. End-to-End Flow Summary

### Complete Pipeline

```
┌─────────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                                   │
│  data/diabetic_data.csv                                             │
│  101,766 encounters · 71,518 patients · 11.2% readmission rate     │
└────────────────────────────┬────────────────────────────────────────┘
                             │ read_data() in train.py
                             │ - drop weight column
                             │ - fill missing values
                             │ - encode target (binary)
                             │ - derive care_intensity, medication_changed
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     FEATURE ENGINEERING                             │
│  prepare_features() → list of 20-feature dicts                     │
│  Patient-level stratified split (80% train / 20% val)              │
└────────────────────────────┬────────────────────────────────────────┘
                             │ train_and_log() in train.py
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       MODEL TRAINING                                │
│  Pipeline:                                                          │
│    DictVectorizerWrapper → sparse matrix                           │
│    XGBClassifier (scale_pos_weight ≈ 8.1)                          │
│                                                                     │
│  Metrics logged to MLflow (mlflow.db):                             │
│    PR-AUC, ROC-AUC, all hyperparams                                │
│                                                                     │
│  Artifacts saved:                                                   │
│    06-cicd/models/model/  ← deployment copy                        │
│    06-cicd/run_id.txt     ← traceability                           │
└────────────────────────────┬────────────────────────────────────────┘
                             │ GitHub Actions (on push to main)
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         CI/CD PIPELINE                              │
│                                                                     │
│  [train.yml]  Train → Upload artifact (models/ + run_id.txt)       │
│                                                                     │
│  [ci-cd.yml]                                                        │
│    Download artifact → Lint → Unit tests → Docker build            │
│    → Integration tests → Push to GHCR:                             │
│        ghcr.io/org/repo:latest                                      │
│        ghcr.io/org/repo:<sha7>                                      │
└────────────────────────────┬────────────────────────────────────────┘
                             │ Render polls GHCR for :latest
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    PRODUCTION (Render.com)                          │
│                                                                     │
│  Docker container running app.py via uvicorn                       │
│  - Loads models/model/ at startup                                   │
│  - Serves: GET /health · POST /predict · POST /predict/batch        │
│  - SHAP explainability + prediction logging + CORS                  │
│                                                                     │
│  Public URL: hospital-readmission-risk-predictor-pcv7.onrender.com │
└────────────────────────────┬────────────────────────────────────────┘
                             │ HTTP POST /predict
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      USER INTERFACES                                │
│                                                                     │
│  streamlit_app.py  → http://localhost:8501                         │
│  - Patient intake, batch processing, system monitoring              │
│  - SHAP waterfall chart, risk gauge                                 │
│  - Sidebar: switch between Local API / Cloud API                    │
│                                                                     │
│  React + Node.js  → http://localhost:5173                          │
│  - 5-page dashboard (Login, Intake, Batch, Dashboard, Monitoring)  │
│  - Node.js Express proxy (port 3001) → FastAPI (port 9696)         │
└─────────────────────────────────────────────────────────────────────┘
```

### Frontend Clients vs. Swagger UI

All three interfaces call the same FastAPI `/predict` endpoint — they differ only in who calls it and how results are displayed:

| | Swagger UI (`/docs`) | Streamlit | React |
|---|---|---|---|
| How it calls the API | Browser directly | Python `requests` library | Node.js proxy → fetch |
| Target user | Developer / tester | Data analyst / clinical demo | End user / product demo |
| Interface | Auto-generated, raw JSON | Interactive dashboard with charts | Full web app, 5 pages |
| SHAP display | Raw numbers | Plotly waterfall chart | Recharts horizontal bar chart |

Swagger UI is a **developer tool** that FastAPI generates automatically — it is not a product interface. Streamlit and React are **frontend clients** built on top of the same API. They are not visualizations of Swagger UI; they are independent applications that happen to consume the same backend.

---

### Testing Strategy

| Test Type | File | What it tests | Needs server? |
|-----------|------|---------------|---------------|
| Unit tests | `test_train.py` | Data preprocessing, feature extraction, DictVectorizer | No |
| Integration tests | `test_api.py` | `/health` and `/predict` endpoints, response schema | Yes (Docker) |

Unit tests are fast and safe to run anywhere — they only test Python functions in isolation. Integration tests require a running server, so they only run **inside CI/CD** after the Docker container has been started.

### Key Design Decisions (Summary)

| Decision | What | Why |
|----------|------|-----|
| Patient-level split | Split by `patient_nbr`, not by row | Prevents data leakage |
| PR-AUC as primary metric | Not accuracy | Data is 11.2% imbalanced |
| `scale_pos_weight` | Auto-computed from train set | Compensates for class imbalance |
| Quality gate | `ModelQualityError` if PR-AUC < 0.15 | Blocks degraded models from reaching production |
| SHAP explainability | Returned in every `/predict` response | Makes model reasoning transparent and auditable |
| Prediction logging | Append-only CSV at `data/predictions.log` | Audit trail for compliance and drift monitoring |
| Model baked into Docker | `COPY . .` includes `models/model/` | Self-contained, no runtime download |
| Two artifact tags | `:latest` + `:<sha7>` | Rollback capability + audit trail |
| Reusable training workflow | Separate `train.yml` | Can retrain without deploying |
| `PYTHONPATH=.` in CI | Set before pytest | Ensures local imports resolve correctly in GitHub Actions |

---

*Document updated: 2026-03-23*
*Project: IE MLOps Group Project — Team 3*
*Stack: XGBoost · FastAPI · MLflow · Docker · GitHub Actions · Render · Streamlit · React + Node.js*
