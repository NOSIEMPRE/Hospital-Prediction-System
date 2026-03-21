import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import healthRouter from './routes/health.js';
import predictRouter from './routes/predict.js';
import batchRouter from './routes/batch.js';
import errorHandler from './middleware/errorHandler.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

// --- Middleware ---
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(compression());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));

// --- API Routes ---
app.get('/api/ping', (_, res) => res.json({ ok: true, ts: Date.now() }));
app.use('/api/health', healthRouter);
app.use('/api/predict', predictRouter);
app.use('/api/batch', batchRouter);

// --- Serve React build in production ---
if (process.env.NODE_ENV === 'production') {
  const clientDist = join(__dirname, '..', '..', 'client', 'dist');
  app.use(express.static(clientDist));
  app.get('*', (_, res) => res.sendFile(join(clientDist, 'index.html')));
}

// --- Error Handler ---
app.use(errorHandler);

// --- Start ---
app.listen(PORT, () => {
  console.log(`🏥 Server running on http://localhost:${PORT}`);
  console.log(`📡 ML API: ${process.env.ML_API_URL}`);
});

// Graceful shutdown
process.on('SIGTERM', () => { console.log('SIGTERM received, shutting down...'); process.exit(0); });
