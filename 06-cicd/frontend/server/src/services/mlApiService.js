import axios from 'axios';

const mlApi = axios.create({
  baseURL: process.env.ML_API_URL || 'https://hospital-readmission-risk-predictor-pcv7.onrender.com',
  timeout: 120_000, // Render cold-starts can take 60s+
  headers: { 'Content-Type': 'application/json' },
});

export default mlApi;
