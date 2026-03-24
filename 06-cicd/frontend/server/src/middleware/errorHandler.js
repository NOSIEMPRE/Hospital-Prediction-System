export default function errorHandler(err, req, res, _next) {
  console.error('[Error]', err.message, err.code || '');
  if (err.code === 'ECONNABORTED') {
    return res.status(504).json({
      error:
        'Prediction service timed out. On Render free tiers, cold starts can be slow — wait ~1 minute and retry.',
    });
  }
  const status =
    err.response?.status ||
    err.status ||
    (err.request && !err.response ? 503 : 500);
  const upstream = err.response?.data?.detail ?? err.response?.data?.error;
  const message =
    (typeof upstream === 'string' ? upstream : null) ||
    (err.request && !err.response
      ? 'Could not reach the ML API. Set ML_API_URL on this service to your FastAPI base URL (not the React site URL).'
      : err.message) ||
    'Internal Server Error';
  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}
