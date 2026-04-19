import React from 'react';
import { useNavigate } from 'react-router-dom';

const features = [
  { icon: '🤖', title: 'AI-Powered', desc: 'Smart recommendations based on your skills and interests.', color: 'from-indigo-500 to-violet-500' },
  { icon: '📊', title: 'Dashboard',  desc: 'Visual overview of your career exploration progress.',    color: 'from-sky-400 to-cyan-400' },
  { icon: '🕓', title: 'History',    desc: 'Track all your past recommendation sessions.',            color: 'from-amber-400 to-orange-400' },
  { icon: '👤', title: 'Profile',    desc: 'Save your details and career goals locally.',             color: 'from-emerald-400 to-teal-400' },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <div>
      {/* Hero */}
      <div className="card mb-6 text-center py-12 relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute -top-10 -left-10 w-48 h-48 bg-indigo-100 rounded-full blur-3xl opacity-60 pointer-events-none" />
        <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-sky-100 rounded-full blur-3xl opacity-60 pointer-events-none" />

        <div className="relative z-10">
          <span className="badge mb-4 inline-block">✨ AI-Powered Career Guidance</span>
          <h1 className="text-3xl md:text-4xl font-extrabold gradient-text mb-3 leading-tight">
            Discover Your Ideal<br />Career Path
          </h1>
          <p className="text-slate-400 text-sm max-w-md mx-auto mb-6 leading-relaxed">
            Enter your skills and interests — get personalized career recommendations tailored just for you.
          </p>
          <button className="btn-primary" onClick={() => navigate('/recommendations')}>
            Get Started →
          </button>
        </div>
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {features.map(({ icon, title, desc, color }) => (
          <div
            key={title}
            className="card hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-default"
          >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-xl mb-3 shadow-sm`}>
              {icon}
            </div>
            <p className="font-semibold text-slate-700 text-sm mb-1">{title}</p>
            <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
