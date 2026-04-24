const express = require('express');
const router  = express.Router();

// ── Gemini setup ──────────────────────────────────────────────────────────────
let genAI = null;
try {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
} catch (_) {}

// ── In-memory session store (keyed by sessionId) ──────────────────────────────
// For production, replace with Redis or MongoDB TTL collection
const sessions = new Map();

function makeSessionId() {
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// ── Difficulty label by question number ──────────────────────────────────────
function difficulty(n) {
  if (n <= 3) return 'basic';
  if (n <= 7) return 'intermediate';
  return 'advanced / scenario-based';
}

// ── Gemini: generate one question ────────────────────────────────────────────
async function generateQuestion(topic, questionNumber, previousQA) {
  if (!genAI) return fallbackQuestion(topic, questionNumber);

  const level = difficulty(questionNumber);
  const history = previousQA
    .map((qa, i) => `Q${i + 1}: ${qa.question}\nA${i + 1}: ${qa.answer}`)
    .join('\n');

  const prompt = `You are a senior technical interviewer conducting a 10-question technical interview on: "${topic}".

Question ${questionNumber} of 10. Difficulty: ${level}.

${history ? `Previous Q&A:\n${history}\n` : ''}

Generate a TECHNICAL question ${questionNumber} that tests real knowledge and practical skills in ${topic}.
Rules:
- Must be a genuine technical/domain-specific question (not generic like "what interests you")
- Match the difficulty level: ${level}
- Do NOT repeat previous questions
- For basic: test fundamental concepts and definitions
- For intermediate: test application, trade-offs, and problem-solving
- For advanced/scenario-based: test system design, debugging real problems, or architectural decisions
- Return ONLY valid JSON, nothing else:
{"question": "your technical question here", "questionNumber": ${questionNumber}, "totalQuestions": 10, "isCompleted": false}`;

  try {
    const model  = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();

    // Strip markdown code fences if present
    text = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();

    const parsed = JSON.parse(text);
    return parsed;
  } catch (err) {
    console.error('Gemini question error:', err.message);
    return fallbackQuestion(topic, questionNumber);
  }
}

// ── Gemini: generate final evaluation ────────────────────────────────────────
async function generateEvaluation(topic, qa) {
  if (!genAI) return fallbackEvaluation(qa);

  const transcript = qa
    .map((item, i) => `Q${i + 1} [${difficulty(i + 1)}]: ${item.question}\nAnswer: ${item.answer}`)
    .join('\n\n');

  const prompt = `You are an expert interviewer. Evaluate this 10-question interview on "${topic}".

Transcript:
${transcript}

Provide a comprehensive evaluation. Return ONLY valid JSON, nothing else:
{
  "isCompleted": true,
  "score": <integer 0-10>,
  "maxScore": 10,
  "performanceLevel": "<Excellent|Good|Average|Poor>",
  "summary": "<2-3 sentence overall summary>",
  "strengths": ["<point1>", "<point2>"],
  "weaknesses": ["<point1>", "<point2>"],
  "improvements": ["<action1>", "<action2>"],
  "careerSuggestions": [
    {"role": "<role name>", "fitScore": <1-10>},
    {"role": "<role name>", "fitScore": <1-10>}
  ]
}`;

  try {
    const model  = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();

    text = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();

    const parsed = JSON.parse(text);
    return parsed;
  } catch (err) {
    console.error('Gemini evaluation error:', err.message);
    return fallbackEvaluation(qa);
  }
}

// ── Technical fallback question banks by topic keyword ───────────────────────
const TECH_BANKS = {
  javascript: {
    basic: [
      'What is the difference between `var`, `let`, and `const` in JavaScript?',
      'Explain how `==` differs from `===` in JavaScript.',
      'What is a closure in JavaScript? Give a simple example.',
    ],
    intermediate: [
      'Explain the JavaScript event loop and how asynchronous code is handled.',
      'What is the difference between `Promise.all` and `Promise.allSettled`?',
      'How does prototypal inheritance work in JavaScript?',
      'What are higher-order functions? Give an example using `map`, `filter`, or `reduce`.',
    ],
    advanced: [
      'You have a React app with severe re-render performance issues. Walk through your debugging and optimization approach.',
      'Design a client-side caching layer for API responses in a JavaScript SPA. What are the trade-offs?',
      'Explain memory leaks in JavaScript — how do they occur and how do you detect and fix them?',
    ],
  },
  python: {
    basic: [
      'What is the difference between a list and a tuple in Python?',
      'Explain Python\'s GIL (Global Interpreter Lock) in simple terms.',
      'What are Python decorators and how do you write one?',
    ],
    intermediate: [
      'How does Python\'s garbage collection work? What is reference counting?',
      'Explain the difference between `@staticmethod` and `@classmethod`.',
      'What are generators in Python and when would you use them over a list?',
      'How do you handle concurrency in Python — threads vs. asyncio vs. multiprocessing?',
    ],
    advanced: [
      'You need to process 10 million rows of CSV data in Python with limited RAM. What is your approach?',
      'Design a rate-limiter in Python for an API that allows 100 requests per minute per user.',
      'Explain Python\'s descriptor protocol and how it powers `property`, `classmethod`, and `staticmethod`.',
    ],
  },
  react: {
    basic: [
      'What is the difference between state and props in React?',
      'Explain the React component lifecycle (or the equivalent hooks).',
      'What is the virtual DOM and why does React use it?',
    ],
    intermediate: [
      'When would you use `useCallback` vs `useMemo`? Give a concrete example.',
      'Explain React\'s reconciliation algorithm and the role of the `key` prop.',
      'What is the Context API and when should you prefer it over prop drilling?',
      'How do you prevent unnecessary re-renders in a large React component tree?',
    ],
    advanced: [
      'Design the state management architecture for a large-scale React app with real-time data updates.',
      'You notice a React app\'s Time to Interactive is 8 seconds. Walk through your optimization strategy.',
      'Explain React Server Components — how they differ from client components and when to use each.',
    ],
  },
  'data science': {
    basic: [
      'What is the difference between supervised and unsupervised learning?',
      'Explain overfitting and how you would prevent it.',
      'What is the purpose of train/validation/test splits in machine learning?',
    ],
    intermediate: [
      'Explain the bias-variance trade-off with a practical example.',
      'When would you use Random Forest over Logistic Regression?',
      'How do you handle missing data in a dataset? What are the trade-offs of each approach?',
      'What is cross-validation and why is it important?',
    ],
    advanced: [
      'You have a highly imbalanced dataset (1% positive class). How do you build and evaluate a classifier?',
      'Design a real-time fraud detection pipeline for 1 million transactions per day.',
      'Explain gradient boosting from first principles. How does XGBoost improve on vanilla gradient boosting?',
    ],
  },
  'machine learning': {
    basic: [
      'What is the difference between classification and regression?',
      'Explain what a loss function is and give two examples.',
      'What is gradient descent and how does it work?',
    ],
    intermediate: [
      'Explain backpropagation in a neural network step by step.',
      'What is regularization? Compare L1 and L2 regularization.',
      'How does a convolutional neural network (CNN) differ from a fully connected network?',
      'What is the vanishing gradient problem and how is it addressed?',
    ],
    advanced: [
      'Design an ML pipeline to detect anomalies in server logs at scale.',
      'Explain the Transformer architecture — attention mechanism, positional encoding, and why it replaced RNNs.',
      'You are deploying an ML model to production. What monitoring, retraining, and rollback strategies do you implement?',
    ],
  },
  devops: {
    basic: [
      'What is the difference between continuous integration and continuous deployment?',
      'Explain what Docker is and why containers are useful.',
      'What is Infrastructure as Code (IaC)? Name two tools used for it.',
    ],
    intermediate: [
      'How does Kubernetes manage container orchestration? Explain pods, services, and deployments.',
      'What is a blue-green deployment and how does it reduce downtime?',
      'Explain how you would set up a CI/CD pipeline for a Node.js application.',
      'What is the difference between horizontal and vertical scaling?',
    ],
    advanced: [
      'Your Kubernetes cluster is experiencing intermittent pod crashes. Walk through your debugging process.',
      'Design a zero-downtime deployment strategy for a microservices application with a shared database.',
      'How would you implement secrets management across a multi-cloud infrastructure?',
    ],
  },
  cybersecurity: {
    basic: [
      'What is the difference between symmetric and asymmetric encryption?',
      'Explain what SQL injection is and how to prevent it.',
      'What is the OWASP Top 10 and why is it important?',
    ],
    intermediate: [
      'How does a man-in-the-middle attack work and what defenses exist?',
      'Explain the difference between authentication and authorization.',
      'What is a JWT token? What are its security considerations?',
      'How does TLS/SSL work at a high level?',
    ],
    advanced: [
      'You discover a zero-day vulnerability in a production system. Walk through your incident response process.',
      'Design a secure authentication system for a banking application handling 1 million users.',
      'Explain how you would perform a penetration test on a web application — methodology and tools.',
    ],
  },
  'product management': {
    basic: [
      'What is a product roadmap and what should it include?',
      'How do you prioritize features when you have limited engineering resources?',
      'What is the difference between a product manager and a project manager?',
    ],
    intermediate: [
      'Walk me through how you would define success metrics for a new feature launch.',
      'How do you handle a situation where engineering says a feature will take 3 months but stakeholders want it in 3 weeks?',
      'Explain how you would conduct user research to validate a product hypothesis.',
      'What frameworks do you use for product prioritization? Compare RICE and MoSCoW.',
    ],
    advanced: [
      'You are the PM for a product that has plateaued in growth. What is your strategy to re-accelerate?',
      'Design the product strategy for entering a new market with an existing product.',
      'How do you balance technical debt reduction against new feature development in your roadmap?',
    ],
  },
  finance: {
    basic: [
      'What is the difference between a balance sheet, income statement, and cash flow statement?',
      'Explain the concept of time value of money.',
      'What is EBITDA and why is it used?',
    ],
    intermediate: [
      'How do you calculate the intrinsic value of a stock using DCF analysis?',
      'Explain the difference between systematic and unsystematic risk.',
      'What is working capital and how does it affect a company\'s liquidity?',
      'How does monetary policy affect equity markets?',
    ],
    advanced: [
      'Walk through how you would value a pre-revenue startup for a Series A investment.',
      'Design a risk management framework for a portfolio with exposure to emerging markets.',
      'Explain how derivatives are used for hedging — give a real-world example with options.',
    ],
  },
  'ui/ux design': {
    basic: [
      'What is the difference between UI and UX design?',
      'Explain what a wireframe is and when you would use it vs. a prototype.',
      'What are the core principles of visual hierarchy in design?',
    ],
    intermediate: [
      'How do you conduct a usability test? Walk through your process.',
      'Explain the difference between qualitative and quantitative UX research methods.',
      'What is accessibility in design? Name three WCAG guidelines you always follow.',
      'How do you design for mobile-first? What constraints does it impose?',
    ],
    advanced: [
      'You are redesigning a complex enterprise dashboard used by 50,000 users daily. What is your process?',
      'How do you measure the ROI of a UX improvement? What metrics do you track?',
      'Design a design system from scratch for a fintech product — what are the key components and decisions?',
    ],
  },
  sql: {
    basic: [
      'What is the difference between `INNER JOIN`, `LEFT JOIN`, and `FULL OUTER JOIN`?',
      'Explain the difference between `WHERE` and `HAVING` clauses.',
      'What is database normalization? Explain 1NF, 2NF, and 3NF.',
    ],
    intermediate: [
      'How do indexes work in SQL and when can they hurt performance?',
      'Explain window functions — give an example using `ROW_NUMBER` or `RANK`.',
      'What is a CTE (Common Table Expression) and when would you use it over a subquery?',
      'How would you find the second highest salary in an employees table?',
    ],
    advanced: [
      'A query that used to run in 2 seconds now takes 45 seconds. Walk through your optimization process.',
      'Design a database schema for a multi-tenant SaaS application. What are the trade-offs of each approach?',
      'Explain ACID properties and how they are implemented in a relational database.',
    ],
  },
};

// ── Get topic-specific question bank ─────────────────────────────────────────
function getTopicBank(topic) {
  const t = topic.toLowerCase();
  for (const [key, bank] of Object.entries(TECH_BANKS)) {
    if (t.includes(key)) return bank;
  }
  // Generic technical fallback for any other topic
  return {
    basic: [
      `What are the core concepts and fundamentals of ${topic} that every practitioner must know?`,
      `What are the most common tools, technologies, or frameworks used in ${topic}?`,
      `Explain a key terminology or concept in ${topic} that beginners often misunderstand.`,
    ],
    intermediate: [
      `Describe a real technical challenge you would face in ${topic} and how you would solve it.`,
      `What are the best practices for ${topic} that distinguish a junior from a senior professional?`,
      `How do you measure quality or success in ${topic}? What metrics or KPIs matter?`,
      `Compare two competing approaches or methodologies in ${topic} — when would you choose each?`,
    ],
    advanced: [
      `You are leading a large-scale ${topic} project that is failing. What is your recovery plan?`,
      `Design a scalable, production-grade solution for a complex problem in ${topic}.`,
      `How would you mentor a team of juniors in ${topic}? What curriculum and milestones would you set?`,
    ],
  };
}

// ── Fallback question (no Gemini) ─────────────────────────────────────────────
function fallbackQuestion(topic, n) {
  const bank  = getTopicBank(topic);
  const level = difficulty(n);
  const key   = level === 'basic' ? 'basic' : level === 'intermediate' ? 'intermediate' : 'advanced';
  const pool  = bank[key];
  const q     = pool[(n - 1) % pool.length];
  return { question: q, questionNumber: n, totalQuestions: 10, isCompleted: false };
}

// ── Fallback evaluation (no Gemini) ──────────────────────────────────────────
function fallbackEvaluation(qa) {
  const totalWords = qa.reduce((sum, item) => sum + item.answer.trim().split(/\s+/).length, 0);
  const avgWords   = totalWords / qa.length;
  const score      = Math.min(10, Math.round(avgWords / 20));

  const level =
    score >= 8 ? 'Excellent' :
    score >= 6 ? 'Good' :
    score >= 4 ? 'Average' : 'Poor';

  return {
    isCompleted: true,
    score,
    maxScore: 10,
    performanceLevel: level,
    summary: `You completed all 10 questions. Your answers averaged ${Math.round(avgWords)} words each.`,
    strengths: ['Completed all questions', 'Showed willingness to engage'],
    weaknesses: ['Some answers could be more detailed', 'Consider adding examples'],
    improvements: ['Practice elaborating answers with real examples', 'Study core concepts more deeply'],
    careerSuggestions: [
      { role: 'Junior Specialist', fitScore: score },
      { role: 'Trainee / Intern',  fitScore: Math.max(1, score - 1) },
    ],
  };
}

// ── POST /api/interview/start ─────────────────────────────────────────────────
router.post('/start', async (req, res) => {
  const { topic } = req.body;
  if (!topic || !topic.trim()) {
    return res.status(400).json({ error: 'topic is required.' });
  }

  const sessionId = makeSessionId();
  sessions.set(sessionId, { topic: topic.trim(), questionNumber: 1, answers: [], lastQuestion: '' });

  try {
    const response = await generateQuestion(topic.trim(), 1, []);
    // Store the question text so /next can pair it with the user's answer
    const session = sessions.get(sessionId);
    session.lastQuestion = response.question;
    sessions.set(sessionId, session);
    res.json({ sessionId, ...response });
  } catch (err) {
    console.error('Interview start error:', err);
    res.status(500).json({ error: 'Failed to start interview.' });
  }
});

// ── POST /api/interview/next ──────────────────────────────────────────────────
router.post('/next', async (req, res) => {
  const { sessionId, answer } = req.body;

  if (!sessionId || !sessions.has(sessionId)) {
    return res.status(400).json({ error: 'Invalid or expired sessionId. Please start a new interview.' });
  }
  if (!answer || !answer.trim()) {
    return res.status(400).json({ error: 'answer is required.' });
  }

  const session = sessions.get(sessionId);
  const { topic, questionNumber, answers } = session;

  // Store the answer for the current question
  // answers[i] = { question, answer } — question was sent in previous response
  // We need to track the last question asked
  if (!session.lastQuestion) {
    return res.status(400).json({ error: 'No question found for this session.' });
  }

  answers.push({ question: session.lastQuestion, answer: answer.trim() });
  session.answers = answers;

  // If we just answered question 10 → evaluate
  if (questionNumber >= 10) {
    sessions.delete(sessionId); // clean up
    try {
      const evaluation = await generateEvaluation(topic, answers);
      return res.json(evaluation);
    } catch (err) {
      console.error('Evaluation error:', err);
      return res.status(500).json({ error: 'Failed to evaluate interview.' });
    }
  }

  // Otherwise ask next question
  const nextNumber = questionNumber + 1;
  session.questionNumber = nextNumber;

  try {
    const response = await generateQuestion(topic, nextNumber, answers);
    session.lastQuestion = response.question;
    sessions.set(sessionId, session);
    return res.json(response);
  } catch (err) {
    console.error('Next question error:', err);
    return res.status(500).json({ error: 'Failed to get next question.' });
  }
});

// ── POST /api/interview/evaluate ─────────────────────────────────────────────
// Manual early evaluation (optional)
router.post('/evaluate', async (req, res) => {
  const { sessionId } = req.body;

  if (!sessionId || !sessions.has(sessionId)) {
    return res.status(400).json({ error: 'Invalid or expired sessionId.' });
  }

  const { topic, answers } = sessions.get(sessionId);
  sessions.delete(sessionId);

  if (!answers.length) {
    return res.status(400).json({ error: 'No answers to evaluate.' });
  }

  try {
    const evaluation = await generateEvaluation(topic, answers);
    return res.json(evaluation);
  } catch (err) {
    console.error('Manual evaluation error:', err);
    return res.status(500).json({ error: 'Failed to evaluate.' });
  }
});

module.exports = router;
