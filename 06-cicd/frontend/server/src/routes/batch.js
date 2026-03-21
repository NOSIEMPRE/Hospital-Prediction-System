import { Router } from 'express';
import mlApi from '../services/mlApiService.js';

const router = Router();

router.post('/', async (req, res, next) => {
  try {
    const patients = req.body; // Array of patient objects
    if (!Array.isArray(patients)) {
      return res.status(400).json({ error: 'Expected an array of patient objects.' });
    }
    const results = await Promise.allSettled(
      patients.map(async (p, i) => {
        const { data } = await mlApi.post('/predict', p);
        const score = data.risk_score;
        let risk_label = 'Low';
        if (score >= 0.6) risk_label = 'High';
        else if (score >= 0.3) risk_label = 'Moderate';
        return { id: p.id || i + 1, risk_score: score, risk_label, shap_values: data.shap_values };
      })
    );
    const output = results.map((r, i) =>
      r.status === 'fulfilled' ? r.value : { id: i + 1, risk_score: null, risk_label: 'Error', error: r.reason?.message }
    );
    res.json(output);
  } catch (err) {
    next(err);
  }
});

export default router;
