import React from 'react';

const LEVEL_CONFIG = {
  Excellent: { color: 'text-emerald-500', bar: 'bg-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/30', emoji: '🏆' },
  Good:      { color: 'text-sky-500',     bar: 'bg-sky-500',     bg: 'bg-sky-50 dark:bg-sky-500/10',         border: 'border-sky-200 dark:border-sky-500/30',     emoji: '👍' },
  Average:   { color: 'text-amber-500',   bar: 'bg-amber-500',   bg: 'bg-amber-50 dark:bg-amber-500/10',     border: 'border-amber-200 dark:border-amber-500/30', emoji: '📈' },
  Poor:      { color: 'text-red-500',     bar: 'bg-red-500',     bg: 'bg-red-50 dark:bg-red-500/10',         border: 'border-red-200 dark:border-red-500/30',     emoji: '💪' },
};

function ProgressBar({ value, max = 10, colorClass = 'bg-indigo-500' }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
      <div
        className={`h-2.5 rounded-full transition-all duration-700 ${colorClass}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function InterviewResult({ result, onRetry }) {
  const {
    score = 0, maxScore = 10, performanceLevel = 'Average',
    summary = '', strengths = [], weaknesses = [],
    improvements = [], careerSuggestions = [],
  } = result;

  const cfg = LEVEL_CONFIG[performanceLevel] || LEVEL_CONFIG.Average;
  const pct = Math.round((score / maxScore) * 100);

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Score Card ── */}
      <div className={`rounded-2xl border p-6 ${cfg.bg} ${cfg.border}`}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Interview Score</p>
            <div className="flex items-end gap-2">
              <span className={`text-5xl font-extrabold ${cfg.color}`}>{score}</span>
              <span className="text-2xl text-slate-400 font-light mb-1">/ {maxScore}</span>
            </div>
          </div>
          <div className={`text-5xl`}>{cfg.emoji}</div>
        </div>

        <div className="mt-4 space-y-1.5">
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Performance</span>
            <span>{pct}%</span>
          </div>
          <ProgressBar value={score} max={maxScore} colorClass={cfg.bar} />
        </div>

        <div className="mt-3">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold border ${cfg.bg} ${cfg.border} ${cfg.color}`}>
            {cfg.emoji} {performanceLevel}
          </span>
        </div>
      </div>

      {/* ── Summary ── */}
      {summary && (
        <div className="card">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">📋 Summary</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{summary}</p>
        </div>
      )}

      {/* ── Strengths & Weaknesses ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {strengths.length > 0 && (
          <div className="card">
            <h3 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mb-3">✅ Strengths</h3>
            <ul className="space-y-2">
              {strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <span className="text-emerald-500 mt-0.5 flex-shrink-0">✔</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {weaknesses.length > 0 && (
          <div className="card">
            <h3 className="text-sm font-semibold text-red-500 dark:text-red-400 mb-3">❌ Weaknesses</h3>
            <ul className="space-y-2">
              {weaknesses.map((w, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <span className="text-red-500 mt-0.5 flex-shrink-0">✖</span>
                  {w}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* ── Improvements ── */}
      {improvements.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-semibold text-amber-600 dark:text-amber-400 mb-3">🚀 How to Improve</h3>
          <ul className="space-y-2">
            {improvements.map((imp, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                <span className="text-amber-500 mt-0.5 flex-shrink-0">→</span>
                {imp}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Career Suggestions ── */}
      {careerSuggestions.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 mb-4">🎯 Career Fit Suggestions</h3>
          <div className="space-y-3">
            {careerSuggestions.map((c, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-slate-700 dark:text-slate-200">{c.role}</span>
                  <span className="text-slate-500 dark:text-slate-400">{c.fitScore}/10</span>
                </div>
                <ProgressBar value={c.fitScore} max={10} colorClass="bg-indigo-500" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Retry button ── */}
      <button
        onClick={onRetry}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-sky-400
                   text-white font-semibold text-sm shadow-md
                   hover:opacity-90 active:scale-95 transition-all"
      >
        🔄 Start New Interview
      </button>
    </div>
  );
}
