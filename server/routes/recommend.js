const express = require('express');
const router  = express.Router();

const Recommendation = require('../models/Recommendation');
const UserHistory    = require('../models/UserHistory');
const { calcMatchPercentage } = require('./history');

// ── Gemini setup ──────────────────────────────────────────────────────────────
let genAI = null;
try {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
} catch (_) {}

// ── Universal AI-powered recommendation ──────────────────────────────────────
async function getAIRecommendations(skills, interests, experience) {
  if (!genAI) return null;

  const prompt = `You are a universal career counselor. Based on the following profile, suggest 5 diverse career options across ALL domains (technology, business, finance, government, creative, healthcare, entrepreneurship, skilled trades — not just tech).

Profile:
- Skills: ${skills.join(', ')}
- Interests: ${interests}
- Experience level: ${experience}

Return ONLY valid JSON, no extra text:
{
  "careers": [
    {
      "title": "Career Title",
      "domain": "Domain (e.g. Technology / Finance / Creative / Healthcare / Government / Business / Skilled Trade)",
      "requiredSkills": ["skill1", "skill2", "skill3"],
      "roadmap": ["Step 1", "Step 2", "Step 3", "Step 4"],
      "difficulty": "Easy | Medium | Hard",
      "salaryRange": "e.g. ₹4–8 LPA or $50k–$80k/yr",
      "fitScore": <1-10 integer>
    }
  ]
}`;

  try {
    const model  = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    text = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
    const parsed = JSON.parse(text);
    return parsed.careers || null;
  } catch (err) {
    console.error('Gemini recommend error:', err.message);
    return null;
  }
}

// ── Fallback rule-based (all domains) ────────────────────────────────────────
function getFallbackRecommendations(skills, interests, experience) {
  const careers = [];
  const s = skills.map(sk => sk.toLowerCase());
  const i = interests.toLowerCase();

  // Technology
  if (s.some(sk => ['javascript', 'react', 'node', 'html', 'css', 'typescript'].includes(sk)))
    careers.push('Full Stack Developer', 'Frontend Developer');
  if (s.some(sk => ['python', 'machine learning', 'tensorflow', 'data', 'ai'].includes(sk)))
    careers.push('Data Scientist', 'ML Engineer');
  if (s.some(sk => ['java', 'spring', 'backend', 'sql', 'api'].includes(sk)))
    careers.push('Backend Developer', 'Software Engineer');
  if (s.some(sk => ['figma', 'ui', 'ux', 'design', 'photoshop', 'illustrator'].includes(sk)))
    careers.push('UI/UX Designer', 'Product Designer');
  if (s.some(sk => ['aws', 'docker', 'kubernetes', 'devops', 'linux', 'cloud'].includes(sk)))
    careers.push('DevOps Engineer', 'Cloud Architect');
  if (s.some(sk => ['cybersecurity', 'networking', 'security', 'ethical hacking'].includes(sk)))
    careers.push('Cybersecurity Analyst', 'Penetration Tester');

  // Business / Management
  if (i.includes('management') || i.includes('leadership') || s.includes('management'))
    careers.push('Product Manager', 'Business Analyst', 'Operations Manager');
  if (i.includes('marketing') || s.some(sk => ['seo', 'marketing', 'social media'].includes(sk)))
    careers.push('Digital Marketing Manager', 'Brand Strategist');
  if (i.includes('sales') || s.includes('sales'))
    careers.push('Sales Manager', 'Business Development Executive');

  // Finance
  if (i.includes('finance') || i.includes('accounting') || s.some(sk => ['excel', 'accounting', 'finance', 'tally'].includes(sk)))
    careers.push('Financial Analyst', 'Chartered Accountant', 'Investment Banker');
  if (i.includes('stock') || i.includes('trading') || i.includes('investment'))
    careers.push('Stock Market Analyst', 'Portfolio Manager');

  // Government / Civil Services
  if (i.includes('upsc') || i.includes('civil service') || i.includes('government') || i.includes('ias'))
    careers.push('IAS Officer (UPSC)', 'State Civil Services (MPSC/RPSC)', 'SSC CGL Officer');
  if (i.includes('defence') || i.includes('army') || i.includes('military'))
    careers.push('Defence Officer (NDA/CDS)', 'Police Officer');

  // Creative
  if (i.includes('writing') || s.some(sk => ['writing', 'content', 'blogging'].includes(sk)))
    careers.push('Content Writer', 'Copywriter', 'Journalist');
  if (i.includes('film') || i.includes('video') || s.some(sk => ['video editing', 'filmmaking'].includes(sk)))
    careers.push('Video Editor', 'Film Director', 'YouTuber / Content Creator');
  if (i.includes('music') || s.includes('music'))
    careers.push('Music Producer', 'Sound Engineer');
  if (i.includes('art') || i.includes('illustration') || s.some(sk => ['drawing', 'illustration', 'animation'].includes(sk)))
    careers.push('Graphic Designer', 'Animator', '3D Artist');

  // Healthcare
  if (i.includes('medicine') || i.includes('doctor') || i.includes('health') || s.some(sk => ['biology', 'chemistry', 'mbbs'].includes(sk)))
    careers.push('Doctor (MBBS)', 'Pharmacist', 'Medical Researcher');
  if (i.includes('nursing') || s.includes('nursing'))
    careers.push('Registered Nurse', 'Healthcare Administrator');
  if (i.includes('psychology') || s.includes('psychology'))
    careers.push('Clinical Psychologist', 'Counsellor / Therapist');

  // Entrepreneurship
  if (i.includes('startup') || i.includes('entrepreneur') || i.includes('business idea'))
    careers.push('Startup Founder', 'Social Entrepreneur', 'Franchise Owner');

  // Skilled Trades
  if (i.includes('electrical') || s.includes('electrical'))
    careers.push('Electrician', 'Electrical Engineer');
  if (i.includes('mechanic') || i.includes('automobile') || s.some(sk => ['mechanic', 'automobile'].includes(sk)))
    careers.push('Automobile Mechanic', 'Mechanical Engineer');
  if (i.includes('cooking') || i.includes('chef') || s.includes('cooking'))
    careers.push('Chef / Culinary Artist', 'Restaurant Manager');

  if (careers.length === 0)
    careers.push('Career Counsellor', 'Freelancer', 'Entrepreneur', 'Content Creator', 'Consultant');

  return [...new Set(careers)];
}

// ── POST /api/recommend ───────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    console.log('📩 Incoming request:', req.body);

    const { skills, interests, experience, userId = 'guest' } = req.body;

    if (!skills || !interests || !experience) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const skillsArray = skills
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    // Try AI-powered universal recommendations first
    const aiCareers = await getAIRecommendations(skillsArray, interests, experience);

    let careers;
    let enriched = null;

    if (aiCareers) {
      // AI returned rich objects — extract titles for backward compat
      careers  = aiCareers.map(c => c.title);
      enriched = aiCareers;
    } else {
      careers = getFallbackRecommendations(skillsArray, interests, experience);
    }

    const matchPct = calcMatchPercentage(skillsArray, careers);

    await Recommendation.create({ skills: skillsArray, interests, experience, careers });
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
      enriched,       // null when fallback; array of rich objects when AI
      matchPercentage: matchPct,
    });

  } catch (err) {
    console.error('❌ Recommend Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
