import axios from 'axios';

// ✅ FIX: Use full backend URL (safe for dev)
const BASE = 'http://localhost:8060/api';

// ✅ Create axios instance (cleaner + scalable)
const api = axios.create({
  baseURL: BASE,
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

// ✅ FIXED (matches backend: /api/recommend)
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

export default api;