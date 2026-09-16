/**
 * Handwriting Kinematic & Spatial-Temporal Feature Extractor
 * 
 * Extracts quantitative biometric features from raw digital pen/finger strokes
 * on HTML5 Canvas. Evaluates motor control stability, velocity consistency,
 * pen lifts, jitter variance, and character spatial formation against developmental norms.
 */

/**
 * Extracts comprehensive handwriting features from stroke coordinates
 * 
 * @param {Array<Object>|Array<Array<Object>>} rawStrokes - Stroke coordinates [{x, y, t, pressure?}]
 * @param {string} [charTarget='b'] - Target character being traced
 * @param {Object} [canvasBounds={width: 360, height: 260}] - Canvas dimensions
 * @param {number} [reportedDurationSec] - Optional client-reported duration
 * @returns {Object} Extracted handwriting feature vector and risk score
 */
export function extractHandwritingFeatures(rawStrokes = [], charTarget = 'b', canvasBounds = { width: 360, height: 260 }, reportedDurationSec = 0) {
  // 1. Structure raw strokes into individual continuous segments
  const strokeSegments = normalizeStrokes(rawStrokes);

  if (strokeSegments.length === 0 || strokeSegments.every(s => s.length === 0)) {
    return createEmptyHandwritingFeatures(charTarget);
  }

  // 2. Flatten all points for global spatial and temporal bounds
  const allPoints = strokeSegments.flat();
  const pointCount = allPoints.length;

  if (pointCount < 2) {
    return createEmptyHandwritingFeatures(charTarget);
  }

  // 3. Temporal calculations
  const firstTimestamp = allPoints[0].t || 0;
  const lastTimestamp = allPoints[allPoints.length - 1].t || 0;
  let totalTimeElapsedMs = lastTimestamp > firstTimestamp ? (lastTimestamp - firstTimestamp) : (reportedDurationSec * 1000);
  if (totalTimeElapsedMs <= 0) {
    totalTimeElapsedMs = Math.max(1000, reportedDurationSec * 1000 || pointCount * 25);
  }
  const totalDurationSec = Number((totalTimeElapsedMs / 1000).toFixed(2));

  // Compute on-paper drawing time vs in-air pause time
  let onPaperDurationMs = 0;
  strokeSegments.forEach(seg => {
    if (seg.length > 1) {
      const segStart = seg[0].t || 0;
      const segEnd = seg[seg.length - 1].t || 0;
      if (segEnd > segStart) {
        onPaperDurationMs += (segEnd - segStart);
      } else {
        onPaperDurationMs += seg.length * 20; // fallback estimate
      }
    }
  });

  const inAirDurationMs = Math.max(0, totalTimeElapsedMs - onPaperDurationMs);
  const inAirRatio = Number((inAirDurationMs / totalTimeElapsedMs).toFixed(3));

  // Pen lifts
  const penLifts = Math.max(0, strokeSegments.length - 1);
  const penLiftFrequencyHz = Number((penLifts / (totalDurationSec || 1)).toFixed(2));

  // 4. Spatial Geometry & Bounding Box
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  let sumX = 0, sumY = 0;

  allPoints.forEach(pt => {
    if (pt.x < minX) minX = pt.x;
    if (pt.x > maxX) maxX = pt.x;
    if (pt.y < minY) minY = pt.y;
    if (pt.y > maxY) maxY = pt.y;
    sumX += pt.x;
    sumY += pt.y;
  });

  const bboxWidth = Math.max(1, maxX - minX);
  const bboxHeight = Math.max(1, maxY - minY);
  const aspectRatio = Number((bboxWidth / bboxHeight).toFixed(3));
  const centroidX = Number((sumX / pointCount).toFixed(1));
  const centroidY = Number((sumY / pointCount).toFixed(1));
  const canvasOccupancyRatio = Number(((bboxWidth * bboxHeight) / (canvasBounds.width * canvasBounds.height)).toFixed(3));

  // 5. Kinematics (Path Length, Velocity, Acceleration, Jitter)
  let totalPathLengthPx = 0;
  const velocities = []; // px / ms
  const angleChanges = [];

  strokeSegments.forEach(seg => {
    for (let i = 0; i < seg.length - 1; i++) {
      const p1 = seg[i];
      const p2 = seg[i + 1];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      totalPathLengthPx += dist;

      let dt = (p2.t && p1.t && p2.t > p1.t) ? (p2.t - p1.t) : 20;
      if (dt <= 0) dt = 16; // ~60fps fallback

      const vel = (dist / dt) * 1000; // px / sec
      velocities.push(vel);

      if (i < seg.length - 2) {
        const p3 = seg[i + 2];
        const dx2 = p3.x - p2.x;
        const dy2 = p3.y - p2.y;
        const angle1 = Math.atan2(dy, dx);
        const angle2 = Math.atan2(dy2, dx2);
        let angleDiff = Math.abs(angle2 - angle1);
        if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
        angleChanges.push(angleDiff);
      }
    }
  });

  totalPathLengthPx = Number(totalPathLengthPx.toFixed(1));

  // Velocity statistics
  let avgVelocityPxPerSec = 0;
  let maxVelocityPxPerSec = 0;
  let velocityStdDev = 0;
  let velocityVariationCV = 0;

  if (velocities.length > 0) {
    avgVelocityPxPerSec = velocities.reduce((a, b) => a + b, 0) / velocities.length;
    maxVelocityPxPerSec = Math.max(...velocities);
    const variance = velocities.reduce((acc, v) => acc + Math.pow(v - avgVelocityPxPerSec, 2), 0) / velocities.length;
    velocityStdDev = Math.sqrt(variance);
    velocityVariationCV = avgVelocityPxPerSec > 0 ? (velocityStdDev / avgVelocityPxPerSec) : 0;
  }

  // Jitter Variance / Tremor index (indicates fine-motor hesitation or dysgraphia tremors)
  let directionalJitterIndex = 0;
  if (angleChanges.length > 0) {
    const avgAngleChange = angleChanges.reduce((a, b) => a + b, 0) / angleChanges.length;
    directionalJitterIndex = Number(avgAngleChange.toFixed(3));
  }

  // Jitter calculation from velocity acceleration changes
  let accelerationJitter = 0;
  if (velocities.length > 1) {
    let accelSum = 0;
    for (let i = 0; i < velocities.length - 1; i++) {
      accelSum += Math.abs(velocities[i + 1] - velocities[i]);
    }
    accelerationJitter = Number((accelSum / (velocities.length - 1)).toFixed(2));
  }

  // 6. Character-Specific Spatial & Reversal Heuristic Analysis
  const spatialOrientation = analyzeLetterSpatialOrientation(allPoints, bboxWidth, bboxHeight, minX, minY, charTarget);

  // 7. Overall Stroke Consistency Score (0 - 100, 100 = smooth/consistent)
  let consistencyPenalty = 0;
  if (velocityVariationCV > 0.8) consistencyPenalty += Math.min(30, (velocityVariationCV - 0.8) * 35);
  if (penLifts > 3) consistencyPenalty += Math.min(25, (penLifts - 3) * 6);
  if (directionalJitterIndex > 0.9) consistencyPenalty += Math.min(25, (directionalJitterIndex - 0.9) * 30);
  if (inAirRatio > 0.45) consistencyPenalty += Math.min(20, (inAirRatio - 0.45) * 40);

  const strokeConsistencyScore = Math.max(10, Math.min(100, Math.round(100 - consistencyPenalty)));

  // 8. Computed Handwriting Risk Score (0 - 100, higher = more friction/risk)
  let rawHandwritingRisk = 0;
  const jitterRisk = Math.min(100, (directionalJitterIndex / 1.5) * 100);
  const penLiftRisk = Math.min(100, Math.max(0, (penLifts - 1) * 25));
  const velocityRisk = Math.min(100, velocityVariationCV * 70);
  const spatialRisk = spatialOrientation.isSuspectedReversal ? 85 : Math.min(100, spatialOrientation.deformationIndex * 100);

  rawHandwritingRisk = (jitterRisk * 0.25) + (spatialRisk * 0.30) + (velocityRisk * 0.25) + (penLiftRisk * 0.20);
  if (spatialOrientation.isSuspectedReversal) {
    rawHandwritingRisk = Math.max(45.0, rawHandwritingRisk);
  }
  const handwritingRiskScore = Number(Math.max(0, Math.min(100, rawHandwritingRisk)).toFixed(1));

  return {
    charTarget,
    totalDurationSec,
    pointCount,
    penLifts,
    penLiftFrequencyHz,
    onPaperDurationMs: Math.round(onPaperDurationMs),
    inAirDurationMs: Math.round(inAirDurationMs),
    inAirRatio,
    totalPathLengthPx,
    avgVelocityPxPerSec: Math.round(avgVelocityPxPerSec),
    maxVelocityPxPerSec: Math.round(maxVelocityPxPerSec),
    velocityVariationCV: Number(velocityVariationCV.toFixed(3)),
    directionalJitterIndex,
    accelerationJitter,
    strokeConsistencyScore,
    handwritingRiskScore,
    spatial: {
      bboxWidth: Math.round(bboxWidth),
      bboxHeight: Math.round(bboxHeight),
      aspectRatio,
      centroidX,
      centroidY,
      canvasOccupancyRatio,
      isSuspectedReversal: spatialOrientation.isSuspectedReversal,
      orientationNotes: spatialOrientation.notes
    },
    riskBreakdown: {
      jitterRisk: Math.round(jitterRisk),
      penLiftRisk: Math.round(penLiftRisk),
      velocityRisk: Math.round(velocityRisk),
      spatialRisk: Math.round(spatialRisk)
    }
  };
}

