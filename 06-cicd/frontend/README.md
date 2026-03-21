# Hospital Readmission Risk Platform

A stunning, enterprise-grade React + Node.js full-stack platform for predicting hospital readmissions using Explainable AI (SHAP). 

This platform replaces the Streamlit UI with a custom-built, responsive, and highly interactive interface leveraging Framer Motion, Tailwind CSS, Plotly, and Recharts.

## Architecture

```text
┌─────────────────┐       ┌─────────────────┐        ┌─────────────────┐
│  React Client   │       │ Express Proxy   │        │     FastAPI     │
│  (Vite, Tailwd) │ ────► │ (Node.js)       │ ─────► │   (Python ML)   │
│  Port: 5173     │       │ Port: 3001      │        │                 │
└─────────────────┘       └─────────────────┘        └─────────────────┘
```

## Features
- **Dark Clinical Theme**: Custom glassmorphism, animated gradient meshes, SVG noise.
- **Explainable AI (SHAP)**: Real-time Plotly waterfall charts explaining model behavior per patient.
- **Batch Processing**: Client-side CSV parsing with drag-and-drop support.
- **Live Monitoring**: API latency tracking and system status polling via Recharts.

## Getting Started Locally

### Prerequisites
- Node.js 24+
- Python 3.12+ (for ML API)

### 1. Start the ML API (Python)
If your Render API is asleep, or if you want to test the entire stack locally:
```bash
cd 06-cicd
python -m uvicorn app:app --reload --port 9696
```

### 2. Start the Node.js Proxy Server
Open a new terminal:
```bash
cd 06-cicd/frontend/server
npm install
npm run dev
```

### 3. Start the React Frontend
Open a third terminal:
```bash
cd 06-cicd/frontend/client
npm install
npm run dev
```
Navigate to `http://localhost:5173`.

## Cloud Deployment (Docker)

This project contains a multi-stage `Dockerfile` that builds the React static files and serves them directly through the Node.js Express server on port `3001`.

```bash
cd 06-cicd/frontend
docker-compose up --build
```
Navigate to `http://localhost:3001`.

## Environment Variables
The Node adapter uses `.env` located in `frontend/server/.env`:
- `PORT` = Port for Express to bind to (default 3001)
- `ML_API_URL` = URL of your FastAPI backend
- `CLIENT_ORIGIN` = Allowed CORS origin from the React dev server
