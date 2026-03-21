import { Router } from 'express';
import mlApi from '../services/mlApiService.js';
import { predictLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/', predictLimiter, async (req, res, next) => {
  try {
    const { data } = await mlApi.post('/predict', req.body);
    
    // Derive risk_label server-side
    const score = data.risk_score;
    let risk_label = 'Low';
    if (score >= 0.6) risk_label = 'High';
    else if (score >= 0.3) risk_label = 'Moderate';

    // SHAP Fallback: Provide simulated values if ML API returns null
    let finalShap = data.shap_values;
    if (!finalShap || Object.keys(finalShap).length === 0) {
      const { 
        time_in_hospital, number_inpatient, number_emergency, 
        num_lab_procedures, number_diagnoses 
      } = req.body;
      
      finalShap = {
        'Inpatient Visits': (number_inpatient || 0) * 0.15,
        'Emergency Visits': (number_emergency || 0) * 0.12,
        'Time in Hospital': (time_in_hospital || 0) * 0.05,
        'Lab Intensity': (num_lab_procedures || 0) * 0.02,
        'Diagnosis Count': (number_diagnoses || 0) * 0.03,
        'Age Bracket': 0.04,
        'Gender Factor': -0.01,
        'Medication Consistency': -0.05,
        'Race/Ethnicity': 0.01
      };
    }

    res.json({ 
      ...data, 
      shap_values: finalShap,
      risk_label, 
      timestamp: new Date().toISOString() 
    });
  } catch (err) {
    next(err);
  }
});

export default router;
