# IE-MLOps-Group-Project-Team3

**Hospital Readmission Risk Prediction** — An end-to-end ML system for proactive patient care.

---

## Project Overview

This project builds a machine learning system to predict 30-day readmission risk for diabetic inpatients. Risk scores are pre-computed nightly and made available at discharge, enabling care coordinators to prioritize follow-up for high-risk patients.

- **Dataset**: Diabetes 130-US Hospitals (UCI ML Repository, id 296) — Strack et al., 2014  
- **Target**: Binary classification — readmitted within 30 days (yes/no)  
- **Submission**: Group Project Checkpoint Proposal — 8 March 2026

---

## Team Members

Marian, Marco, Yaxin, Lorenz, Jorge, Omar

---

## Project Roadmap

| Phase | Weeks | Milestones |
|-------|-------|------------|
| **Phase 1** | 1–2 | Data exploration, preprocessing, patient-level split, baseline (Logistic Regression) |
| **Phase 2** | 3–4 | XGBoost/LightGBM training, Optuna tuning, model selection, fairness evaluation |
| **Phase 3** | 5–6 | Pipeline deployment, monitoring setup, documentation, final demo |

---

## Repository Structure

```
├── data/                    # Datasets and mappings
│   ├── diabetic_data.csv    # Diabetes 130-US Hospitals dataset
│   └── IDS_mapping.csv      # Admission/discharge ID mapping
├── docs/                    # Documentation and proposals
│   ├── MLOps_Hospital_Proposal_Revised.md
│   └── MLOps - Group Project Checkpoint Assignment.pdf
├── phase1/                  # Data & EDA (Weeks 1–2)
│   ├── notebooks/           # EDA, exploration
│   │   ├── EDA.ipynb
│   │   └── EDA.md
│   └── README.md
├── phase2/                  # Modeling (Weeks 3–4)
│   └── README.md
├── phase3/                  # Deployment & Docs (Weeks 5–6)
│   └── README.md
├── README.md
└── .flake8
```

---

## Key Findings (EDA)

- **101,766 encounters**, 71,518 unique patients — patient-level split required to avoid leakage  
- **11.2%** positive class (30-day readmission) — class imbalance  
- **weight** 96.9% missing — to be dropped  
- **HbA1c** 83.3% "not tested" — treat as informative category  
- **medical_specialty** 49.1%, **payer_code** 39.6% missing — treat as "Unknown" category  
- **5 near-zero-variance medications** — candidates for removal  

See `phase1/notebooks/EDA.md` for full details.

---

## Getting Started

1. Clone the repository  
2. Create a virtual environment: `python -m venv .venv`  
3. Install dependencies (see `requirements.txt` when available)  
4. Run `phase1/notebooks/EDA.ipynb` for data exploration  

---

## References

- Strack, B., et al. (2014). Impact of HbA1c Measurement on Hospital Readmission Rates. *BioMed Research International*.  
- UCI Machine Learning Repository. (2014). Diabetes 130-US Hospitals.  
- Huyen, C. (2022). *Designing Machine Learning Systems*. O'Reilly Media.
