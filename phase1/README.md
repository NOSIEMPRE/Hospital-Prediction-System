# Phase 1 — Data & EDA

**Milestones:** Data exploration, preprocessing, patient-level split, baseline (Logistic Regression)

## Contents

| Item | Description |
|------|-------------|
| `notebooks/EDA.ipynb` | Exploratory data analysis |
| `notebooks/EDA.md` | EDA summary and key findings |

## Next Steps

- [ ] Preprocessing module — drop `weight`, 5 near-zero-variance meds; treat `medical_specialty`/`payer_code` missing as "Unknown"
- [ ] Patient-level split — train 70% / validation 15% / test 15% by `patient_nbr`
- [ ] Baseline — Logistic Regression, report PR-AUC, AUROC, Recall@K
- [ ] Feature engineering — ICD-9 → CCS groupings; comorbidity index, medication burden score
