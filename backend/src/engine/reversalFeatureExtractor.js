/**
 * Visual Discrimination & Letter Reversal Feature Extractor
 * 
 * Computes reversal error rates, mirror-letter confusion indices (e.g. b/d, p/q, m/w, n/u),
 * and decision response latencies across visual flashcard trials.
 */

import { scoringConfig } from '../config/scoringConfig.js';

/**
 * Extracts visual discrimination and letter reversal metrics
 * 
 * @param {Array<Object>} cardResults - Individual flashcard trial results
 * @param {Array<Object>} [confusedPairsList] - Pre-aggregated confused pairs
 * @returns {Object} Extracted reversal metrics and risk score
 */
export function extractReversalFeatures(cardResults = [], confusedPairsList = []) {
  if (!Array.isArray(cardResults) || cardResults.length === 0) {
    // If only summary list or numbers provided
    return formatSummaryReversalFeatures(confusedPairsList);
  }

  const totalCards = cardResults.length;
  let correctCards = 0;
  let reversalAttempts = 0;
  let reversalErrors = 0;
  const reactionTimes = [];
  const confusionMap = {};

  cardResults.forEach(card => {
    if (card.isCorrect) correctCards++;
    if (typeof card.reactionTimeMs === 'number' && card.reactionTimeMs > 0) {
      reactionTimes.push(card.reactionTimeMs);
    }

    if (card.isReversalTest) {
      reversalAttempts++;
      if (card.isReversalConfusion || (!card.isCorrect && card.selected === card.reversalOption)) {
        reversalErrors++;
        const key = `${card.target}→${card.selected}`;
        if (!confusionMap[key]) {
          confusionMap[key] = {
            expected: card.target,
            actual: card.selected,
            count: 0
          };
        }
        confusionMap[key].count++;
      }
    }
  });

  const accuracyPct = totalCards > 0 ? Number(((correctCards / totalCards) * 100).toFixed(1)) : 100;
  const reversalErrorRatePct = reversalAttempts > 0 ? Number(((reversalErrors / reversalAttempts) * 100).toFixed(1)) : 0;

  const avgReactionTimeMs = reactionTimes.length > 0
    ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
    : 1200;

  // Reversal Risk Index (0-100)
  // Mirror letter reversal is heavily weighted as a hallmark indicator of visual-spatial processing friction
  const reversalRiskScore = Number(Math.min(100, reversalErrorRatePct * 2.5).toFixed(1));
  const generalVisualRiskScore = Number(Math.max(0, 100 - accuracyPct).toFixed(1));

  return {
    totalCards,
    correctCards,
    accuracyPct,
    reversalAttempts,
    reversalErrors,
    reversalErrorRatePct,
    avgReactionTimeMs,
    confusedPairs: Object.values(confusionMap),
    reversalRiskScore,
    generalVisualRiskScore
  };
}

function formatSummaryReversalFeatures(confusedPairsList = []) {
  let reversalErrors = 0;
  if (Array.isArray(confusedPairsList)) {
    reversalErrors = confusedPairsList.reduce((acc, p) => acc + (p.count || 1), 0);
  }

  const reversalRiskScore = Math.min(100, reversalErrors * 25);
  return {
    totalCards: 0,
    correctCards: 0,
    accuracyPct: 100,
    reversalAttempts: Math.max(reversalErrors, 0),
    reversalErrors,
    reversalErrorRatePct: reversalErrors > 0 ? 50 : 0,
    avgReactionTimeMs: 1200,
    confusedPairs: Array.isArray(confusedPairsList) ? confusedPairsList : [],
    reversalRiskScore,
    generalVisualRiskScore: 0
  };
}
