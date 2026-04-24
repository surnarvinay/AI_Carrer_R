import axios from 'axios';

// ✅ Use SAME origin (no env needed now)
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

// ✅ Attach token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && !config.headers['Authorization']) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// ✅ Helper — get userId
const getUserId = () => {
  try {
    const u = JSON.parse(localStorage.getItem('user'));
    return u?.id || 'guest';
  } catch {
    return 'guest';
  }
};

// ================= API CALLS =================

// Recommendations
export const getRecommendations = (data) =>
  api.post('/recommend', { ...data, userId: getUserId() });

// History
export const getHistory = (params = {}) =>
  api.get('/history', { params: { userId: getUserId(), ...params } });

export const deleteHistoryEntry = (id) =>
  api.delete(`/history/${id}`);

export const clearHistory = () =>
  api.delete('/history', { params: { userId: getUserId() } });

// Skills
export const getSkillGap = (career, skills) =>
  api.get('/skills', { params: { career, skills: skills.join(',') } });

export const getSkillCareers = () =>
  api.get('/skills/careers');

// Simulation
export const getScenario = (career_title) =>
  api.post('/simulate', { career_title, mode: 'scenario' });

export const evaluateResponse = (career_title, user_input, conversation_history) =>
  api.post('/simulate', {
    career_title,
    user_input,
    conversation_history,
    mode: 'evaluate',
  });

// Chat
export const sendChatMessage = (message, history) =>
  api.post('/chat', { message, history });

// Interview Simulator
export const startInterview = (topic) =>
  api.post('/interview/start', { topic });

export const nextInterviewQuestion = (sessionId, answer) =>
  api.post('/interview/next', { sessionId, answer });

export const evaluateInterview = (sessionId) =>
  api.post('/interview/evaluate', { sessionId });

export default api;