# 03 – Experiment Tracking

**Hospital Readmission Risk Prediction** — MLflow experiment tracking and model selection

---

## Overview

This module uses MLflow (local SQLite backend) for experiment tracking, model versioning, and metrics logging. Logistic Regression is the baseline; XGBoost and LightGBM are tuned with Optuna. A challenger model is promoted to the Model Registry only if its validation PR-AUC exceeds the baseline.

---

## Contents

| File | Description |
| ---- | ----------- |
| `scenario-1.ipynb` | Baseline: Logistic Regression, logs to local `mlflow.db`, launches UI on port 5001 |
| `scenario-2.ipynb` | Challenger: XGBoost + LightGBM + Optuna, connects to scenario-1's tracking server |

---

## Metrics

| Metric | Purpose |
| ------ | ------- |
| **PR-AUC** | Primary model selection metric (handles class imbalance) |
| **ROC-AUC** | Secondary threshold-free metric |
| **Recall@K20** | Operational metric — fraction of true readmissions captured in top 20% of predictions |

---

## How to Run

### Scenario 1 — Baseline

```bash
cd 03-experiment-tracking
# Ensure ../data/diabetic_data.csv exists
jupyter notebook scenario-1.ipynb
```

Run all cells. The last cell starts the MLflow UI at [http://localhost:5001](http://localhost:5001) — **keep it running**.

Baseline results: PR-AUC ≈ 0.189, ROC-AUC ≈ 0.644, Recall@K20 ≈ 0.35.

### Scenario 2 — Optuna Tuning + Champion Selection

```bash
# In a new terminal (scenario-1 UI must be running on port 5001)
jupyter notebook scenario-2.ipynb
```

Run all cells. `BASELINE_PR_AUC = 0.189` is the promotion threshold. The best challenger is registered to the MLflow Model Registry only if it beats the baseline.

---

## MLflow Artifacts

| Path | Contents |
| ---- | -------- |
| `mlflow.db` | Local SQLite tracking store |
| `mlruns/` | Run artifacts (models, metrics, params) |
| `mlartifacts/` | Registered model artifacts |
| `confusion_matrix_*.png` | Champion model confusion matrix |
