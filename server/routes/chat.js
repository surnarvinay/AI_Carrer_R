const express = require('express');
const router  = express.Router();

// ── Gemini setup — uses gemini-2.0-flash (correct model for SDK v0.24+) ──────
let genAI = null;
try {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const key = process.env.GEMINI_API_KEY;
  if (key && key !== 'your_gemini_api_key_here') {
    genAI = new GoogleGenerativeAI(key);
  }
} catch (_) {}

// ── Comprehensive career knowledge base ──────────────────────────────────────
const KB = [
  // Greetings
  {
    keys: ['hello', 'hi', 'hey', 'good morning', 'good evening', 'howdy', 'sup'],
    reply: "Hey! 👋 I'm your AI Career Assistant. Ask me anything about careers, skills, resumes, interviews, or salary — I'm here to help you land your dream job."
  },
  // What can you do
  {
    keys: ['what can you do', 'help me', 'what do you know', 'capabilities', 'features'],
    reply: "I can help you with: career path guidance, skill recommendations, resume tips, interview preparation, salary negotiation, and job search strategies. Just ask!"
  },
  // Skills
  {
    keys: ['best skill', 'top skill', 'in-demand skill', 'what to learn', 'which skill', 'learn programming', 'learn coding'],
    reply: "The most in-demand skills right now are: JavaScript/TypeScript, Python, React, Node.js, SQL, cloud platforms (AWS/GCP/Azure), Docker, and machine learning. Pick one that aligns with your career goal and build 2-3 real projects around it."
  },
  {
    keys: ['learn javascript', 'javascript beginner', 'start javascript'],
    reply: "Start with javascript.info — it's the best free resource. Learn variables, functions, arrays, objects, then DOM manipulation. Build a to-do app, a weather app, then move to React. Takes about 3-4 months of consistent practice."
  },
  {
    keys: ['learn python', 'python beginner', 'start python'],
    reply: "Python is great for beginners. Start with python.org tutorials or freeCodeCamp. Learn basics → functions → OOP → then pick a path: web (Django/Flask), data science (pandas, numpy), or automation. 2-3 months to get productive."
  },
  {
    keys: ['learn react', 'react beginner', 'start react'],
    reply: "Learn JavaScript fundamentals first, then go to react.dev/learn — the official docs are excellent. Build a few projects: a todo app, a weather app, then a full CRUD app with an API. React + Node.js is a very hireable combo."
  },
  // Resume
  {
    keys: ['resume', 'cv', 'curriculum vitae', 'resume tip', 'write resume', 'resume format'],
    reply: "Resume tips: Keep it to 1 page (2 max for 10+ years exp). Use bullet points starting with action verbs (Built, Reduced, Led, Improved). Add metrics wherever possible — 'Reduced load time by 40%' beats 'Improved performance'. Tailor it to each job description using keywords from the posting."
  },
  {
    keys: ['resume summary', 'objective', 'profile summary'],
    reply: "Write a 2-3 line summary at the top: your role, years of experience, and top 2 skills. Example: 'Full Stack Developer with 2 years building React/Node.js apps. Passionate about clean code and scalable architecture.' Skip the objective — summaries perform better."
  },
  {
    keys: ['ats', 'applicant tracking', 'resume rejected', 'resume not getting calls'],
    reply: "Most companies use ATS (Applicant Tracking Systems) to filter resumes. To pass: use standard section headings (Experience, Education, Skills), avoid tables/columns/graphics, include exact keywords from the job description, and save as PDF unless they ask for Word."
  },
  // Interview
  {
    keys: ['interview', 'interview tip', 'interview prep', 'prepare interview', 'interview question'],
    reply: "Interview prep checklist: 1) Research the company (product, culture, recent news). 2) Practice STAR method for behavioral questions. 3) Do 5+ mock technical interviews on LeetCode/Pramp. 4) Prepare 3 questions to ask them. 5) Review your own resume — they'll ask about everything on it."
  },
  {
    keys: ['star method', 'behavioral question', 'tell me about yourself', 'weakness', 'strength'],
    reply: "STAR method: Situation (set the context), Task (what was your responsibility), Action (what YOU specifically did), Result (measurable outcome). Example for 'Tell me about a challenge': 'Our API was timing out (S). I was tasked with fixing it (T). I added Redis caching (A). Response time dropped 60% (R).'"
  },
  {
    keys: ['technical interview', 'coding interview', 'dsa', 'data structure', 'algorithm', 'leetcode'],
    reply: "For coding interviews: master Arrays, Strings, HashMaps, Trees, and Graphs first. Practice on LeetCode — start with Easy, then Medium. Do 2-3 problems daily for 6-8 weeks. Learn to talk through your thinking out loud. NeetCode.io has a great structured roadmap."
  },
  {
    keys: ['system design', 'design interview', 'architecture interview'],
    reply: "System design interviews test scalability thinking. Study: load balancers, databases (SQL vs NoSQL), caching (Redis), message queues (Kafka), CDNs, and microservices. Practice designing Twitter, URL shortener, and Netflix. 'Grokking System Design' is the go-to resource."
  },
  // Salary
  {
    keys: ['salary', 'pay', 'compensation', 'negotiate', 'how much', 'package', 'ctc', 'offer'],
    reply: "Salary negotiation: Always negotiate — 70% of employers expect it. Research on Glassdoor, Levels.fyi, and LinkedIn Salary. Give a range, not a single number. Counter with 10-20% above their offer. Never reveal your current salary first. The first person to name a number is at a disadvantage."
  },
  {
    keys: ['fresher salary', 'entry level salary', 'junior developer salary', 'first job salary'],
    reply: "Entry-level developer salaries vary widely by location and company. In India: ₹3-8 LPA for service companies, ₹8-20 LPA for product companies. In the US: $70k-$110k. Focus on product companies, startups with funding, or remote roles for better pay as a fresher."
  },
  // Career paths
  {
    keys: ['full stack', 'fullstack', 'full stack developer', 'mern', 'mean'],
    reply: "Full Stack Developer path: HTML/CSS → JavaScript → React (frontend) → Node.js/Express → MongoDB or PostgreSQL (backend) → REST APIs → Git → Docker basics. Build 3 full projects end-to-end. MERN stack (MongoDB, Express, React, Node) is the most popular combo right now."
  },
  {
    keys: ['data science', 'data scientist', 'machine learning', 'ml', 'ai career'],
    reply: "Data Science path: Python → NumPy/Pandas → Data visualization (Matplotlib/Seaborn) → Statistics → Machine Learning (scikit-learn) → Deep Learning (TensorFlow/PyTorch) → SQL. Kaggle competitions are great for building a portfolio. Takes 6-12 months to be job-ready."
  },
  {
    keys: ['devops', 'cloud', 'aws', 'azure', 'gcp', 'kubernetes', 'docker'],
    reply: "DevOps path: Linux basics → Git → Docker → CI/CD (GitHub Actions) → Kubernetes → Cloud (AWS/GCP/Azure). Get the AWS Cloud Practitioner cert first — it's beginner-friendly and recognized everywhere. DevOps engineers are among the highest paid in tech."
  },
  {
    keys: ['ui ux', 'ux design', 'ui design', 'product design', 'figma'],
    reply: "UX/UI Design path: Learn Figma (free, industry standard) → UX principles → user research → wireframing → prototyping → design systems. Build a portfolio of 3-5 case studies showing your process, not just final screens. Dribbble and Behance are good for inspiration."
  },
  {
    keys: ['cybersecurity', 'security', 'ethical hacking', 'penetration testing', 'hacking'],
    reply: "Cybersecurity path: Networking basics (TCP/IP, DNS) → Linux → Python scripting → CompTIA Security+ cert → ethical hacking (TryHackMe, HackTheBox) → CEH or OSCP cert. Bug bounty programs on HackerOne are great for real-world practice and income."
  },
  {
    keys: ['product manager', 'product management', 'pm career'],
    reply: "Product Manager path: Understand the product lifecycle, user research, and agile/scrum. Learn SQL for data analysis. Build a portfolio of case studies. Transition is easier from engineering, design, or business roles. Read 'Inspired' by Marty Cagan and 'The Lean Startup'."
  },
  // Job search
  {
    keys: ['job search', 'find job', 'get job', 'job hunting', 'apply job', 'where to apply'],
    reply: "Job search strategy: 1) LinkedIn — optimize your profile and apply directly. 2) Company career pages — better response rate than job boards. 3) Referrals — 40% of hires come from referrals, so network actively. 4) AngelList/Wellfound for startups. 5) Naukri/Indeed for India. Apply to 10-15 roles/week minimum."
  },
  {
    keys: ['linkedin', 'linkedin profile', 'linkedin tip'],
    reply: "LinkedIn tips: Use a professional photo (3x more profile views). Write a headline beyond your job title — 'React Developer | Building scalable web apps'. Add a summary with your story. Get 3+ recommendations. Post content in your niche weekly — it dramatically increases recruiter reach-outs."
  },
  {
    keys: ['portfolio', 'github', 'projects', 'build projects'],
    reply: "Your portfolio is your proof of work. Build 3 projects: 1 beginner (todo/weather app), 1 intermediate (full CRUD with auth), 1 advanced (real-world problem you solved). Host them on Vercel/Netlify. Keep your GitHub green — recruiters check it. Quality over quantity."
  },
  {
    keys: ['networking', 'network', 'connect people', 'meet developers'],
    reply: "Networking tips: Attend local meetups and hackathons. Engage genuinely on LinkedIn — comment on posts, share insights. Cold message people with a specific ask: 'I'm learning X, would you have 15 mins for a quick call?' Most people say yes. Referrals are the #1 way people get hired."
  },
  // Freelancing
  {
    keys: ['freelance', 'freelancing', 'upwork', 'fiverr', 'remote work', 'work from home'],
    reply: "Freelancing tips: Start on Upwork or Toptal. Niche down — 'React developer for SaaS startups' beats 'web developer'. Your first 3 clients are the hardest — consider doing 1-2 projects at a discount to build reviews. Charge by project, not hourly, once you're established."
  },
  // Certifications
  {
    keys: ['certification', 'certificate', 'cert', 'aws cert', 'google cert'],
    reply: "Worth-it certifications: AWS Cloud Practitioner (beginner cloud), AWS Solutions Architect (mid-level), Google Professional Data Engineer, Kubernetes CKA, CompTIA Security+. Avoid certifications that aren't recognized by employers. Certs complement skills — they don't replace them."
  },
  // Switching careers
  {
    keys: ['career switch', 'career change', 'switch to tech', 'non tech to tech', 'transition'],
    reply: "Switching to tech: It's very doable. Pick a role that leverages your background — finance → fintech, healthcare → health-tech, marketing → growth/analytics. Learn the technical skills (6-12 months), build a portfolio, and highlight your domain expertise as a differentiator. Bootcamps can accelerate the transition."
  },
  // Motivation / general
  {
    keys: ['stuck', 'frustrated', 'give up', 'hard', 'difficult', 'not getting job', 'rejected'],
    reply: "Job searching is genuinely hard — rejection is part of the process, not a reflection of your worth. Most developers apply to 50-100+ roles before landing their first job. Keep a spreadsheet, track what's working, improve your weakest area each week. Consistency beats intensity."
  },
  {
    keys: ['thank', 'thanks', 'thank you', 'helpful', 'great', 'awesome'],
    reply: "Happy to help! 😊 Feel free to ask anything else. You can also use the Recommendations page for a personalized career path, or the Dashboard for skill gap analysis."
  },
];

