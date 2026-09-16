/**
 * Level 1 Rule-Based Screening Scoring Engine
 * 
 * Takes raw numeric features extracted from the test session and applies
 * configurable weighted multimodal fusion against grade-level developmental baselines.
 * 
 * Supports both traditional 3-pillar (reversal + speech + flashcard) and
 * advanced 4-pillar multimodal assessments (incorporating handwriting kinematics).
 */

import { scoringConfig, getGradeBenchmark } from '../config/scoringConfig.js';
import { computeMultimodalScore } from './multimodalFusion.js';

/**
 * Computes Level 1 Rule-Based Screening Score and Clinical Interpretation
 * 
 * @param {Object} rawFeatures - Raw features from test session
 * @param {string|number} [grade='2'] - Child grade
 * @param {Object} [customConfig] - Optional override config
 * @returns {Object} Computed score, category, breakdown, and plain-language report
 */
export function computeLevel1Score(rawFeatures = {}, grade = '2', customConfig = scoringConfig) {
  // Delegate directly to the multimodal fusion scoring engine
  return computeMultimodalScore(rawFeatures, grade, customConfig);
}