/**
 * Normalizes strokes whether passed as an array of stroke segments or flat array
 */
function normalizeStrokes(rawStrokes) {
  if (!Array.isArray(rawStrokes) || rawStrokes.length === 0) return [];

  if (Array.isArray(rawStrokes[0])) {
    return rawStrokes.filter(seg => Array.isArray(seg) && seg.length > 0);
  }

  const segments = [];
  let currentSegment = [];

  for (let i = 0; i < rawStrokes.length; i++) {
    const pt = rawStrokes[i];
    if (!pt || typeof pt.x !== 'number' || typeof pt.y !== 'number') continue;

    if (currentSegment.length === 0) {
      currentSegment.push(pt);
    } else {
      const prev = currentSegment[currentSegment.length - 1];
      const timeGap = (pt.t && prev.t) ? (pt.t - prev.t) : 0;
      const dist = Math.hypot(pt.x - prev.x, pt.y - prev.y);
      if (timeGap > 300 || dist > 140) {
        segments.push(currentSegment);
        currentSegment = [pt];
      } else {
        currentSegment.push(pt);
      }
    }
  }

  if (currentSegment.length > 0) {
    segments.push(currentSegment);
  }

  return segments;
}

function analyzeLetterSpatialOrientation(points, width, height, minX, minY, target) {
  const normalizedTarget = String(target).toLowerCase().trim();
  let isSuspectedReversal = false;
  let deformationIndex = 0;
  const notes = [];

  const midY = minY + height / 2;

  // Split points into upper region and lower region to identify stem vs loop
  const topPoints = points.filter(p => p.y < (minY + height * 0.45));
  const bottomPoints = points.filter(p => p.y >= (minY + height * 0.45));

  const avgTopX = topPoints.length > 0
    ? (topPoints.reduce((acc, p) => acc + p.x, 0) / topPoints.length)
    : (minX + width / 2);

  const avgBottomX = bottomPoints.length > 0
    ? (bottomPoints.reduce((acc, p) => acc + p.x, 0) / bottomPoints.length)
    : (minX + width / 2);

  // Letter 'b': Ascending stem on left (top points are on the left), loop on bottom right (bottom center > top center)
  if (normalizedTarget === 'b') {
    // If top stem is to the right of bottom loop (or loop is drawn to the left of stem)
    if (avgTopX > avgBottomX + (width * 0.15)) {
      isSuspectedReversal = true;
      notes.push("Stem on right with leftward loop (mirror pattern of 'd')");
    }
  } else if (normalizedTarget === 'd') {
    // Letter 'd': Ascending stem on right, loop on bottom left (top center > bottom center)
    if (avgTopX < avgBottomX - (width * 0.15)) {
      isSuspectedReversal = true;
      notes.push("Stem on left with rightward loop (mirror pattern of 'b')");
    }
  } else if (normalizedTarget === 'p') {
    // Letter 'p': Descending stem on left (bottom points are on the left), loop on top right (top center > bottom center)
    if (avgTopX < avgBottomX - (width * 0.15)) {
      isSuspectedReversal = true;
      notes.push("Stem on right with leftward loop (mirror pattern of 'q')");
    }
  } else if (normalizedTarget === 'q') {
    // Letter 'q': Descending stem on right, loop on top left (bottom center > top center)
    if (avgTopX > avgBottomX + (width * 0.15)) {
      isSuspectedReversal = true;
      notes.push("Stem on left with rightward loop (mirror pattern of 'p')");
    }
  }

  const currentAR = width / (height || 1);
  if (currentAR < 0.25 || currentAR > 2.2) {
    deformationIndex = Math.min(1.0, Math.abs(currentAR - 0.8) / 1.5);
    notes.push(`Abnormal stroke aspect ratio (${currentAR.toFixed(2)})`);
  }

  return {
    isSuspectedReversal,
    deformationIndex,
    notes: notes.length > 0 ? notes.join('; ') : 'Normal spatial orientation'
  };
}

function createEmptyHandwritingFeatures(charTarget = 'b') {
  return {
    charTarget,
    totalDurationSec: 0,
    pointCount: 0,
    penLifts: 0,
    penLiftFrequencyHz: 0,
    onPaperDurationMs: 0,
    inAirDurationMs: 0,
    inAirRatio: 0,
    totalPathLengthPx: 0,
    avgVelocityPxPerSec: 0,
    maxVelocityPxPerSec: 0,
    velocityVariationCV: 0,
    directionalJitterIndex: 0,
    accelerationJitter: 0,
    strokeConsistencyScore: 100,
    handwritingRiskScore: 0,
    spatial: {
      bboxWidth: 0,
      bboxHeight: 0,
      aspectRatio: 1,
      centroidX: 0,
      centroidY: 0,
      canvasOccupancyRatio: 0,
      isSuspectedReversal: false,
      orientationNotes: 'No stroke telemetry provided'
    },
    riskBreakdown: {
      jitterRisk: 0,
      penLiftRisk: 0,
      velocityRisk: 0,
      spatialRisk: 0
    }
  };
}