// ── Smart rule-based engine ───────────────────────────────────────────────────
function smartReply(message, history) {
  const m = message.toLowerCase().trim();

  // Check knowledge base
  for (const entry of KB) {
    if (entry.keys.some(k => m.includes(k))) {
      return entry.reply;
    }
  }

  // Context-aware: if previous bot message was about a topic, continue it
  const lastBot = [...history].reverse().find(h => h.role === 'assistant');
  if (lastBot) {
    const prev = lastBot.content.toLowerCase();
    if (prev.includes('resume') && (m.includes('how') || m.includes('what') || m.includes('example')))
      return "For your resume: use the format — [Action verb] + [what you did] + [result/impact]. Example: 'Built a REST API with Node.js that reduced data fetch time by 35%'. Always quantify results when possible.";
    if (prev.includes('interview') && (m.includes('how') || m.includes('what') || m.includes('example')))
      return "For interviews, practice answering out loud — not just in your head. Record yourself once. Common questions: 'Tell me about yourself', 'Why this company?', 'Describe a challenge you overcame'. Prepare 2-3 strong answers for each.";
  }

  // Fallback with helpful redirect
  const fallbacks = [
    "Great question! I specialize in career guidance. Could you be more specific? For example: 'How do I prepare for a React interview?' or 'What skills should a data scientist have?'",
    "I'm best at helping with careers, skills, resumes, and interviews. Try asking something like 'How do I negotiate salary?' or 'What's the roadmap for DevOps?'",
    "I didn't quite catch that. I can help with: career paths, skill recommendations, resume writing, interview prep, salary negotiation, and job search tips. What would you like to know?",
  ];
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

// ── POST /api/chat ────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const { message, history = [] } = req.body;

  if (!message?.trim()) {
    return res.status(400).json({ error: 'message is required.' });
  }

  // ── Try Gemini first (gemini-2.0-flash is the correct model for SDK v0.24+) ─
  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

      const contextLines = history
        .slice(-6)
        .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n');

      const prompt = `You are a friendly AI Career Assistant inside a career guidance app called CareerAI.
Help users with career advice, skills, resumes, interviews, and job search. Be concise (2-4 sentences), practical, and encouraging. No markdown.

${contextLines ? `Conversation so far:\n${contextLines}\n\n` : ''}User: ${message}
Assistant:`;

      const result = await model.generateContent(prompt);
      const reply  = result.response.text().trim();
      return res.json({ reply, source: 'gemini' });
    } catch (err) {
      // Silently fall through — quota errors, network errors, etc.
    }
  }

  // ── Smart rule-based engine (always works, no API needed) ─────────────────
  const historyForContext = history.map(h => ({ role: h.role, content: h.content }));
  return res.json({ reply: smartReply(message, historyForContext), source: 'local' });
});

module.exports = router;
