import React, { useState } from 'react';

const defaultProfile = { name: '', email: '', bio: '', goal: '' };

export default function Profile() {
  const [profile, setProfile] = useState(() => {
    try { return JSON.parse(localStorage.getItem('career_profile')) || defaultProfile; }
    catch { return defaultProfile; }
  });
  const [saved, setSaved] = useState(false);

  const handleChange = (e) => setProfile({ ...profile, [e.target.name]: e.target.value });

  const handleSave = (e) => {
    e.preventDefault();
    localStorage.setItem('career_profile', JSON.stringify(profile));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const initial = profile.name ? profile.name[0].toUpperCase() : '?';

  return (
    <div>
      <div className="mb-6">
        <h1 className="page-title">Profile</h1>
        <p className="page-subtitle">Your personal details — saved locally in your browser.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Avatar card */}
        <div className="card flex flex-col items-center text-center py-8 gap-3">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-400 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-indigo-200">
            {initial}
          </div>
          <div>
            <p className="font-semibold text-slate-700">{profile.name || 'Your Name'}</p>
            <p className="text-xs text-slate-400 mt-0.5">{profile.email || 'your@email.com'}</p>
          </div>
          {profile.goal && (
            <span className="badge mt-1">🎯 {profile.goal}</span>
          )}
          {profile.bio && (
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs">{profile.bio}</p>
          )}
        </div>

        {/* Form card */}
        <div className="card lg:col-span-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-5">Edit Details</p>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Full Name</label>
                <input className="form-input" name="name" placeholder="[name]" value={profile.name} onChange={handleChange} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Email</label>
                <input className="form-input" name="email" type="email" placeholder="[email]" value={profile.email} onChange={handleChange} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Bio</label>
              <textarea
                className="form-input resize-none"
                name="bio"
                placeholder="Tell us a bit about yourself..."
                value={profile.bio}
                onChange={handleChange}
                rows={3}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Career Goal</label>
              <input className="form-input" name="goal" placeholder="e.g. Become a Full Stack Developer" value={profile.goal} onChange={handleChange} />
            </div>

            <div className="flex gap-3 pt-1">
              <button type="submit" className={`btn-primary flex-1 ${saved ? 'from-emerald-500 to-teal-400' : ''}`}>
                {saved ? '✓ Saved' : 'Save Profile'}
              </button>
              <button
                type="button"
                className="btn-ghost flex-1"
                onClick={() => { setProfile(defaultProfile); localStorage.removeItem('career_profile'); }}
              >
                Reset
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
