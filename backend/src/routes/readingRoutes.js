/**
 * Oral Reading Analysis Route
 * 
 * Provides HTTP endpoint for analyzing child audio recordings and transcripts
 * against expected reading passages.
 */

import express from 'express';
import { analyzeOralReading } from '../services/speechAnalysisClient.js';
import { authenticateToken } from './authRoutes.js';

export const readingRouter = express.Router();

// Optional authentication: allow during assessment flow
readingRouter.post('/analyze', async (req, res) => {
  try {
    const {
      audioBase64,
      audioMimeType = 'audio/webm',
      transcript = '',
      expectedPassage = '',
      grade = '2',
      pauseCount = 0,
      totalPauseDurationMs = 0,
      averageHesitationMs = 0,
      durationSec = 0
    } = req.body;

    let audioBuffer = null;
    if (audioBase64) {
      // Decode base64 audio data URL or raw base64
      const base64Data = audioBase64.replace(/^data:audio\/\w+;base64,/, '');
      audioBuffer = Buffer.from(base64Data, 'base64');
    }

    if (!expectedPassage && !transcript) {
      return res.status(400).json({ error: 'expectedPassage and transcript/audio are required.' });
    }

    const analysis = await analyzeOralReading({
      audioBuffer,
      audioMimeType,
      transcript,
      expectedPassage,
      grade,
      pauseCount,
      totalPauseDurationMs,
      averageHesitationMs,
      durationSec
    });

    res.json({
      success: true,
      analysis
    });
  } catch (err) {
    console.error('[ReadingRoute] Error analyzing reading:', err);
    res.status(500).json({ error: 'Failed to analyze oral reading.' });
  }
});
