import React, { useState } from 'react';

const DIFF_COLOR = {
  Easy:   'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30',
  Medium: 'text-amber-500 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30',
  Hard:   'text-red-500 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30',
};

function EnrichedCard({ career }) {
  const [open, setOpen] = useState(false);
  const diff = DIFF_COLOR[career.difficulty] || DIFF_COLOR.Medium;

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-start justify-between gap-3 px-5 py-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{career.title}</span>
            {career.difficulty && (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${diff}`}>
                {career.difficulty}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {career.domain && (
              <span className="text-xs text-slate-400">{career.domain}</span>
            )}
            {career.salaryRange && (
              <span className="text-xs text-indigo-500 font-medium">💰 {career.salaryRange}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {career.fitScore != null && (
            <span className="text-xs font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-500/30">
              Fit {career.fitScore}/10
            </span>
          )}
          <span className="text-slate-400 text-sm">{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {/* Expandable details */}
      {open && (
        <div className="px-5 pb-5 border-t border-slate-100 dark:border-slate-800 space-y-4 pt-4">
          {career.requiredSkills?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Required Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {career.requiredSkills.map((s, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {career.roadmap?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Roadmap</p>
              <ol className="space-y-1.5">
                {career.roadmap.map((step, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Results({ careers, enriched }) {
  if (!careers || careers.length === 0) return null;

  // If we have enriched AI data, show rich cards
  if (enriched && enriched.length > 0) {
    return (
      <div className="mt-5 space-y-3">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          🎯 AI-Powered Career Recommendations
        </p>
        {enriched.map((career, idx) => (
          <EnrichedCard key={idx} career={career} />
        ))}
      </div>
    );
  }

  // Fallback: simple badge list (backward compatible)
  return (
    <div className="card mt-4">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
        🎯 Recommended Careers
      </p>
      <div className="flex flex-wrap gap-2">
        {careers.map((career, idx) => (
          <span
            key={idx}
            className="px-3.5 py-1.5 rounded-xl text-sm font-medium
                       bg-gradient-to-r from-indigo-50 to-sky-50
                       border border-indigo-100 text-indigo-600
                       hover:shadow-sm hover:-translate-y-0.5 transition-all duration-150 cursor-default"
          >
            {career}
          </span>
        ))}
      </div>
    </div>
  );
}
