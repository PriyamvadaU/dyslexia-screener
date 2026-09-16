import React, { useState, useRef, useEffect } from 'react';
import { useChild } from '../context/ChildContext';
import { api } from '../services/api';
import { 
  PenTool, 
  RotateCcw, 
  Layers, 
  BrainCircuit, 
  Code, 
  ShieldCheck, 
  CheckCircle2,
  Sparkles,
  Info,
  Activity,
  Award,
  TrendingUp
} from 'lucide-react';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';

export function HandwritingPreview() {
  const { activeChild } = useChild();
  const canvasRef = useRef(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState('b');
  const [strokes, setStrokes] = useState([]);
  const [currentStroke, setCurrentStroke] = useState([]);
  const [penLifts, setPenLifts] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [liveAnalysis, setLiveAnalysis] = useState(null);
  const [savedTelemetry, setSavedTelemetry] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Initialize Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#4F46E5';
  }, []);

  const getCanvasCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0, t: Date.now() };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0]?.clientX);
    const clientY = e.clientY || (e.touches && e.touches[0]?.clientY);
    return {
      x: Math.round(clientX - rect.left),
      y: Math.round(clientY - rect.top),
      t: Date.now()
    };
  };

  const handleStartDrawing = (e) => {
    e.preventDefault();
    setIsDrawing(true);
    if (!startTime) setStartTime(Date.now());

    const coords = getCanvasCoordinates(e);
    setCurrentStroke([coords]);

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
    }
  };

  const handleDraw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();

    const coords = getCanvasCoordinates(e);
    setCurrentStroke(prev => [...prev, coords]);

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    }
  };

  const handleEndDrawing = async (e) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    setPenLifts(prev => prev + 1);

    let nextStrokes = strokes;
    if (currentStroke.length > 0) {
      nextStrokes = [...strokes, currentStroke];
      setStrokes(nextStrokes);
      setCurrentStroke([]);
    }

    // Trigger real-time kinematic feature extraction
    const allPts = nextStrokes.flat();
    if (allPts.length >= 4) {
      const durationSec = startTime ? Math.max(1, (Date.now() - startTime) / 1000) : 2;
      try {
        const res = await api.analyzeHandwriting(nextStrokes, selectedTarget, { width: 360, height: 260 }, durationSec);
        if (res?.features) {
          setLiveAnalysis(res.features);
        }
      } catch (err) {
        console.warn('Real-time analysis error:', err);
      }
    }
  };

  const handleClearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setStrokes([]);
    setCurrentStroke([]);
    setPenLifts(0);
    setStartTime(null);
    setLiveAnalysis(null);
    setSavedTelemetry(null);
  };

  const handleSaveTelemetry = async () => {
    if (!activeChild) return;
    setSubmitting(true);
    const durationSec = startTime ? Math.max(1, Math.round((Date.now() - startTime) / 1000)) : 1;
    const allPoints = strokes.flat();

    const telemetryPayload = {
      charTarget: selectedTarget,
      durationSec,
      penLifts,
      strokes: allPoints,
      boundingBox: { width: 360, height: 260 }
    };

    try {
      const res = await api.submitWritingSession(activeChild.id, telemetryPayload);
      setSavedTelemetry(res.writingSession);
      if (res.features) setLiveAnalysis(res.features);
    } catch (err) {
      console.warn('Writing telemetry save error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const totalPointsCount = strokes.reduce((acc, s) => acc + s.length, 0);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 text-xs font-bold">
          <BrainCircuit className="w-3.5 h-3.5 text-purple-600" />
          <span>Guided Writing & Kinematic Feature Extractor</span>
        </div>
        <h1 className="text-3xl font-black text-zinc-900 dark:text-zinc-100">
          Handwriting Tracing & Motor Kinematics Analysis
        </h1>
        <p className="text-xs text-zinc-500 max-w-2xl leading-relaxed">
          Evaluates fine-motor coordination, velocity consistency, stroke jitter/tremors, and spatial letter formation in real-time.
        </p>
      </div>

      <MedicalDisclaimer />

      {/* Interactive Tracing Canvas Demo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Canvas Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              Interactive Drawing Canvas
            </span>
            {/* Target Letter Switcher */}
            <div className="flex gap-1">
              {['b', 'd', 'p', 'q', 'm', 'w'].map(char => (
                <button
                  key={char}
                  onClick={() => { setSelectedTarget(char); handleClearCanvas(); }}
                  className={`w-7 h-7 rounded-lg text-xs font-bold font-lexend transition-all ${
                    selectedTarget === char
                      ? 'bg-indigo-600 text-white'
                      : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  {char}
                </button>
              ))}
            </div>
          </div>

          <div className="relative border-2 border-dashed border-indigo-200 dark:border-zinc-700 rounded-2xl bg-zinc-50 dark:bg-zinc-900 overflow-hidden flex items-center justify-center">
            {/* Ghost Background Letter Guide */}
            <div className="absolute inset-0 flex items-center justify-center select-none pointer-events-none text-zinc-200 dark:text-zinc-800 font-lexend font-black text-9xl opacity-60">
              {selectedTarget}
            </div>

            <canvas
              ref={canvasRef}
              width={360}
              height={260}
              onMouseDown={handleStartDrawing}
              onMouseMove={handleDraw}
              onMouseUp={handleEndDrawing}
              onMouseLeave={handleEndDrawing}
              onTouchStart={handleStartDrawing}
              onTouchMove={handleDraw}
              onTouchEnd={handleEndDrawing}
              className="relative z-10 cursor-crosshair touch-none"
            />
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              onClick={handleClearCanvas}
              className="px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs font-bold flex items-center gap-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-700"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear Canvas</span>
            </button>

            {activeChild && (
              <button
                onClick={handleSaveTelemetry}
                disabled={submitting || totalPointsCount === 0}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Save Telemetry to Profile</span>
              </button>
            )}
          </div>
        </div>

        {/* Real-Time Kinematic Analysis Inspector */}
        <div className="p-6 rounded-3xl bg-zinc-900 text-zinc-100 border border-zinc-800 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                <Activity className="w-4 h-4" />
                <span>Kinematic Feature Extractor</span>
              </span>
              <span className="text-[11px] font-mono text-emerald-400">
                ● Sub-Millisecond Analysis
              </span>
            </div>

            {liveAnalysis ? (
              <div className="space-y-4 my-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 bg-zinc-800/80 rounded-xl">
                    <div className="text-[10px] text-zinc-400 uppercase">Consistency Index</div>
                    <div className="text-2xl font-black text-emerald-400 font-mono">
                      {liveAnalysis.strokeConsistencyScore} / 100
                    </div>
                  </div>
                  <div className="p-3 bg-zinc-800/80 rounded-xl">
                    <div className="text-[10px] text-zinc-400 uppercase">Motor Risk Score</div>
                    <div className="text-2xl font-black text-amber-400 font-mono">
                      {liveAnalysis.handwritingRiskScore} / 100
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                  <div className="p-2 bg-zinc-800/50 rounded-lg">
                    <div className="text-[10px] text-zinc-400">Jitter Index</div>
                    <div className="font-bold text-white">{liveAnalysis.directionalJitterIndex}</div>
                  </div>
                  <div className="p-2 bg-zinc-800/50 rounded-lg">
                    <div className="text-[10px] text-zinc-400">Velocity CV</div>
                    <div className="font-bold text-white">{liveAnalysis.velocityVariationCV}</div>
                  </div>
                  <div className="p-2 bg-zinc-800/50 rounded-lg">
                    <div className="text-[10px] text-zinc-400">Pen Lifts</div>
                    <div className="font-bold text-white">{liveAnalysis.penLifts}</div>
                  </div>
                </div>

                <div className="p-3 bg-zinc-800/40 rounded-xl text-xs space-y-1">
                  <div className="text-[10px] uppercase font-bold text-zinc-400">Spatial Geometry:</div>
                  <p className="text-zinc-300 font-mono text-[11px]">
                    {liveAnalysis.spatial?.orientationNotes || 'Normal spatial orientation'}
                  </p>
                  {liveAnalysis.spatial?.isSuspectedReversal && (
                    <div className="text-rose-400 font-bold text-[11px]">
                      ⚠ Mirror reversal detected for '{selectedTarget}'!
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-zinc-500 text-xs my-4 bg-zinc-800/30 rounded-2xl border border-dashed border-zinc-800">
                <PenTool className="w-8 h-8 mx-auto mb-2 text-zinc-600" />
                <span>Draw on the canvas to inspect real-time stroke velocity, jitter, pen lifts, and spatial metrics.</span>
              </div>
            )}
          </div>

          {savedTelemetry && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-800 rounded-xl text-xs text-emerald-300 font-mono">
              ✓ Telemetry saved to database (Session ID: {savedTelemetry.id})
            </div>
          )}
        </div>

      </div>

      {/* Guided Writing Module Explanation */}
      <div className="p-6 rounded-3xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 space-y-3">
        <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-600" />
          <span>Multimodal Motor Feature Integration</span>
        </h3>
        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
          The kinematic telemetry captured on this canvas is processed directly by <code>backend/src/engine/handwritingFeatureExtractor.js</code> and fused into the Level 1 and Level 2 ML scoring engines alongside oral reading fluency and letter reversal tests.
        </p>
      </div>

    </div>
  );
}
