import React, { useState } from 'react';
import { getRecommendations } from '../api';

export default function CareerForm({ onResults }) {
  const [form, setForm] = useState({ skills: '', interests: '', experience: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.skills || !form.interests || !form.experience) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await getRecommendations(form);
      onResults(data.careers, data.enriched);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Is the server running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-5">Your Details</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">
            Skills <span className="text-slate-400 font-normal">(comma-separated)</span>
          </label>
          <input
            className="form-input"
            name="skills"
            placeholder="e.g. JavaScript, React, Node.js"
            value={form.skills}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">Interests</label>
          <input
            className="form-input"
            name="interests"
            placeholder="e.g. data analytics, management, design"
            value={form.interests}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">Experience Level</label>
          <select className="form-input" name="experience" value={form.experience} onChange={handleChange}>
            <option value="">Select experience</option>
            <option value="beginner">Beginner (0–1 years)</option>
            <option value="intermediate">Intermediate (2–4 years)</option>
            <option value="senior">Senior (5+ years)</option>
          </select>
        </div>

        {error && (
          <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            ⚠️ {error}
          </p>
        )}

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? (
            <><span className="animate-spin inline-block">⏳</span> Analyzing...</>
          ) : (
            '✨ Get Career Recommendations'
          )}
        </button>
      </form>
    </div>
  );
}
