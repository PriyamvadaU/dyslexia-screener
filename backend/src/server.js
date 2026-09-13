import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { authRouter } from './routes/authRoutes.js';
import { childRouter } from './routes/childRoutes.js';
import { sessionRouter } from './routes/sessionRoutes.js';
import { configRouter } from './routes/configRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));

// Health / Status endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'LexiScreen Multimodal Screening Engine',
    version: '1.0.0',
    disclaimer: 'Preliminary screening indicator only, not a medical diagnosis.',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/children', childRouter);
app.use('/api/sessions', sessionRouter);
app.use('/api/config', configRouter);

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FRONTEND_DIST = path.resolve(__dirname, '../../frontend/dist');

// Serve static frontend files if built
if (fs.existsSync(FRONTEND_DIST)) {
  app.use(express.static(FRONTEND_DIST));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
  });
}

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Server] Unhandled exception:', err);
  res.status(500).json({
    error: 'An internal server error occurred.',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start Server if run directly
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`  LexiScreen Backend API & Scoring Engine`);
    console.log(`  Running on: http://localhost:${PORT}`);
    console.log(`  Medical Disclaimer: Preliminary screening indicator`);
    console.log(`====================================================`);
  });
}

export default app;

