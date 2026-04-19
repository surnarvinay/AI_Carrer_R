const express = require('express');
const router = express.Router();

const Recommendation = require('../models/Recommendation');
const UserHistory = require('../models/UserHistory');
const { calcMatchPercentage } = require('./history');

// 🔹 Career Recommendation Logic
function getCareerRecommendations(skills, interests, experience) {
  const careers = [];
  const s = skills.map(sk => sk.toLowerCase());
  const i = interests.toLowerCase();

  if (s.some(sk => ['javascript', 'react', 'node', 'html', 'css'].includes(sk)))
    careers.push('Full Stack Developer', 'Frontend Developer');

  if (s.some(sk => ['python', 'machine learning', 'tensorflow', 'data'].includes(sk)))
    careers.push('Data Scientist', 'ML Engineer');

  if (s.some(sk => ['java', 'spring', 'backend', 'sql'].includes(sk)))
    careers.push('Backend Developer', 'Software Engineer');

  if (s.some(sk => ['figma', 'ui', 'ux', 'design', 'photoshop'].includes(sk)))
    careers.push('UI/UX Designer', 'Product Designer');

  if (s.some(sk => ['aws', 'docker', 'kubernetes', 'devops', 'linux'].includes(sk)))
    careers.push('DevOps Engineer', 'Cloud Architect');

  if (s.some(sk => ['cybersecurity', 'networking', 'security', 'ethical hacking'].includes(sk)))
    careers.push('Cybersecurity Analyst', 'Penetration Tester');

  if (i.includes('management') || i.includes('leadership'))
    careers.push('Product Manager', 'Engineering Manager');

  if (i.includes('data') || i.includes('analytics'))
    careers.push('Data Analyst', 'Business Intelligence Developer');

  if (careers.length === 0)
    careers.push('Software Developer', 'IT Consultant', 'Technical Support Engineer');

  return [...new Set(careers)];
}

// 🔥 MAIN ROUTE → POST /api/recommend
router.post('/', async (req, res) => {
  try {
    console.log("📩 Incoming request:", req.body);

    const { skills, interests, experience, userId = 'guest' } = req.body;

    if (!skills || !interests || !experience) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    // Convert skills string → array
    const skillsArray = skills
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const careers = getCareerRecommendations(skillsArray, interests, experience);
    const matchPct = calcMatchPercentage(skillsArray, careers);

    // Save recommendation
    const record = await Recommendation.create({
      skills: skillsArray,
      interests,
      experience,
      careers,
    });

    // Save history
    await UserHistory.create({
      userId,
      careerRecommended: careers,
      skills: skillsArray,
      interests,
      experience,
      matchPercentage: matchPct,
    });

    res.status(200).json({
      success: true,
      careers,
      matchPercentage: matchPct,
      id: record._id,
    });

  } catch (err) {
    console.error('❌ Recommend Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;