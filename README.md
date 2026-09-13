# LexiScreen — Multimodal Learning-Difficulty Screening System

> **Crucial Ethical Notice**:
> **This system is a preliminary screening indicator, NOT a medical or clinical diagnosis.** Results highlight early developmental risk indicators and literacy friction for parents and educators. For comprehensive clinical evaluation, consult a certified educational psychologist or speech-language pathologist.

---

## 🌟 Overview & Architecture

**LexiScreen** is a web-based multimodal screening platform designed for children, parents, and educators. It implements a gentle, evidence-based two-step sequence:
1. **Learn Window (Practice Mode)**: Letter reversal drills (`b/d`, `p/q`, `m/w`, `n/u`) with orientation cues, audio pronunciation, and synchronized word-by-word read-along text. **Zero scoring is recorded** — pure exposure and low-pressure exploration.
2. **Test Window (Assessment Mode)**: Timed visual discrimination quiz + oral speech read-aloud assessment powered by the browser's native Web Speech API.
3. **Rule-Based Level 1 Scoring Engine**: Server-side validated calculation computing composite risk (0–100) and mapping to **Low / Moderate / High Risk** categories against grade-level fluency benchmarks.
4. **Parent / Educator Dashboard**: Interactive Recharts tracking risk scores over time, reading speed (WPM) progress, active streaks, and a cumulative breakdown of most-confused characters.
5. **Dyslexia-Friendly Accessibility Suite**: Available across all screens — font switcher (`OpenDyslexic`, `Lexend`, `Comic Neue`), anti-glare themes (Warm Cream, Pastel Mint, Soft Peach, Calming Blue, Dark), letter/word spacing adjusters, focus reading ruler, and speech playback speed control.

---

## 🚀 $0 Budget / Free-Tier Guarantee

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Recharts, Canvas Confetti.
- **Backend**: Node.js, Express, Atomic Persistent JSON/SQLite file store (`data/screener_db.json`), JWT Auth.
- **Speech**: Browser-native **Web Speech API** (free in Chrome/Edge — $0 cost, zero API keys required).
- **Data Minimization**: Extracted numeric feature vectors (WPM, pause timing, accuracy %, duration, reversal errors) are stored instead of raw audio files, eliminating costly storage tiers.
- **Zero Card Requirement**: Runs locally out of the box with zero external accounts or credit cards needed.

---

## 💻 Local Setup & Execution Guide

### Prerequisites
- Node.js (v18+) and npm installed on your machine.

### 1. Start the Backend API & Scoring Engine
```bash
cd backend
npm install
npm run dev
```
*Backend runs at `http://localhost:5000`*

To run the automated scoring engine test suite:
```bash
npm test
```

### 2. Start the Frontend Application
In a separate terminal window:
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs at `http://localhost:5173`*

---

## 🧠 Scoring Engine Configuration

All formula weights, cutoff thresholds, and grade-level fluency benchmarks are centralized in one single module:
👉 [`backend/src/config/scoringConfig.js`](file:///C:/Users/pihuu/.gemini/antigravity/scratch/dyslexia-screener/backend/src/config/scoringConfig.js)

### Default Feature Weights (Sum = 1.0)
- **Letter Reversal Error Rate**: `0.30` (30% weight on mirror letters `b/d`, `p/q`, etc.)
- **Reading Accuracy**: `0.25` (25% weight on word decoding accuracy)
- **Reading Fluency (WPM)**: `0.20` (20% weight compared to developmental grade baseline)
- **Pauses & Hesitation**: `0.15` (15% weight on pauses > 1.8s and decoding latency)
- **Flashcard Accuracy**: `0.10` (10% baseline visual recognition)

### Risk Cutoffs (0 - 100)
- **Low Risk**: `0` to `34.9`
- **Moderate Risk**: `35.0` to `64.9`
- **High Risk**: `>= 65.0`

---

## 🔒 Security & Data Privacy
- **Parental Consent Gate**: No child profile can take an assessment until explicit parental/guardian consent is digitally affirmed and logged with an audit timestamp.
- **Access Control**: Child records and test results are scoped strictly to the authenticated parent/educator.
- **Data Minimization**: Audio is processed directly in the client browser through Web Speech API; only discrete numerical metrics are stored on the server.

---

## 🔮 Phase 2 Extension Architecture
1. **Handwriting Tracing Module**:
   - Preview & interactive telemetry available at `/handwriting-preview`.
   - Data schema prepared in `writingSessions` recording `[{x, y, t, pressure}]`, pen lifts, duration, and bounding box ratios.
2. **Level 2 ML Predictive Risk Model**:
   - Hooked up in `backend/src/engine/mlEngineStub.js`.
   - Designed to run an ensemble Logistic Regression / Decision Tree alongside Level 1 once sufficient anonymized session datasets are accumulated.
