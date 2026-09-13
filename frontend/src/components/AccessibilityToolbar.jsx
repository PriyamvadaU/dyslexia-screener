import React, { useState } from 'react';
import { useAccessibility, FONTS, THEMES } from '../context/AccessibilityContext';
import { Sliders, Type, Palette, Volume2, Eye, RotateCcw, X } from 'lucide-react';

export function AccessibilityToolbar() {
  const [isOpen, setIsOpen] = useState(false);
  const {
    font, setFont,
    theme, setTheme,
    fontSize, setFontSize,
    letterSpacing, setLetterSpacing,
    wordSpacing, setWordSpacing,
    speechRate, setSpeechRate,
    rulerActive, setRulerActive,
    resetToDefaults
  } = useAccessibility();

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-xl hover:shadow-2xl transition-all duration-200 border-2 border-white/20 focus:outline-none focus:ring-4 focus:ring-indigo-300"
        aria-label="Open Dyslexia & Accessibility Settings"
      >
        <Sliders className="w-5 h-5 animate-pulse" />
        <span className="text-sm font-semibold tracking-wide">Reading Comfort</span>
      </button>

      {/* Slide-in Settings Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-sm flex justify-end transition-opacity">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 h-full shadow-2xl flex flex-col overflow-y-auto border-l border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100">
            {/* Header */}
            <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-indigo-50/50 dark:bg-zinc-800/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-600 text-white rounded-lg">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-base">Reading & Dyslexia Helper</h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Customized visual and auditory comfort</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-800"
                aria-label="Close settings"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-5 space-y-6 flex-1">
              {/* 1. Dyslexia Font Selector */}
              <div className="space-y-2.5">
                <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
                  <Type className="w-4 h-4 text-indigo-600" />
                  <span>Dyslexia-Friendly Font</span>
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {FONTS.map(f => (
                    <button
                      key={f.id}
                      onClick={() => setFont(f.id)}
                      className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                        font === f.id
                          ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-200 font-semibold shadow-sm'
                          : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 bg-zinc-50/50 dark:bg-zinc-800/50'
                      }`}
                    >
                      <span className="text-sm">{f.name}</span>
                      {font === f.id && <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Visual Theme Palettes */}
              <div className="space-y-2.5">
                <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
                  <Palette className="w-4 h-4 text-indigo-600" />
                  <span>Background Comfort Theme</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {THEMES.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                        theme === t.id
                          ? 'ring-2 ring-indigo-600 border-indigo-600 font-semibold'
                          : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-400'
                      }`}
                      style={{ backgroundColor: t.previewBg }}
                    >
                      <span
                        className="w-4 h-4 rounded-full border border-black/20 shadow-inner flex-shrink-0"
                        style={{ backgroundColor: t.previewBg }}
                      />
                      <span className="text-xs font-medium text-zinc-900">
                        {t.name.split(' ')[0]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Typography Scalers (Size, Letter Spacing, Word Spacing) */}
              <div className="space-y-4 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <div>
                  <div className="flex justify-between text-xs font-bold text-zinc-600 dark:text-zinc-300 mb-1.5">
                    <span>Text Size</span>
                    <span className="text-indigo-600 font-mono">{(fontSize * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.85"
                    max="1.35"
                    step="0.05"
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-400 mt-1">
                    <span>Standard</span>
                    <span>Large</span>
                    <span>Extra Large</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-zinc-600 dark:text-zinc-300 mb-1.5">
                    <span>Letter Spacing (De-crowding)</span>
                    <span className="text-indigo-600 font-mono">{letterSpacing}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Normal', val: '0.02em' },
                      { label: 'Comfort', val: '0.05em' },
                      { label: 'Wide', val: '0.09em' }
                    ].map(item => (
                      <button
                        key={item.label}
                        onClick={() => setLetterSpacing(item.val)}
                        className={`py-1.5 text-xs rounded-lg border font-medium ${
                          letterSpacing === item.val
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-zinc-600 dark:text-zinc-300 mb-1.5">
                    <span>Word Spacing</span>
                    <span className="text-indigo-600 font-mono">{wordSpacing}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Normal', val: '0.08em' },
                      { label: 'Relaxed', val: '0.15em' },
                      { label: 'Spaced', val: '0.22em' }
                    ].map(item => (
                      <button
                        key={item.label}
                        onClick={() => setWordSpacing(item.val)}
                        className={`py-1.5 text-xs rounded-lg border font-medium ${
                          wordSpacing === item.val
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 4. Reading Tools: Guide Ruler & TTS Rate */}
              <div className="space-y-4 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                {/* Ruler Switch */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700">
                  <div className="flex items-center gap-2.5">
                    <Eye className="w-5 h-5 text-indigo-600" />
                    <div>
                      <div className="text-xs font-bold">Focus Reading Ruler</div>
                      <div className="text-[11px] text-zinc-500">Follows cursor to isolate active lines</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setRulerActive(!rulerActive)}
                    className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                      rulerActive ? 'bg-indigo-600' : 'bg-zinc-300 dark:bg-zinc-600'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transition-transform ${
                        rulerActive ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Speech Playback Speed */}
                <div>
                  <div className="flex justify-between text-xs font-bold text-zinc-600 dark:text-zinc-300 mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <Volume2 className="w-4 h-4 text-indigo-600" />
                      Speech Read-Along Speed
                    </span>
                    <span className="text-indigo-600 font-mono">{speechRate}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.6"
                    max="1.3"
                    step="0.1"
                    value={speechRate}
                    onChange={(e) => setSpeechRate(Number(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-400 mt-1">
                    <span>0.6x (Gentle)</span>
                    <span>0.9x (Natural)</span>
                    <span>1.3x (Fast)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex gap-2">
              <button
                onClick={resetToDefaults}
                className="flex-1 py-2.5 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Defaults
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
              >
                Apply & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
