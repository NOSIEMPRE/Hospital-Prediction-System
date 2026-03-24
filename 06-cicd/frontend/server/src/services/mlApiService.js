import axios from 'axios';

const mlApi = axios.create({
  baseURL: process.env.ML_API_URL || 'https://hospital-prediction-system.onrender.com',
  timeout: 120_000, // allow ML service cold start
  headers: { 'Content-Type': 'application/json' },
});

export default mlApi;
