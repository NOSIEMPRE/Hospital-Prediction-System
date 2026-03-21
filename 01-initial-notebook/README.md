# 01 – Initial Notebook

**Hospital Readmission Risk Prediction** — Exploratory Data Analysis & Baseline Model

---

## Overview

This module contains the initial EDA and a baseline Logistic Regression model for the Diabetes 130-US Hospitals dataset. It establishes the problem framing, class imbalance profile, and evaluation metrics used throughout the project.

---

## Contents

| File | Description |
| ---- | ----------- |
| `eda_diabetes_readmission.ipynb` | EDA: data loading, summary stats, missing values, target distribution, feature distributions |
| `hospital_readmission_prediction.ipynb` | Baseline pipeline: load → preprocess → train (Logistic Regression) → evaluate |

---

## Data

| File | Location |
| ---- | -------- |
| Raw dataset | `../data/diabetic_data.csv` |
| ID mapping | `../data/IDS_mapping.csv` |

Download the dataset from [UCI ML Repository (id 296)](https://archive.ics.uci.edu/dataset/296) and place it in `data/` at the project root.

---

## Key Findings

| Finding | Value |
| ------- | ----- |
| Total encounters | 101,766 |
| Unique patients | 71,518 |
| Positive class (30-day readmission) | 11.2% |
| `weight` missing | 96.9% → dropped |
| `HbA1c` not tested | 83.3% → treated as informative category |
| `medical_specialty` missing | 49.1% → treated as "Unknown" |
| `payer_code` missing | 39.6% → treated as "Unknown" |

Patient-level splitting is required to prevent data leakage (same patient can appear multiple times).

---

## Baseline Results

Logistic Regression trained on one-hot encoded features:

- **PR-AUC** ≈ 0.189
- **ROC-AUC** ≈ 0.644
- **Recall@K20** ≈ 0.35

These serve as the promotion threshold in module 03 (experiment tracking).

---

## How to Run

```bash
cd 01-initial-notebook
jupyter notebook
```

Open and run `eda_diabetes_readmission.ipynb` first, then `hospital_readmission_prediction.ipynb`.
