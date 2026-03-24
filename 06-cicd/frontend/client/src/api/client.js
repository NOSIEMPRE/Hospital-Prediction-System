import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '/api' : 'http://localhost:3001/api'),
  headers: {
    'Content-Type': 'application/json',
  },
  // Per-request timeout overrides this (e.g. /health uses 20s in App.jsx)
  timeout: 130_000,
});

export default api;
