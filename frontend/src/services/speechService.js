/**
 * Web Speech API Service Wrapper
 * Provides Speech-to-Text (STT) assessment capture and Text-to-Speech (TTS) read-along synchronization.
 * Includes Indian English Voice Personas: 'Kavi' (Male) & 'Kavita' (Female).
 */

// Check browser STT support
export function isSpeechRecognitionSupported() {
  return typeof window !== 'undefined' && (
    'SpeechRecognition' in window ||
    'webkitSpeechRecognition' in window
  );
}

// Check browser TTS support
export function isSpeechSynthesisSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/**
 * Resolves available voices and finds the best matching Indian English voice
 * Persona: 'kavi' (Male) or 'kavita' (Female)
 */
export function getIndianEnglishVoice(persona = 'kavi') {
  if (!isSpeechSynthesisSupported()) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  const isMale = persona.toLowerCase() === 'kavi';

  // 1. First priority: Exact en-IN voices with matching gender
  const inVoices = voices.filter(v => v.lang === 'en-IN' || v.lang.startsWith('en_IN') || v.lang.includes('IN'));
  
  if (inVoices.length > 0) {
    if (isMale) {
      const maleIn = inVoices.find(v => 
        v.name.toLowerCase().includes('male') || 
        v.name.toLowerCase().includes('rishi') || 
        v.name.toLowerCase().includes('prabhat') ||
        v.name.toLowerCase().includes('kavi') ||
        v.name.toLowerCase().includes('george')
      );
      if (maleIn) return maleIn;
      return inVoices[0];
    } else {
      const femaleIn = inVoices.find(v => 
        v.name.toLowerCase().includes('female') || 
        v.name.toLowerCase().includes('veena') || 
        v.name.toLowerCase().includes('neerja') ||
        v.name.toLowerCase().includes('kavita') ||
        v.name.toLowerCase().includes('priya') ||
        v.name.toLowerCase().includes('zira')
      );
      if (femaleIn) return femaleIn;
      return inVoices[0];
    }
  }

  // 2. Second priority: Any clear English natural voice
  const generalEnglish = voices.filter(v => v.lang.startsWith('en'));
  if (generalEnglish.length > 0) {
    if (isMale) {
      const maleVoice = generalEnglish.find(v => 
        v.name.toLowerCase().includes('male') || 
        v.name.toLowerCase().includes('david') || 
        v.name.toLowerCase().includes('guy') || 
        v.name.toLowerCase().includes('natural')
      );
      return maleVoice || generalEnglish[0];
    } else {
      const femaleVoice = generalEnglish.find(v => 
        v.name.toLowerCase().includes('female') || 
        v.name.toLowerCase().includes('samantha') || 
        v.name.toLowerCase().includes('zira') || 
        v.name.toLowerCase().includes('jenny')
      );
      return femaleVoice || generalEnglish[0];
    }
  }

  return voices[0] || null;
}

export class SpeechAssessmentTracker {
  constructor({ onInterimTranscript, onFinalTranscript, onPauseDetected, onError, onEnd }) {
    this.onInterimTranscript = onInterimTranscript;
    this.onFinalTranscript = onFinalTranscript;
    this.onPauseDetected = onPauseDetected;
    this.onError = onError;
    this.onEnd = onEnd;

    this.recognition = null;
    this.isRecording = false;
    this.startTime = null;
    this.endTime = null;
    this.transcript = '';
    this.wordTimestamps = [];
    this.pauseEvents = [];
    this.lastSpeechTime = null;
    this.pauseThresholdMs = 1800; // >1.8s silence is a significant decoding pause
    this.silenceCheckInterval = null;
  }

