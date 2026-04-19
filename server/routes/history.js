const express = require('express');
const router = express.Router();
const UserHistory = require('../models/UserHistory');

// Utility function
function calcMatchPercentage(skills, careers) {
  const careerSkillMap = {
    'Full Stack Developer': ['javascript', 'react', 'node', 'html', 'css'],
    'Frontend Developer': ['javascript', 'react', 'css', 'html', 'typescript'],
    'Data Scientist': ['python', 'machine learning', 'tensorflow', 'data', 'statistics'],
    'ML Engineer': ['python', 'machine learning', 'tensorflow', 'docker'],
    'Backend Developer': ['java', 'spring', 'sql', 'node', 'backend'],
    'Software Engineer': ['java', 'python', 'javascript', 'sql'],
    'UI/UX Designer': ['figma', 'ui', 'ux', 'design', 'photoshop'],
    'Product Designer': ['figma', 'design', 'ux', 'prototyping'],
    'DevOps Engineer': ['aws', 'docker', 'kubernetes', 'devops', 'linux'],
    'Cloud Architect': ['aws', 'docker', 'kubernetes', 'cloud'],
    'Cybersecurity Analyst': ['cybersecurity', 'networking', 'security', 'linux'],
    'Penetration Tester': ['ethical hacking', 'networking', 'security', 'linux'],
    'Product Manager': ['management', 'leadership', 'agile', 'roadmap'],
    'Engineering Manager': ['management', 'leadership', 'java', 'javascript'],
    'Data Analyst': ['sql', 'data', 'analytics', 'python', 'excel'],
    'Business Intelligence Developer': ['sql', 'data', 'analytics', 'power bi'],
    'Software Developer': ['javascript', 'python', 'java', 'sql'],
    'IT Consultant': ['networking', 'sql', 'linux', 'cloud'],
    'Technical Support Engineer': ['networking', 'linux', 'sql'],
  };

  const userSkillsLower = skills.map(s => s.toLowerCase());
  let totalHits = 0;
  let totalRequired = 0;

  careers.forEach(career => {
    const required = careerSkillMap[career] || [];
    totalRequired += required.length;
    totalHits += required.filter(r =>
      userSkillsLower.some(u => u.includes(r) || r.includes(u))
    ).length;
  });

  if (totalRequired === 0) return 50;
  return Math.round((totalHits / totalRequired) * 100);
}

// ✅ FIXED ROUTES (NO /history prefix here)

// GET /api/history
router.get('/', async (req, res) => {
  try {
    const userId = req.query.userId || 'guest';
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      UserHistory.find({ userId })
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      UserHistory.countDocuments({ userId }),
    ]);

    res.json({
      records,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/history
router.post('/', async (req, res) => {
  try {
    const { userId = 'guest', careerRecommended, skills, interests, experience, matchPercentage } = req.body;

    if (!careerRecommended?.length) {
      return res.status(400).json({ error: 'careerRecommended is required.' });
    }

    const record = await UserHistory.create({
      userId,
      careerRecommended,
      skills: skills || [],
      interests: interests || '',
      experience: experience || '',
      matchPercentage: matchPercentage ?? calcMatchPercentage(skills || [], careerRecommended),
    });

    res.status(201).json(record);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/history/:id
router.delete('/:id', async (req, res) => {
  try {
    const record = await UserHistory.findByIdAndDelete(req.params.id);
    if (!record) return res.status(404).json({ error: 'Record not found.' });
    res.json({ success: true, id: req.params.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/history
router.delete('/', async (req, res) => {
  try {
    const userId = req.query.userId || 'guest';
    const result = await UserHistory.deleteMany({ userId });
    res.json({ success: true, deleted: result.deletedCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ FIXED EXPORT (CRITICAL)
module.exports = router;
module.exports.calcMatchPercentage = calcMatchPercentage;