import React from 'react';

export default function Results({ careers }) {
  if (!careers || careers.length === 0) return null;

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
