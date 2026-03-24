---
title: Hospital Readmission Risk Platform
emoji: 🏥
colorFrom: green
colorTo: blue
sdk: docker
app_port: 7860
pinned: true
license: mit
---

# Hospital Readmission Risk Prediction Platform

Real-time AI-powered patient risk assessment & MLOps pipeline.

## Setup

1. Create a new Hugging Face Space (Docker SDK)
2. Set the Space's Dockerfile path to `Dockerfile.hf`
3. Add `HF_TOKEN` to your GitHub repo secrets
4. Set `HF_SPACE_NAME` repo variable (e.g., `your-username/Hospital-Prediction-System`)
5. The `deploy-hf.yml` workflow pushes to HF on successful CI/CD
