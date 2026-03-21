import rateLimit from 'express-rate-limit';

export const predictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: 'Too many prediction requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
