# 02 – Data Sampling & Feature Engineering

**Hospital Readmission Risk Prediction** — Preprocessing and feature engineering pipeline

---

## Overview

This module covers the full data preparation pipeline: missing value handling, patient-level train/val/test splitting, and feature engineering. The processed splits are saved to `data/processed/` for use in downstream modules.

---

## Contents

| File | Description |
| ---- | ----------- |
| `features.ipynb` | Full pipeline: CCS grouping, Charlson comorbidity index, patient-level split, saves train/val/test CSVs |
| `hospital_readmission_data_fe.ipynb` | Exploratory FE: OHE deep dive, LR/XGBoost/LightGBM comparison on engineered features |

---

## Feature Categories

| Category | Features |
| -------- | -------- |
| Demographics | `age` (10-year bins), `gender`, `race` |
| Admission context | `admission_type_id`, `discharge_disposition_id`, `admission_source_id` |
| Clinical utilization | `num_lab_procedures`, `num_medications`, `num_procedures`, prior visits |
| Derived | `care_intensity` (emergency + inpatient + outpatient), `medication_changed` |
| Lab results | `A1Cresult`, `max_glu_serum` (treated as categorical) |
| Medication flags | `change`, `diabetesMed` |
| **Dropped** | `weight` (96.9% missing), near-zero-variance medication columns |

---

## Outputs

Running `features.ipynb` saves to `../data/processed/`:

```text
data/processed/
├── train.csv
├── val.csv
├── test.csv
└── features_full.csv
```

---

## How to Run

```bash
cd 02-data-sampling-feature
jupyter notebook
```

Ensure `../data/diabetic_data.csv` exists before running. Run `features.ipynb` to generate the processed splits.
