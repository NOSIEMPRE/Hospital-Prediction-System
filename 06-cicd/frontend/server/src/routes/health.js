import { Router } from 'express';
import mlApi from '../services/mlApiService.js';

const router = Router();

router.get('/', async (req, res, next) => {
  const start = Date.now();
  try {
    const { data } = await mlApi.get('/health');
    const latency_ms = Date.now() - start;
    res.json({ ...data, latency_ms, server_uptime: process.uptime() });
  } catch (err) {
    res.json({
      status: 'offline',
      model_loaded: false,
      latency_ms: Date.now() - start,
      error: err.message,
      server_uptime: process.uptime(),
    });
  }
});

export default router;
