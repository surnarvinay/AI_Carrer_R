import React, { useEffect, useState } from 'react';
import { getHistory } from '../api';
import SkillGapAnalysis from '../components/SkillGapAnalysis';
import CareerSimulator from '../components/CareerSimulator';

export default function Dashboard() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHistory()
      .then(({ data }) => {
        // getHistory now returns { records, pagination } — extract the array
        const list = Array.isArray(data) ? data : (data.records ?? []);
        setHistory(list);
      })
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, []);

  const careerCount = {};
  history.forEach(({ careerRecommended, careers }) => {
    // support both old `careers` field and new `careerRecommended` field
    const list = careerRecommended ?? careers ?? [];
    list.forEach((c) => { careerCount[c] = (careerCount[c] || 0) + 1; });
  });
  const topCareers = Object.entries(careerCount).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const maxCount = topCareers[0]?.[1] || 1;

  const stats = [
    { label: 'Total Searches',  value: history.length,                        icon: '🔍', color: 'from-indigo-500 to-violet-500' },
    { label: 'Unique Careers',  value: Object.keys(careerCount).length,        icon: '🎯', color: 'from-sky-400 to-cyan-400' },
    { label: 'Last Search', value: history[0]?.date ?? history[0]?.createdAt
        ? new Date(history[0].date ?? history[0].createdAt).toLocaleDateString() : '—', icon: '📅', color: 'from-amber-400 to-orange-400' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">An overview of your career exploration activity.</p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <span className="animate-spin">⏳</span> Loading...
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {stats.map(({ label, value, icon, color }) => (
              <div key={label} className="card flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center text-2xl shadow-sm flex-shrink-0`}>
                  {icon}
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wide font-medium">{label}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Bar chart */}
            <div className="card">
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">Top Recommended Careers</p>
              {topCareers.length === 0 ? (
                <p className="text-sm text-slate-400 dark:text-slate-500">No data yet — try getting some recommendations first.</p>
              ) : (
                <div className="space-y-3">
                  {topCareers.map(([career, count]) => (
                    <div key={career}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-600 dark:text-slate-300 font-medium">{career}</span>
                        <span className="text-slate-400 dark:text-slate-500">{count}x</span>
                      </div>
                      <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-sky-400 transition-all duration-500"
                          style={{ width: `${(count / maxCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Skills cloud */}
            <div className="card">
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">Recent Skills Used</p>
              <div className="flex flex-wrap gap-2">
                {[...new Set(history.flatMap(h => h.skills ?? []))].slice(0, 18).map((skill, i) => (
                  <span key={i} className="badge">{skill}</span>
                ))}
                {history.length === 0 && <p className="text-sm text-slate-400 dark:text-slate-500">No data yet.</p>}
              </div>
            </div>
          </div>

          {/* Skill Gap Analysis */}
          <SkillGapAnalysis />

          {/* Career Simulator */}
          <CareerSimulator />
        </>
      )}
    </div>
  );
}
