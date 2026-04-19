import React, { useState, useEffect } from 'react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { getSkillGap, getSkillCareers } from '../api';

// ── Shadcn-style Card primitives ──────────────────────────────────────────────
function Card({ children, className = '' }) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>
      {children}
    </div>
  );
}
function CardHeader({ children }) {
  return <div className="px-6 pt-5 pb-3 border-b border-slate-100">{children}</div>;
}
function CardTitle({ children }) {
  return <h3 className="text-sm font-semibold text-slate-700">{children}</h3>;
}
function CardDescription({ children }) {
  return <p className="text-xs text-slate-400 mt-0.5">{children}</p>;
}
function CardContent({ children, className = '' }) {
  return <div className={`px-6 py-4 ${className}`}>{children}</div>;
}
function CardFooter({ children }) {
  return <div className="px-6 pb-5 pt-2">{children}</div>;
}

// ── Match score ring ──────────────────────────────────────────────────────────
function ScoreRing({ score }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="96" height="96" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r={r} fill="none" stroke="#f1f5f9" strokeWidth="8" />
        <circle
          cx="48" cy="48" r={r} fill="none"
          stroke={color} strokeWidth="8"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 48 48)"
          style={{ transition: 'stroke-dasharray 0.8s ease' }}
        />
        <text x="48" y="53" textAnchor="middle" fontSize="18" fontWeight="700" fill={color}>
          {score}%
        </text>
      </svg>
      <span className="text-xs text-slate-400 font-medium">Match Score</span>
    </div>
  );
}

// ── Custom radar tooltip ──────────────────────────────────────────────────────
function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3 text-xs">
      <p className="font-semibold text-slate-700 mb-1">{d?.skill}</p>
      <p className="text-indigo-500">Required: <span className="font-bold">{d?.required}</span></p>
      <p className="text-sky-500">Your level: <span className="font-bold">{d?.current}</span></p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function SkillGapAnalysis() {
  const [careers, setCareers]           = useState([]);
  const [selectedCareer, setSelected]   = useState('');
  const [skillsInput, setSkillsInput]   = useState('');
  const [result, setResult]             = useState(null);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');

  // Load career list on mount
  useEffect(() => {
    getSkillCareers()
      .then(({ data }) => {
        setCareers(data.careers);
        setSelected(data.careers[0] || '');
      })
      .catch(() => {});
  }, []);

  const handleAnalyze = async () => {
    if (!selectedCareer || !skillsInput.trim()) {
      setError('Please select a career and enter your skills.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const skills = skillsInput.split(',').map(s => s.trim()).filter(Boolean);
      const { data } = await getSkillGap(selectedCareer, skills);
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch skill gap data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8">
      {/* Section header */}
      <div className="mb-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Skill Gap Analysis</p>
        <p className="text-slate-500 text-sm mt-0.5">Compare your current skills against a target career's requirements.</p>
      </div>

      {/* Input card */}
      <Card className="mb-5">
        <CardContent className="flex flex-col sm:flex-row gap-3 items-end py-5">
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Target Career</label>
            <select
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-sm
                         focus:outline-none focus:ring-2 focus:ring-indigo-400/40 focus:border-indigo-400 transition"
              value={selectedCareer}
              onChange={e => setSelected(e.target.value)}
            >
              {careers.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex-[2]">
            <label className="block text-xs font-medium text-slate-500 mb-1.5">
              Your Skills <span className="text-slate-400 font-normal">(comma-separated)</span>
            </label>
            <input
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-sm
                         placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 focus:border-indigo-400 transition"
              placeholder="e.g. JavaScript, React, Node.js"
              value={skillsInput}
              onChange={e => setSkillsInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAnalyze()}
            />
          </div>
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="btn-primary whitespace-nowrap px-5 py-2.5 self-end"
          >
            {loading ? <><span className="animate-spin inline-block">⏳</span> Analyzing…</> : '🔍 Analyze Gap'}
          </button>
        </CardContent>
        {error && (
          <div className="px-6 pb-4">
            <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">⚠️ {error}</p>
          </div>
        )}
      </Card>

      {/* Results */}
      {result && (
        <div className="space-y-5">
          {/* Radar + score */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Radar chart */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Skills Radar — {result.career}</CardTitle>
                <CardDescription>Your proficiency vs. what the role requires</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <ResponsiveContainer width="100%" height={320}>
                  <RadarChart data={result.radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis
                      dataKey="skill"
                      tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }}
                    />
                    <PolarRadiusAxis
                      angle={90} domain={[0, 100]}
                      tick={{ fontSize: 10, fill: '#94a3b8' }}
                      tickCount={4}
                    />
                    <Radar
                      name="Required"
                      dataKey="required"
                      stroke="#6366f1"
                      fill="#6366f1"
                      fillOpacity={0.15}
                      strokeWidth={2}
                    />
                    <Radar
                      name="Your Level"
                      dataKey="current"
                      stroke="#38bdf8"
                      fill="#38bdf8"
                      fillOpacity={0.25}
                      strokeWidth={2}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }}
                      formatter={(value) => <span className="text-slate-600">{value}</span>}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Score + summary */}
            <Card className="flex flex-col justify-center items-center py-8 gap-6">
              <ScoreRing score={result.matchScore} />
              <div className="text-center px-4">
                <p className="text-sm font-semibold text-slate-700">
                  {result.matchScore >= 70 ? '🎉 Strong Match' : result.matchScore >= 40 ? '📈 Getting There' : '🚀 Room to Grow'}
                </p>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {result.missingSkills.length === 0
                    ? 'You have all the required skills!'
                    : `${result.missingSkills.length} skill${result.missingSkills.length > 1 ? 's' : ''} to develop for ${result.career}`}
                </p>
              </div>
              <div className="w-full px-4">
                <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-center">
                  <p className="text-xs text-slate-400">Skills matched</p>
                  <p className="text-lg font-bold text-slate-700 mt-0.5">
                    {result.radarData.filter(d => d.current > 0).length}
                    <span className="text-slate-400 font-normal text-sm"> / {result.radarData.length}</span>
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Missing skills cards */}
          {result.missingSkills.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Missing Skills ({result.missingSkills.length})
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {result.missingSkills.map(({ skill, importance, resources }) => (
                  <Card key={skill} className="hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle>{skill}</CardTitle>
                        <ImportanceBadge importance={importance} />
                      </div>
                      <CardDescription>Required for {result.career}</CardDescription>
                    </CardHeader>
                    <CardContent className="py-3">
                      {/* Importance bar */}
                      <div className="mb-1 flex justify-between text-xs text-slate-400">
                        <span>Importance</span>
                        <span>{importance}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-sky-400"
                          style={{ width: `${importance}%` }}
                        />
                      </div>
                    </CardContent>
                    <CardFooter>
                      <a
                        href={resources.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary w-full text-center text-xs py-2 no-underline"
                      >
                        📚 Learn on {resources.source}
                      </a>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {result.missingSkills.length === 0 && (
            <Card className="text-center py-10">
              <p className="text-3xl mb-2">🏆</p>
              <p className="font-semibold text-slate-700">You're fully equipped!</p>
              <p className="text-sm text-slate-400 mt-1">You have all the skills required for {result.career}.</p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function ImportanceBadge({ importance }) {
  if (importance >= 85) return <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-500 border border-red-100 whitespace-nowrap">Critical</span>;
  if (importance >= 65) return <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-500 border border-amber-100 whitespace-nowrap">Important</span>;
  return <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-50 text-slate-500 border border-slate-100 whitespace-nowrap">Useful</span>;
}
