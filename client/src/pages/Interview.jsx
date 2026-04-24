import React, { useState, useRef, useEffect } from 'react';
import { startInterview, nextInterviewQuestion } from '../api';
import InterviewResult from '../components/InterviewResult';

const TOTAL = 10;

const TOPIC_SUGGESTIONS = [
  'JavaScript', 'Python', 'Data Science', 'Machine Learning',
  'Product Management', 'Digital Marketing', 'Finance & Accounting',
  'UPSC / Civil Services', 'UI/UX Design', 'DevOps',
  'Healthcare / Medicine', 'Entrepreneurship', 'Graphic Design',
  'Business Management', 'Cybersecurity',
];

// ── Phase: setup | interview | result ────────────────────────────────────────
export default function Interview() {
  const [phase,          setPhase]          = useState('setup');   // setup | interview | result
  const [topic,          setTopic]          = useState('');
  const [sessionId,      setSessionId]      = useState(null);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [question,       setQuestion]       = useState('');
  const [answer,         setAnswer]         = useState('');
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState('');
  const [result,         setResult]         = useState(null);

  const answerRef = useRef(null);

  // Focus textarea when a new question arrives
  useEffect(() => {
    if (phase === 'interview') answerRef.current?.focus();
  }, [question, phase]);

  // ── Start interview ──────────────────────────────────────────────────────
  const handleStart = async () => {
    if (!topic.trim()) { setError('Please enter a topic.'); return; }
    setError('');
    setLoading(true);
    try {
      const { data } = await startInterview(topic.trim());
      setSessionId(data.sessionId);
      setQuestion(data.question);
      setQuestionNumber(data.questionNumber);
      setPhase('interview');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start interview. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Submit answer ────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!answer.trim()) { setError('Please write your answer before continuing.'); return; }
    setError('');
    setLoading(true);
    try {
      const { data } = await nextInterviewQuestion(sessionId, answer.trim());
      setAnswer('');

      if (data.isCompleted) {
        setResult(data);
        setPhase('result');
      } else {
        setQuestion(data.question);
        setQuestionNumber(data.questionNumber);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSubmit();
  };

  const handleRetry = () => {
    setPhase('setup');
    setTopic('');
    setSessionId(null);
    setQuestion('');
    setAnswer('');
    setQuestionNumber(0);
    setResult(null);
    setError('');
  };

  // ── RESULT PHASE ─────────────────────────────────────────────────────────
  if (phase === 'result' && result) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="page-title">Interview Complete 🎉</h1>
          <p className="page-subtitle">Topic: <span className="font-semibold text-indigo-500">{topic}</span></p>
        </div>
        <InterviewResult result={result} onRetry={handleRetry} />
      </div>
    );
  }

  // ── INTERVIEW PHASE ───────────────────────────────────────────────────────
  if (phase === 'interview') {
    const progress = Math.round(((questionNumber - 1) / TOTAL) * 100);
    const diffLabel =
      questionNumber <= 3 ? { label: 'Basic', color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30' } :
      questionNumber <= 7 ? { label: 'Intermediate', color: 'text-amber-500 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30' } :
                            { label: 'Advanced', color: 'text-red-500 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30' };

    return (
      <div>
        <div className="mb-6">
          <h1 className="page-title">Interview Simulator</h1>
          <p className="page-subtitle">Topic: <span className="font-semibold text-indigo-500">{topic}</span></p>
        </div>

        {/* Progress bar */}
        <div className="card mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Question {questionNumber} / {TOTAL}
            </span>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${diffLabel.color}`}>
              {diffLabel.label}
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-sky-400 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-1.5">{TOTAL - questionNumber} questions remaining</p>
        </div>

        {/* Question card */}
        <div className="card mb-5 border-l-4 border-indigo-500">
          <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wider mb-2">Question {questionNumber}</p>
          <p className="text-base font-medium text-slate-700 dark:text-slate-200 leading-relaxed">
            {question}
          </p>
        </div>

        {/* Answer input */}
        <div className="card mb-4">
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
            Your Answer <span className="text-xs text-slate-400">(Ctrl+Enter to submit)</span>
          </label>
          <textarea
            ref={answerRef}
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={5}
            placeholder="Type your answer here..."
            disabled={loading}
            className="w-full px-4 py-3 rounded-xl text-sm
                       bg-slate-50 dark:bg-slate-800
                       border border-slate-200 dark:border-slate-700
                       text-slate-700 dark:text-slate-200
                       placeholder-slate-400 dark:placeholder-slate-500
                       focus:outline-none focus:ring-2 focus:ring-indigo-400/40 focus:border-indigo-400
                       resize-none transition disabled:opacity-50"
          />
        </div>

        {error && (
          <p className="text-sm text-red-500 mb-3">{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading || !answer.trim()}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-sky-400
                     text-white font-semibold text-sm shadow-md
                     hover:opacity-90 active:scale-95 transition-all
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading
            ? '⏳ Processing...'
            : questionNumber === TOTAL
              ? '🏁 Submit Final Answer'
              : `Next Question →`
          }
        </button>
      </div>
    );
  }

  // ── SETUP PHASE ───────────────────────────────────────────────────────────
  return (
    <div>
      <div className="mb-6">
        <h1 className="page-title">Interview Simulator</h1>
        <p className="page-subtitle">10 progressive questions. Any topic. Real AI evaluation.</p>
      </div>

      <div className="card max-w-xl">
        <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200 mb-1">Choose Your Topic</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Enter any domain — tech, finance, government exams, creative fields, healthcare, and more.
        </p>

        <input
          type="text"
          value={topic}
          onChange={e => { setTopic(e.target.value); setError(''); }}
          onKeyDown={e => e.key === 'Enter' && handleStart()}
          placeholder="e.g. Python, UPSC, Digital Marketing, UI/UX Design..."
          className="w-full px-4 py-3 rounded-xl text-sm mb-4
                     bg-slate-50 dark:bg-slate-800
                     border border-slate-200 dark:border-slate-700
                     text-slate-700 dark:text-slate-200
                     placeholder-slate-400 dark:placeholder-slate-500
                     focus:outline-none focus:ring-2 focus:ring-indigo-400/40 focus:border-indigo-400
                     transition"
        />

        {/* Quick topic chips */}
        <div className="flex flex-wrap gap-2 mb-5">
          {TOPIC_SUGGESTIONS.map(t => (
            <button
              key={t}
              onClick={() => setTopic(t)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition
                ${topic === t
                  ? 'bg-indigo-500 text-white border-indigo-500'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-indigo-400 hover:text-indigo-500'
                }`}
            >
              {t}
            </button>
          ))}
        </div>

        {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

        <button
          onClick={handleStart}
          disabled={loading || !topic.trim()}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-sky-400
                     text-white font-semibold text-sm shadow-md
                     hover:opacity-90 active:scale-95 transition-all
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '⏳ Starting...' : '🚀 Start Interview (10 Questions)'}
        </button>

        {/* Info strip */}
        <div className="mt-5 grid grid-cols-3 gap-3 text-center">
          {[
            { icon: '📝', label: 'Q1–3', sub: 'Basic' },
            { icon: '⚡', label: 'Q4–7', sub: 'Intermediate' },
            { icon: '🔥', label: 'Q8–10', sub: 'Advanced' },
          ].map(({ icon, label, sub }) => (
            <div key={label} className="rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3">
              <div className="text-xl mb-1">{icon}</div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{label}</p>
              <p className="text-xs text-slate-400">{sub}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