  start() {
    if (!isSpeechRecognitionSupported()) {
      if (this.onError) this.onError(new Error('Speech recognition is not supported in this browser. Please use Chrome or Edge.'));
      return false;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-IN'; // Indian English locale preference

    this.isRecording = true;
    this.startTime = Date.now();
    this.lastSpeechTime = this.startTime;
    this.transcript = '';
    this.wordTimestamps = [];
    this.pauseEvents = [];

    // Periodic silence/hesitation detector
    this.silenceCheckInterval = setInterval(() => {
      if (!this.isRecording || !this.lastSpeechTime) return;
      const silenceDuration = Date.now() - this.lastSpeechTime;
      if (silenceDuration >= this.pauseThresholdMs) {
        const pauseRecord = {
          timestamp: Date.now(),
          durationMs: silenceDuration
        };
        this.pauseEvents.push(pauseRecord);
        if (this.onPauseDetected) this.onPauseDetected(pauseRecord);
        this.lastSpeechTime = Date.now(); // reset to avoid continuous duplicate count
      }
    }, 500);

    this.recognition.onresult = (event) => {
      let interim = '';
      let finalChunk = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const result = event.results[i];
        const text = result[0].transcript;
        if (result.isFinal) {
          finalChunk += text + ' ';
          this.transcript += text + ' ';
          this.wordTimestamps.push({
            words: text.trim().split(/\s+/),
            timestamp: Date.now()
          });
        } else {
          interim += text;
        }
      }

      this.lastSpeechTime = Date.now();

      if (this.onInterimTranscript) {
        this.onInterimTranscript(this.transcript + interim);
      }
      if (finalChunk && this.onFinalTranscript) {
        this.onFinalTranscript(this.transcript.trim());
      }
    };

    this.recognition.onerror = (event) => {
      console.warn('[SpeechTracker] Recognition error:', event.error);
      if (this.onError) this.onError(event);
    };

    this.recognition.onend = () => {
      if (this.isRecording) {
        try {
          this.recognition.start();
        } catch (e) {
          // ignore
        }
      } else {
        if (this.onEnd) this.onEnd();
      }
    };

    try {
      this.recognition.start();
      return true;
    } catch (err) {
      if (this.onError) this.onError(err);
      return false;
    }
  }

  stop() {
    this.isRecording = false;
    this.endTime = Date.now();

    if (this.silenceCheckInterval) {
      clearInterval(this.silenceCheckInterval);
      this.silenceCheckInterval = null;
    }

    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (err) {
        // ignore
      }
    }

    return this.getAssessmentMetrics();
  }

  getAssessmentMetrics() {
    const durationMs = (this.endTime || Date.now()) - (this.startTime || Date.now());
    const durationSec = Math.max(1, Math.round(durationMs / 1000));
    const wordsSpoken = this.transcript.trim() ? this.transcript.trim().split(/\s+/).length : 0;
    const wpm = durationSec > 0 ? Math.round((wordsSpoken / durationSec) * 60) : 0;
    
    const pauseCount = this.pauseEvents.length;
    const totalPauseDurationMs = this.pauseEvents.reduce((acc, p) => acc + p.durationMs, 0);
    const averageHesitationMs = pauseCount > 0 ? Math.round(totalPauseDurationMs / pauseCount) : 0;

    return {
      durationSec,
      wordsSpoken,
      wpm,
      pauseCount,
      totalPauseDurationMs,
      averageHesitationMs,
      transcript: this.transcript.trim()
    };
  }
}

/**
 * Text-to-Speech Player with Indian English Voice support (Kavi / Kavita)
 * Speed modes: 'slow' (0.85), 'normal' (1.0), 'fast' (1.15) or direct numeric rate
 */
export function playReadAlongText({ 
  text, 
  rate = 0.88, 
  persona = 'kavi', 
  pitch = 1.0,
  onWordBoundary, 
  onStart, 
  onEnd, 
  onError 
}) {
  if (!isSpeechSynthesisSupported()) {
    if (onError) onError(new Error('Speech synthesis is not supported in this browser.'));
    return null;
  }

  window.speechSynthesis.cancel(); // Stop any pending speech

  let actualRate = typeof rate === 'number' ? rate : (rate === 'slow' ? 0.85 : rate === 'fast' ? 1.15 : 1.0);
  actualRate = Math.max(0.5, Math.min(1.8, actualRate));

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = actualRate;
  utterance.pitch = persona === 'kavita' ? Math.max(pitch, 1.05) : pitch;
  utterance.lang = 'en-IN';

  const voice = getIndianEnglishVoice(persona);
  if (voice) utterance.voice = voice;

  if (onStart) utterance.onstart = onStart;
  if (onEnd) utterance.onend = onEnd;
  if (onError) utterance.onerror = onError;

  if (onWordBoundary) {
    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        onWordBoundary(event.charIndex);
      }
    };
  }

  window.speechSynthesis.speak(utterance);
  return utterance;
}

export function stopSpeechSynthesis() {
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.cancel();
  }
}

