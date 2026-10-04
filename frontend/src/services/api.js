const API_BASE = '/api';

function getAuthHeader() {
  const token = localStorage.getItem('lexiscreen_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errorMsg = data.error || data.message || `Request failed with status ${res.status}`;
    throw new Error(errorMsg);
  }
  return data;
}

export const api = {
  // Auth
  async register(name, email, password, role = 'parent') {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role })
    });
    return handleResponse(res);
  },

  async login(email, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return handleResponse(res);
  },

  async loginDemo() {
    const res = await fetch(`${API_BASE}/auth/demo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return handleResponse(res);
  },

  async getMe() {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  // Children
  async getChildren() {
    const res = await fetch(`${API_BASE}/children`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async getChild(id) {
    const res = await fetch(`${API_BASE}/children/${id}`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async createChild(childData) {
    const res = await fetch(`${API_BASE}/children`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(childData)
    });
    return handleResponse(res);
  },

  async updateChild(id, updates) {
    const res = await fetch(`${API_BASE}/children/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(updates)
    });
    return handleResponse(res);
  },

  // Sessions & Scoring
  async saveLearnSession(childId, sessionData) {
    const res = await fetch(`${API_BASE}/sessions/learn`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ childId, ...sessionData })
    });
    return handleResponse(res);
  },

  async getLessons(childId) {
    const res = await fetch(`${API_BASE}/sessions/lessons?childId=${encodeURIComponent(childId)}`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async getLesson(lessonId, childId) {
    const res = await fetch(`${API_BASE}/sessions/lessons/${encodeURIComponent(lessonId)}?childId=${encodeURIComponent(childId)}`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async saveLessonProgress(progressData) {
    const res = await fetch(`${API_BASE}/sessions/lesson-progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(progressData)
    });
    return handleResponse(res);
  },

  async getAssessmentQuestions(childId, grade = 'UKG', count = 10, module = 'full_screening') {
    const res = await fetch(`${API_BASE}/sessions/questions?childId=${encodeURIComponent(childId || '')}&grade=${encodeURIComponent(grade)}&count=${count}&module=${encodeURIComponent(module)}`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async submitTestSession(childId, payload) {
    const res = await fetch(`${API_BASE}/sessions/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ childId, ...payload })
    });
    return handleResponse(res);
  },

  async getChildSessions(childId) {
    const res = await fetch(`${API_BASE}/sessions/child/${childId}`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async getScoreReport(scoreId) {
    const res = await fetch(`${API_BASE}/sessions/score/${scoreId}`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async getChildSummary(childId) {
    const res = await fetch(`${API_BASE}/sessions/child/${childId}/summary`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  // Phase 2 Canvas Writing Session & Telemetry
  async submitWritingSession(childId, data) {
    const res = await fetch(`${API_BASE}/sessions/writing`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ childId, ...data })
    });
    return handleResponse(res);
  },

  async analyzeHandwriting(strokes, charTarget, canvasBounds, durationSec) {
    const res = await fetch(`${API_BASE}/sessions/handwriting/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ strokes, charTarget, canvasBounds, durationSec })
    });
    return handleResponse(res);
  },

  async analyzeReading(params) {
    const res = await fetch(`${API_BASE}/sessions/reading/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(params)
    });
    return handleResponse(res);
  },

  async getScoreComparison(scoreId) {
    const res = await fetch(`${API_BASE}/sessions/score/${scoreId}/compare`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  // Level 2 ML Inspection & Prediction
  async getMLModelInfo() {
    const res = await fetch(`${API_BASE}/ml/model-info`);
    return handleResponse(res);
  },

  async predictMLRisk(featureVector, grade) {
    const res = await fetch(`${API_BASE}/ml/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ featureVector, grade })
    });
    return handleResponse(res);
  },

  // Scoring Rules Configuration
  async getScoringConfig() {
    const res = await fetch(`${API_BASE}/config/scoring`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async updateScoringConfig(configUpdates) {
    const res = await fetch(`${API_BASE}/config/scoring`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(configUpdates)
    });
    return handleResponse(res);
  },

  async resetScoringConfig() {
    const res = await fetch(`${API_BASE}/config/scoring/reset`, {
      method: 'POST',
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  }
};
