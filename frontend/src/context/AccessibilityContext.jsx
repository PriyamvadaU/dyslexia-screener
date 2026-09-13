import React, { createContext, useContext, useState, useEffect } from 'react';

const AccessibilityContext = createContext(null);

export const FONTS = [
  { id: 'Lexend', name: 'Lexend (Recommended for Fluency)', family: "'Lexend', sans-serif" },
  { id: 'OpenDyslexic', name: 'OpenDyslexic (Weighted Bottom)', family: "'OpenDyslexic', sans-serif" },
  { id: 'Comic Neue', name: 'Comic Neue (Friendly Letterforms)', family: "'Comic Neue', cursive, sans-serif" },
  { id: 'Inter', name: 'Inter (Clean Sans-Serif)', family: "'Inter', sans-serif" }
];

export const THEMES = [
  { id: 'cream', name: 'Warm Cream (Anti-Glare)', class: 'theme-cream', previewBg: '#FAF6EE', border: '#E8DFD0' },
  { id: 'pastel-green', name: 'Pastel Mint', class: 'theme-pastel-green', previewBg: '#F0F7F2', border: '#D1E7D7' },
  { id: 'pastel-peach', name: 'Soft Peach', class: 'theme-pastel-peach', previewBg: '#FCF5EE', border: '#F3DEC9' },
  { id: 'soft-blue', name: 'Calming Blue', class: 'theme-soft-blue', previewBg: '#F0F6FC', border: '#D2E3F5' },
  { id: 'dark', name: 'Soft Dark Contrast', class: 'theme-dark', previewBg: '#181920', border: '#333647' }
];

export function AccessibilityProvider({ children }) {
  const [font, setFont] = useState(() => localStorage.getItem('lexi_font') || 'Lexend');
  const [theme, setTheme] = useState(() => localStorage.getItem('lexi_theme') || 'cream');
  const [fontSize, setFontSize] = useState(() => Number(localStorage.getItem('lexi_font_size')) || 1.0);
  const [letterSpacing, setLetterSpacing] = useState(() => localStorage.getItem('lexi_letter_spacing') || '0.04em');
  const [wordSpacing, setWordSpacing] = useState(() => localStorage.getItem('lexi_word_spacing') || '0.12em');
  const [lineHeight, setLineHeight] = useState(() => Number(localStorage.getItem('lexi_line_height')) || 1.65);
  const [speechRate, setSpeechRate] = useState(() => Number(localStorage.getItem('lexi_speech_rate')) || 0.9);
  const [rulerActive, setRulerActive] = useState(() => localStorage.getItem('lexi_ruler') === 'true');
  const [rulerY, setRulerY] = useState(250);

  // Apply visual properties to document root & body
  useEffect(() => {
    const selectedFont = FONTS.find(f => f.id === font) || FONTS[0];
    document.documentElement.style.setProperty('--app-font-family', selectedFont.family);
    document.documentElement.style.setProperty('--app-letter-spacing', letterSpacing);
    document.documentElement.style.setProperty('--app-word-spacing', wordSpacing);
    document.documentElement.style.setProperty('--app-line-height', String(lineHeight));
    document.documentElement.style.fontSize = `${fontSize * 100}%`;

    // Update body theme classes
    THEMES.forEach(t => document.body.classList.remove(t.class));
    const activeTheme = THEMES.find(t => t.id === theme) || THEMES[0];
    document.body.classList.add(activeTheme.class);

    // Persist
    localStorage.setItem('lexi_font', font);
    localStorage.setItem('lexi_theme', theme);
    localStorage.setItem('lexi_font_size', String(fontSize));
    localStorage.setItem('lexi_letter_spacing', letterSpacing);
    localStorage.setItem('lexi_word_spacing', wordSpacing);
    localStorage.setItem('lexi_line_height', String(lineHeight));
    localStorage.setItem('lexi_speech_rate', String(speechRate));
    localStorage.setItem('lexi_ruler', String(rulerActive));
  }, [font, theme, fontSize, letterSpacing, wordSpacing, lineHeight, speechRate, rulerActive]);

  // Mouse move tracker for reading ruler
  useEffect(() => {
    if (!rulerActive) return;
    const handleMouseMove = (e) => setRulerY(e.clientY);
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [rulerActive]);

  const resetToDefaults = () => {
    setFont('Lexend');
    setTheme('cream');
    setFontSize(1.0);
    setLetterSpacing('0.04em');
    setWordSpacing('0.12em');
    setLineHeight(1.65);
    setSpeechRate(0.9);
    setRulerActive(false);
  };

  return (
    <AccessibilityContext.Provider value={{
      font, setFont,
      theme, setTheme,
      fontSize, setFontSize,
      letterSpacing, setLetterSpacing,
      wordSpacing, setWordSpacing,
      lineHeight, setLineHeight,
      speechRate, setSpeechRate,
      rulerActive, setRulerActive,
      resetToDefaults,
      FONTS,
      THEMES
    }}>
      {children}
      {rulerActive && (
        <div 
          className="reading-ruler" 
          style={{ top: `${rulerY}px` }}
          aria-hidden="true"
        />
      )}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) throw new Error('useAccessibility must be used within an AccessibilityProvider');
  return ctx;
}
