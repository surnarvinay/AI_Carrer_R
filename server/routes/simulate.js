const express = require('express');
const router = express.Router();

// ── Gemini setup ───────────────────────────
let genAI = null;
try {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
} catch (_) {}

// ── Fallback scenarios ─────────────────────
const SCENARIOS = {
  'Full Stack Developer': [
    { scenario: 'Production login API is failing for 20% users. You have 2 hours before demo. What do you do?' },
    { scenario: 'Design a system for 100k real-time notifications. What architecture do you choose?' },
  ],
};

const DEFAULT_SCENARIOS = [
  { scenario: 'You joined a new team with no docs and no tests. Task due in 3 days. What do you do?' },
];

// ── Fallback evaluation ────────────────────
function evaluateResponse(userInput) {
  const len = userInput.trim().split(/\s+/).length;
  let score = 0;
  let feedback = [];

  if (len < 20) feedback.push('Answer is too short.');
  else if (len > 80) { score += 30; feedback.push('Good detailed answer.'); }

  if (/first|then|finally/i.test(userInput)) {
    score += 30;
    feedback.push('Good structured thinking.');
  }

  if (/api|db|server|debug/i.test(userInput)) {
    score += 30;
    feedback.push('Good technical depth.');
  }

  const grade =
    score >= 80 ? 'Excellent' :
    score >= 50 ? 'Good' :
    score >= 25 ? 'Needs Work' :
    'Keep Practicing';

  return { score, grade, feedback };
}

// ✅ POST /api/simulate
router.post('/', async (req, res) => {
  const { career_title, user_input, mode = 'scenario' } = req.body;

  if (!career_title) {
    return res.status(400).json({ error: 'career_title is required.' });
  }

  // ── SCENARIO MODE ───────────────────────
  if (mode === 'scenario') {
    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const prompt = `Generate a realistic interview scenario for a ${career_title} role. Keep it short.`;

        const result = await model.generateContent(prompt);
        const scenario = result.response.text().trim();

        return res.json({ scenario, source: 'gemini' });
      } catch (err) {
        console.error('Gemini error:', err.message);
      }
    }

    const pool = SCENARIOS[career_title] || DEFAULT_SCENARIOS;
    const picked = pool[Math.floor(Math.random() * pool.length)];

    return res.json({ scenario: picked.scenario, source: 'fallback' });
  }

  // ── EVALUATION MODE ─────────────────────
  if (mode === 'evaluate') {
    if (!user_input) {
      return res.status(400).json({ error: 'user_input required' });
    }

    const { score, grade, feedback } = evaluateResponse(user_input);

    return res.json({
      feedback: feedback.join(' '),
      score: grade,
      followUp: 'Can you improve your answer with more structure?',
      source: 'fallback',
    });
  }

  res.status(400).json({ error: 'Invalid mode' });
});

module.exports = router;