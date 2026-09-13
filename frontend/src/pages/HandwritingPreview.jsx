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
  Info
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
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
  };

  const handleDraw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();

    const coords = getCanvasCoordinates(e);
    setCurrentStroke(prev => [...prev, coords]);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const handleEndDrawing = (e) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    setPenLifts(prev => prev + 1);

    if (currentStroke.length > 0) {
      setStrokes(prev => [...prev, currentStroke]);
      setCurrentStroke([]);
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
    setSavedTelemetry(null);
  };

  const handleTestTelemetrySubmit = async () => {
    if (!activeChild) return;
    setSubmitting(true);
    const durationSec = startTime ? Math.max(1, Math.round((Date.now() - startTime) / 1000)) : 1;
    
    // Flatten stroke points
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
    } catch (err) {
      console.warn('Writing telemetry save error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const totalPointsCount = strokes.reduce((acc, s) => acc + s.length, 0);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 text-xs font-bold">
          <BrainCircuit className="w-3.5 h-3.5 text-purple-600" />
          <span>Phase 2 Architecture Stub & Extension Point</span>
        </div>
        <h1 className="text-3xl font-black text-zinc-900 dark:text-zinc-100">
          Canvas Handwriting & Stroke Tracing Preview
        </h1>
        <p className="text-xs text-zinc-500 max-w-2xl leading-relaxed">
          This interactive preview showcases how Phase 2 handwriting telemetry (coordinate time series, pen lifts, stroke acceleration, and bounding boxes) will slot directly into our screening engine.
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
              {['b', 'd', 'p', 'q'].map(char => (
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
                onClick={handleTestTelemetrySubmit}
                disabled={submitting || totalPointsCount === 0}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Test Server Telemetry</span>
              </button>
            )}
          </div>
        </div>

        {/* Real-Time Telemetry Stream Inspector */}
        <div className="p-6 rounded-3xl bg-zinc-900 text-zinc-100 border border-zinc-800 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                <Code className="w-4 h-4" />
                <span>Extracted Feature Telemetry</span>
              </span>
              <span className="text-[11px] font-mono text-emerald-400">
                ● Live Streaming
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 my-4">
              <div className="p-3 bg-zinc-800/80 rounded-xl">
                <div className="text-[10px] text-zinc-400 uppercase">Points Logged</div>
                <div className="text-lg font-black text-white font-mono">{totalPointsCount}</div>
              </div>
              <div className="p-3 bg-zinc-800/80 rounded-xl">
                <div className="text-[10px] text-zinc-400 uppercase">Pen Lifts</div>
                <div className="text-lg font-black text-white font-mono">{penLifts}</div>
              </div>
              <div className="p-3 bg-zinc-800/80 rounded-xl">
                <div className="text-[10px] text-zinc-400 uppercase">Target</div>
                <div className="text-lg font-black text-purple-400 font-mono">'{selectedTarget}'</div>
              </div>
            </div>

            {/* Live Point Samples */}
            <div className="space-y-1">
              <div className="text-[10px] uppercase font-bold text-zinc-400">
                Latest Coordinate Stream (x, y, timestamp):
              </div>
              <div className="h-32 overflow-y-auto bg-black/40 rounded-xl p-3 font-mono text-[11px] text-zinc-300 space-y-0.5">
                {strokes.length > 0 ? (
                  strokes.flatMap(s => s).slice(-10).map((pt, i) => (
                    <div key={i} className="text-zinc-400">
                      [Point #{i + 1}] x: <span className="text-indigo-300">{pt.x}</span>, y: <span className="text-indigo-300">{pt.y}</span>, t: <span className="text-zinc-500">{pt.t}</span>
                    </div>
                  ))
                ) : (
                  <span className="text-zinc-600 italic">Draw on the canvas above to inspect live coordinate telemetry...</span>
                )}
              </div>
            </div>
          </div>

          {savedTelemetry && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-800 rounded-xl text-xs text-emerald-300 font-mono">
              ✓ Telemetry saved to backend (Session ID: {savedTelemetry.id})
            </div>
          )}
        </div>

      </div>

      {/* Phase 2 Architecture Specification */}
      <div className="p-6 rounded-3xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 space-y-3">
        <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-600" />
          <span>Phase 2 Architecture & Data Model Integration Plan</span>
        </h3>
        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
          The backend database and session routers already feature dedicated schemas for <code>writingSessions</code> and <code>mlRiskPredictions</code>. In Phase 2:
        </p>
        <ul className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400 pl-4 list-disc">
          <li><strong>Stroke Dynamics:</strong> Jerk/acceleration variance and pen-lift count will detect motor dysgraphia tendencies.</li>
          <li><strong>Orientation Ratio:</strong> Bounding box height-to-width and loop placement will mathematically distinguish 'b' from 'd'.</li>
          <li><strong>Level 2 ML Integration:</strong> Feature vectors will feed into our trained Logistic Regression / Decision Tree ensemble model alongside speech and flashcard features.</li>
        </ul>
      </div>

    </div>
  );
}
