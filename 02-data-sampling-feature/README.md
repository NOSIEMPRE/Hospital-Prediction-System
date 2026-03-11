# 02 – Data Sampling & Feature Engineering

**Hospital Readmission Risk Prediction** — Data preprocessing and feature engineering

## Overview

This module covers data sampling, patient-level split strategy, missing value handling, and feature engineering for the Diabetes 130-US Hospitals dataset.

## Contents

| File | Description |
| :--- | :--- |
| `features.ipynb` | Full feature engineering: CCS, Charlson, patient-level split, save train/val/test |
| `hospital_readmission_data_fe.ipynb` | Data sampling, OHE deep dive, LR/XGB/LightGBM comparison |


## Feature Categories (from Proposal)

- **Demographics**: age (10-year bins), gender, race
- **Admission context**: admission type, discharge disposition, admission source
- **Clinical utilization**: lab procedures, medications, procedures, prior visits
- **Lab results**: HbA1c, max glucose serum
- **Medications**: change flag, diabetesMed
- **Dropped**: weight (96.9% missing), near-zero-variance medication columns

