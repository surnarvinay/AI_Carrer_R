const express = require('express');
const router = express.Router();

// 🔹 Career skill requirements
const CAREER_REQUIREMENTS = {
  'Full Stack Developer': {
    JavaScript: 95, React: 85, 'Node.js': 80, SQL: 70,
    CSS: 75, Docker: 60, Git: 80, TypeScript: 70,
  },
  'Frontend Developer': {
    JavaScript: 95, React: 90, CSS: 90, TypeScript: 75,
    Git: 75, Figma: 60, 'Node.js': 40, SQL: 30,
  },
  'Data Scientist': {
    Python: 95, 'Machine Learning': 90, SQL: 80, Statistics: 85,
    TensorFlow: 70, 'Data Visualization': 75, Git: 60, Docker: 50,
  },
  'ML Engineer': {
    Python: 95, 'Machine Learning': 95, TensorFlow: 85, Docker: 75,
    SQL: 65, Git: 80, 'Cloud (AWS/GCP)': 70, Statistics: 80,
  },
  'Backend Developer': {
    'Node.js': 85, SQL: 85, Docker: 70, Git: 80,
    Java: 70, 'REST APIs': 90, TypeScript: 65, Redis: 55,
  },
  'DevOps Engineer': {
    Docker: 95, Kubernetes: 90, Linux: 85, 'CI/CD': 90,
    'Cloud (AWS/GCP)': 85, Git: 80, Python: 60, Terraform: 75,
  },
};

// 🔹 Normalize skill
function normalize(s) {
  return s.toLowerCase().replace(/[.\s_-]/g, '');
}

// 🔹 Fuzzy match
function matchSkill(userSkill, requiredSkill) {
  const u = normalize(userSkill);
  const r = normalize(requiredSkill);
  return u === r || r.includes(u) || u.includes(r);
}

// ✅ GET /api/skills
router.get('/', (req, res) => {
  const { career, skills } = req.query;

  if (!career || !skills) {
    return res.status(400).json({
      error: 'career and skills query params are required.',
    });
  }

  const requirements = CAREER_REQUIREMENTS[career];

  if (!requirements) {
    return res.status(404).json({
      error: `Career "${career}" not found.`,
      availableCareers: Object.keys(CAREER_REQUIREMENTS),
    });
  }

  const userSkills = skills.split(',').map(s => s.trim()).filter(Boolean);

  // 🔹 Radar Data
  const radarData = Object.entries(requirements).map(([skill, required]) => {
    const matched = userSkills.find(us => matchSkill(us, skill));
    const userScore = matched
      ? Math.round(required * (0.8 + Math.random() * 0.2))
      : 0;

    return { skill, required, current: userScore };
  });

  // 🔹 Missing Skills
  const missingSkills = Object.entries(requirements)
    .filter(([skill]) => !userSkills.find(us => matchSkill(us, skill)))
    .sort((a, b) => b[1] - a[1])
    .map(([skill, importance]) => ({
      skill,
      importance,
      resources: getResources(skill),
    }));

  // 🔹 Match Score
  const totalRequired = Object.values(requirements).reduce((a, b) => a + b, 0);
  const totalCurrent = radarData.reduce((a, b) => a + b.current, 0);
  const matchScore = Math.round((totalCurrent / totalRequired) * 100);

  res.json({ career, radarData, missingSkills, matchScore });
});

// ✅ GET /api/skills/careers
router.get('/careers', (req, res) => {
  res.json({ careers: Object.keys(CAREER_REQUIREMENTS) });
});

// 🔹 Learning Resources
function getResources(skill) {
  const map = {
    JavaScript: { url: 'https://javascript.info', source: 'javascript.info' },
    React: { url: 'https://react.dev/learn', source: 'react.dev' },
    Python: { url: 'https://docs.python.org/3/tutorial', source: 'python.org' },
    SQL: { url: 'https://sqlzoo.net', source: 'SQLZoo' },
    Docker: { url: 'https://docs.docker.com/get-started', source: 'Docker Docs' },
    Git: { url: 'https://git-scm.com/book/en/v2', source: 'Pro Git' },
  };

  return (
    map[skill] || {
      url: `https://www.google.com/search?q=learn+${encodeURIComponent(skill)}`,
      source: 'Google',
    }
  );
}

module.exports = router;