# 05 – Monitoring

**Hospital Readmission Risk Prediction** — Production drift detection with Evidently

---

## Overview

This module extends module 04 with a full MLOps monitoring loop: train → serve → simulate production traffic → detect data drift and performance degradation. Reports are generated with Evidently.

---

## Contents

```text
05-monitoring/
├── train.py              # Train & log to MLflow, write run_id.txt
├── app.py                # FastAPI service (logs each prediction to data/predictions.csv)
├── simulate.py           # Calls /predict ~100 times with real patient data
├── monitor.py            # Generates Evidently drift + classification report
├── test_api.py           # Pytest integration tests
├── data/
│   └── predictions.csv   # Created by simulate.py
├── monitoring_report.html # Created by monitor.py
└── README.md
```

---

## Setup

```bash
cd 05-monitoring
pip install -r requirements.txt
pip install evidently   # only needed for monitor.py
```

Ensure `../data/diabetic_data.csv` exists.

---

## Usage

### 1. Train

```bash
python train.py
```

### 2. Start API

```bash
python app.py
```

API runs at [http://localhost:9696](http://localhost:9696). Each `/predict` call appends a row to `data/predictions.csv`.

### 3. Simulate production traffic

In a **new terminal** (API must be running):

```bash
python simulate.py
```

Calls `/predict` ~100 times using real hospital records, logging predictions and ground truth to `data/predictions.csv`.

### 4. Generate drift report

```bash
python monitor.py
```

Splits `predictions.csv` into reference (older half) vs. current (newer half), then generates `monitoring_report.html` with:

- **Data Drift**: input feature distribution shifts
- **Classification Performance**: confusion matrix, precision, recall, F1, ROC-AUC

### 5. View report

Open `monitoring_report.html` in any browser.

---

## Quick Reference

| Action | Command |
| ------ | ------- |
| Train | `python train.py` |
| Start API | `python app.py` |
| Simulate traffic | `python simulate.py` |
| Generate report | `python monitor.py` |
| Run API tests | `python -m pytest -q test_api.py` |

---

## Troubleshooting

| Issue | Fix |
| ----- | --- |
| `predictions.csv` empty | Run `app.py` before `simulate.py` |
| `FileNotFoundError` in monitor | Run `simulate.py` first to generate `predictions.csv` |
| `ModuleNotFoundError: evidently` | `pip install evidently` |
| API not responding | Ensure `python app.py` is running |
