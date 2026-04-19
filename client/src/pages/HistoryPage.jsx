import React, { useEffect, useState, useCallback } from 'react';
import { getHistory, deleteHistoryEntry, clearHistory } from '../api';

// ── Helpers ───────────────────────────────────────────────────────────────────
const EXP_STYLE = {
  beginner:     'bg-emerald-50 text-emerald-600 border-emerald-200',
  intermediate: 'bg-amber-50   text-amber-600   border-amber-200',
  senior:       'bg-indigo-50  text-indigo-600  border-indigo-200',
};

function MatchBar({ pct }) {
  const color =
    pct >= 70 ? 'from-emerald-400 to-teal-400' :
    pct >= 40 ? 'from-amber-400  to-orange-400' :
                'from-red-400    to-rose-400';
  return (
    <div className="flex items-center gap-2 min-w-[100px]">
      <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-500`}
          style={{ width: `${pct ?? 0}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 w-8 text-right tabular-nums">
        {pct != null ? `${pct}%` : '—'}
      </span>
    </div>
  );
}

function ConfirmModal({ onConfirm, onCancel, count }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6 w-full max-w-sm mx-4">
        <div className="text-center mb-4">
          <span className="text-4xl">🗑️</span>
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mt-2">Clear all history?</h3>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
            This will permanently delete {count} record{count !== 1 ? 's' : ''}. This cannot be undone.
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-ghost flex-1 py-2">Cancel</button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors"
          >
            Delete All
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function HistoryPage() {
  const [records, setRecords]       = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading]       = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [search, setSearch]         = useState('');
  const [sortDir, setSortDir]       = useState('desc'); // 'asc' | 'desc'
  const [view, setView]             = useState('table'); // 'table' | 'cards'

  const fetchHistory = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const { data } = await getHistory({ page, limit: 20 });
      setRecords(data.records);
      setPagination(data.pagination);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchHistory(1); }, [fetchHistory]);

  // ── Delete single entry ───────────────────────────────────────────────────
  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await deleteHistoryEntry(id);
      setRecords(prev => prev.filter(r => r._id !== id));
      setPagination(prev => ({ ...prev, total: prev.total - 1 }));
    } catch {
      alert('Failed to delete. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  // ── Clear all ─────────────────────────────────────────────────────────────
  const handleClearAll = async () => {
    setShowConfirm(false);
    setLoading(true);
    try {
      await clearHistory();
      setRecords([]);
      setPagination({ total: 0, page: 1, pages: 1 });
    } catch {
      alert('Failed to clear history.');
    } finally {
      setLoading(false);
    }
  };

  // ── Client-side filter + sort ─────────────────────────────────────────────
  const filtered = records
    .filter(r => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        r.careerRecommended.some(c => c.toLowerCase().includes(q)) ||
        r.skills.some(s => s.toLowerCase().includes(q)) ||
        r.interests?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const da = new Date(a.date), db = new Date(b.date);
      return sortDir === 'desc' ? db - da : da - db;
    });

  // ── Empty state ───────────────────────────────────────────────────────────
  const isEmpty = !loading && records.length === 0;

  return (
    <div>
      {/* Page header */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="page-title">History</h1>
          <p className="page-subtitle">
            {pagination.total > 0
              ? `${pagination.total} recommendation session${pagination.total !== 1 ? 's' : ''} on record`
              : 'Your past recommendation sessions'}
          </p>
        </div>
        {records.length > 0 && (
          <button
            onClick={() => setShowConfirm(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-red-200
                       text-red-500 text-sm font-medium hover:bg-red-50 transition-colors"
          >
            🗑️ Clear All
          </button>
        )}
      </div>

      {/* Toolbar */}
      {records.length > 0 && (
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
            <input
              type="text"
              placeholder="Filter by career, skill, interest..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="form-input pl-8 h-9 text-sm"
            />
          </div>

          {/* Sort toggle */}
          <button
            onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
            className="btn-ghost h-9 px-3 text-xs gap-1.5"
          >
            {sortDir === 'desc' ? '↓ Newest' : '↑ Oldest'}
          </button>

          {/* View toggle */}
          <div className="flex rounded-xl border border-slate-200 overflow-hidden">
            {['table', 'cards'].map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 h-9 text-xs font-medium transition-colors
                  ${view === v ? 'bg-indigo-500 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
              >
                {v === 'table' ? '⊞ Table' : '▦ Cards'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-2 text-slate-400 text-sm py-8">
          <span className="animate-spin">⏳</span> Loading...
        </div>
      )}

      {/* Empty state */}
      {isEmpty && (
        <div className="card text-center py-16">
          <p className="text-5xl mb-4">🕓</p>
          <p className="text-slate-600 font-semibold text-base">No history yet</p>
          <p className="text-slate-400 text-sm mt-1">
            Head to <a href="/recommendations" className="text-indigo-500 hover:underline">Recommendations</a> to get started.
          </p>
        </div>
      )}

      {/* No filter results */}
      {!loading && records.length > 0 && filtered.length === 0 && (
        <div className="card text-center py-10">
          <p className="text-slate-500 text-sm">No records match "<span className="font-medium">{search}</span>"</p>
          <button onClick={() => setSearch('')} className="text-indigo-500 text-xs mt-2 hover:underline">Clear filter</button>
        </div>
      )}

      {/* ── TABLE VIEW ── */}
      {!loading && filtered.length > 0 && view === 'table' && (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider whitespace-nowrap">#</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider whitespace-nowrap">Date</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider whitespace-nowrap">Careers Recommended</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider whitespace-nowrap">Skills</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider whitespace-nowrap">Experience</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider whitespace-nowrap">Match %</th>
                  <th className="px-5 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((record, idx) => (
                  <tr
                    key={record._id}
                    className={`group transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-800/40
                      ${deletingId === record._id ? 'opacity-40 pointer-events-none' : ''}`}
                  >
                    {/* Row number */}
                    <td className="px-5 py-4 text-slate-300 dark:text-slate-600 text-xs tabular-nums font-mono">
                      {String(idx + 1).padStart(2, '0')}
                    </td>

                    {/* Date */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <p className="text-slate-700 dark:text-slate-300 font-medium text-xs">
                        {new Date(record.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                      <p className="text-slate-400 text-xs mt-0.5">
                        {new Date(record.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </td>

                    {/* Careers */}
                    <td className="px-5 py-4 max-w-[220px]">
                      <div className="flex flex-wrap gap-1">
                        {record.careerRecommended.slice(0, 3).map((c, i) => (
                          <span key={i} className="badge text-xs py-0.5">{c}</span>
                        ))}
                        {record.careerRecommended.length > 3 && (
                          <span className="text-xs text-slate-400 self-center">
                            +{record.careerRecommended.length - 3}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Skills */}
                    <td className="px-5 py-4 max-w-[180px]">
                      <p className="text-slate-500 dark:text-slate-400 text-xs truncate" title={record.skills.join(', ')}>
                        {record.skills.join(', ') || '—'}
                      </p>
                    </td>

                    {/* Experience */}
                    <td className="px-5 py-4">
                      {record.experience ? (
                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border capitalize
                          ${EXP_STYLE[record.experience] || 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                          {record.experience}
                        </span>
                      ) : <span className="text-slate-300 text-xs">—</span>}
                    </td>

                    {/* Match % */}
                    <td className="px-5 py-4">
                      <MatchBar pct={record.matchPercentage} />
                    </td>

                    {/* Delete */}
                    <td className="px-5 py-4">
                      <button
                        onClick={() => handleDelete(record._id)}
                        disabled={deletingId === record._id}
                        aria-label="Delete record"
                        className="opacity-0 group-hover:opacity-100 transition-opacity
                                   w-8 h-8 rounded-lg flex items-center justify-center
                                   text-slate-400 hover:text-red-500 hover:bg-red-50
                                   disabled:opacity-30"
                      >
                        {deletingId === record._id ? (
                          <span className="animate-spin text-xs">⏳</span>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table footer */}
          <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between flex-wrap gap-2">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Showing <span className="font-medium text-slate-600 dark:text-slate-300">{filtered.length}</span> of{' '}
              <span className="font-medium text-slate-600 dark:text-slate-300">{pagination.total}</span> records
            </p>
            {pagination.pages > 1 && (
              <div className="flex items-center gap-1">
                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => fetchHistory(p)}
                    className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors
                      ${pagination.page === p
                        ? 'bg-indigo-500 text-white'
                        : 'text-slate-500 hover:bg-slate-100'}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── CARDS VIEW ── */}
      {!loading && filtered.length > 0 && view === 'cards' && (
        <div className="space-y-3">
          {filtered.map((record) => (
            <div
              key={record._id}
              className={`card hover:shadow-md transition-all duration-200 group
                ${deletingId === record._id ? 'opacity-40 pointer-events-none' : ''}`}
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs text-slate-400">
                    {new Date(record.date).toLocaleString(undefined, {
                      month: 'short', day: 'numeric', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                  {record.experience && (
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border capitalize
                      ${EXP_STYLE[record.experience] || 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                      {record.experience}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <MatchBar pct={record.matchPercentage} />
                  <button
                    onClick={() => handleDelete(record._id)}
                    disabled={deletingId === record._id}
                    aria-label="Delete record"
                    className="w-8 h-8 rounded-lg flex items-center justify-center
                               text-slate-300 hover:text-red-500 hover:bg-red-50
                               transition-colors disabled:opacity-30"
                  >
                    {deletingId === record._id ? (
                      <span className="animate-spin text-xs">⏳</span>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 text-sm">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-1">Skills</p>
                  <p className="text-slate-600 text-xs">{record.skills.join(', ') || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-1">Interests</p>
                  <p className="text-slate-600 text-xs">{record.interests || '—'}</p>
                </div>
              </div>

              <div className="pt-3 mt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                {record.careerRecommended.map((c, i) => (
                  <span key={i} className="badge">{c}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirm modal */}
      {showConfirm && (
        <ConfirmModal
          count={pagination.total}
          onConfirm={handleClearAll}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  );
}
