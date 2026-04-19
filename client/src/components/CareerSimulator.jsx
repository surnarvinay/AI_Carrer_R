import React, { useState, useRef, useEffect } from 'react';
import { getScenario, evaluateResponse } from '../api';

// ── Career list for the selector ─────────────────────────────────────────────
const CAREERS = [
  'Full Stack Developer', 'Frontend Developer', 'Data Scientist',
  'ML Engineer', 'Backend Developer', 'DevOps Engineer',
  'UI/UX Designer', 'Cybersecurity Analyst', 'Data Analyst', 'Product Manager',
];

// ── Score pill colors ─────────────────────────────────────────────────────────
const SCORE_STYLE = {
  'Excellent':       'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'Good':            'bg-sky-500/20 text-sky-400 border-sky-500/30',
  'Needs Work':      'bg-amber-500/20 text-amber-400 border-amber-500/30',
  'Keep Practicing': 'bg-red-500/20 text-red-400 border-red-500/30',
};

// ── Typing cursor blink ───────────────────────────────────────────────────────
function Cursor() {
  return <span className="inline-block w-2 h-4 bg-green-400 ml-0.5 animate-pulse align-middle" />;
}

// ── Thinking animation ────────────────────────────────────────────────────────
function ThinkingDots() {
  return (
    <div className="flex items-center gap-1 py-1">
      <span className="text-green-500 text-xs font-mono">AI thinking</span>
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-green-400"
          style={{ animation: `bounce 1s ease-in-out ${i * 0.2}s infinite` }}
        />
      ))}
    </div>
  );
}

// ── Single message bubble ─────────────────────────────────────────────────────
function Message({ msg }) {
  const isUser   = msg.role === 'user';
  const isSystem = msg.role === 'system';
  const isAI     = msg.role === 'ai';

  if (isSystem) {
    return (
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-xs font-mono text-amber-400 font-semibold">SCENARIO</span>
          <span className="text-xs text-zinc-600 font-mono">──────────────────</span>
        </div>
        <p className="font-mono text-sm text-amber-300 leading-relaxed pl-2 border-l-2 border-amber-500/40">
          {msg.content}
        </p>
      </div>
    );
  }

  if (isUser) {
    return (
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-mono text-sky-400 font-semibold">YOU</span>
          <span className="text-xs text-zinc-600 font-mono">{msg.time}</span>
        </div>
        <p className="font-mono text-sm text-sky-300 leading-relaxed pl-2 border-l-2 border-sky-500/40">
          {msg.content}
        </p>
      </div>
    );
  }

  if (isAI) {
    return (
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <span className="text-xs font-mono text-green-400 font-semibold">INTERVIEWER</span>
          <span className="text-xs text-zinc-600 font-mono">{msg.time}</span>
          {msg.score && (
            <span className={`text-xs font-mono font-semibold px-2 py-0.5 rounded border ${SCORE_STYLE[msg.score] || SCORE_STYLE['Good']}`}>
              {msg.score}
            </span>
          )}
        </div>
        {msg.feedback && (
          <p className="font-mono text-sm text-green-300 leading-relaxed pl-2 border-l-2 border-green-500/40 mb-2">
            {msg.feedback}
          </p>
        )}
        {msg.followUp && (
          <div className="mt-2">
            <span className="text-xs font-mono text-zinc-500">↳ follow-up</span>
            <p className="font-mono text-sm text-amber-300 leading-relaxed pl-2 border-l-2 border-amber-500/40 mt-1">
              {msg.followUp}
            </p>
          </div>
        )}
        {!msg.feedback && msg.content && (
          <p className="font-mono text-sm text-green-300 leading-relaxed pl-2 border-l-2 border-green-500/40">
            {msg.content}
          </p>
        )}
      </div>
    );
  }

  return null;
}

// ── Main component ────────────────────────────────────────────────────────────
export default function CareerSimulator() {
  const [career, setCareer]           = useState(CAREERS[0]);
  const [messages, setMessages]       = useState([]);
  const [input, setInput]             = useState('');
  const [thinking, setThinking]       = useState(false);
  const [started, setStarted]         = useState(false);
  const [sessionDone, setSessionDone] = useState(false);
  const [turnCount, setTurnCount]     = useState(0);
  const [apiSource, setApiSource]     = useState(null);

  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);
  const MAX_TURNS  = 4;

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  const now = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const addMessage = (msg) => setMessages(prev => [...prev, { ...msg, time: now() }]);

  // ── Start session ───────────────────────────────────────────────────────────
  const handleStart = async () => {
    setMessages([]);
    setTurnCount(0);
    setSessionDone(false);
    setStarted(true);
    setThinking(true);

    // Boot sequence messages
    addMessage({ role: 'system', content: `Initializing simulation for: ${career}...` });

    try {
      const { data } = await getScenario(career);
      setApiSource(data.source);
      setMessages([
        { role: 'system', content: `> Session started — ${career} Interview Simulation`, time: now() },
        { role: 'system', content: data.scenario, time: now() },
      ]);
    } catch {
      setMessages([{
        role: 'system',
        content: 'Failed to load scenario. Make sure the server is running.',
        time: now(),
      }]);
    } finally {
      setThinking(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  // ── Submit user response ────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || thinking || sessionDone) return;

    const userMsg = { role: 'user', content: trimmed };
    addMessage(userMsg);
    setInput('');
    setThinking(true);

    const history = [...messages, userMsg].map(m => ({
      role: m.role,
      content: m.content || m.feedback || '',
    }));

    try {
      const { data } = await evaluateResponse(career, trimmed, history);
      const newTurn = turnCount + 1;
      setTurnCount(newTurn);

      addMessage({
        role: 'ai',
        feedback: data.feedback,
        followUp: newTurn < MAX_TURNS ? data.followUp : null,
        score: data.score,
      });

      if (newTurn >= MAX_TURNS) {
        setSessionDone(true);
        setTimeout(() => addMessage({
          role: 'system',
          content: `> Session complete. ${MAX_TURNS} rounds evaluated. Type /restart to begin a new simulation.`,
        }), 400);
      }
    } catch {
      addMessage({ role: 'ai', content: 'Connection error. Is the server running?', score: null });
    } finally {
      setThinking(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  // ── Handle slash commands ───────────────────────────────────────────────────
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() === '/restart') { setInput(''); handleStart(); return; }
      if (input.trim() === '/clear')   { setInput(''); setMessages([]); setStarted(false); return; }
      handleSubmit();
    }
  };

  return (
    <div className="mt-8">
      {/* Section header */}
      <div className="mb-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Career Simulator</p>
        <p className="text-slate-500 text-sm mt-0.5">Practice real interview scenarios with AI feedback.</p>
      </div>

      {/* Terminal window */}
      <div className="rounded-2xl overflow-hidden border border-zinc-700 shadow-2xl shadow-black/40">

        {/* ── Title bar ── */}
        <div className="bg-zinc-800 px-4 py-3 flex items-center justify-between border-b border-zinc-700">
          <div className="flex items-center gap-2">
            {/* Traffic lights */}
            <span className="w-3 h-3 rounded-full bg-red-500/80" />
            <span className="w-3 h-3 rounded-full bg-amber-400/80" />
            <span className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-zinc-400">career-simulator</span>
            <span className="text-zinc-600">—</span>
            <span className="text-xs font-mono text-zinc-500">bash</span>
          </div>
          <div className="flex items-center gap-2">
            {apiSource && (
              <span className={`text-xs font-mono px-2 py-0.5 rounded border ${
                apiSource === 'gemini'
                  ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                  : 'text-zinc-400 border-zinc-600 bg-zinc-700/50'
              }`}>
                {apiSource === 'gemini' ? '✦ Gemini' : '⚡ offline'}
              </span>
            )}
          </div>
        </div>

        {/* ── Terminal body ── */}
        <div className="bg-zinc-950 flex flex-col" style={{ height: '520px' }}>

          {/* Config bar */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800 bg-zinc-900/60 flex-shrink-0">
            <span className="text-xs font-mono text-zinc-500">career:</span>
            <select
              value={career}
              onChange={e => { setCareer(e.target.value); setStarted(false); setMessages([]); }}
              disabled={thinking}
              className="bg-zinc-800 border border-zinc-700 text-green-400 text-xs font-mono
                         rounded-lg px-2 py-1 focus:outline-none focus:border-green-500/50
                         disabled:opacity-50 cursor-pointer"
            >
              {CAREERS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <div className="ml-auto flex items-center gap-2">
              {started && !sessionDone && (
                <span className="text-xs font-mono text-zinc-500">
                  round <span className="text-green-400">{turnCount}</span>/{MAX_TURNS}
                </span>
              )}
              <button
                onClick={handleStart}
                disabled={thinking}
                className="text-xs font-mono px-3 py-1.5 rounded-lg border transition-all
                           bg-green-500/10 border-green-500/30 text-green-400
                           hover:bg-green-500/20 hover:border-green-500/50
                           disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {started ? '↺ restart' : '▶ start'}
              </button>
            </div>
          </div>

          {/* Message area */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1 font-mono"
               style={{ scrollbarWidth: 'thin', scrollbarColor: '#3f3f46 transparent' }}>

            {/* Welcome screen */}
            {!started && (
              <div className="h-full flex flex-col justify-center items-center text-center gap-3 select-none">
                <pre className="text-green-500/60 text-xs leading-tight hidden sm:block">{`
  ██████╗ █████╗ ██████╗ ███████╗███████╗██████╗ 
 ██╔════╝██╔══██╗██╔══██╗██╔════╝██╔════╝██╔══██╗
 ██║     ███████║██████╔╝█████╗  █████╗  ██████╔╝
 ██║     ██╔══██║██╔══██╗██╔══╝  ██╔══╝  ██╔══██╗
 ╚██████╗██║  ██║██║  ██║███████╗███████╗██║  ██║
  ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚══════╝╚═╝  ╚═╝`}</pre>
                <p className="text-green-400 text-sm font-mono">Career Interview Simulator v1.0</p>
                <p className="text-zinc-500 text-xs font-mono">Select a career above and press <span className="text-green-400">▶ start</span></p>
                <p className="text-zinc-600 text-xs font-mono mt-2">Commands: /restart &nbsp;/clear</p>
              </div>
            )}

            {/* Messages */}
            {messages.map((msg, i) => <Message key={i} msg={msg} />)}

            {/* Thinking indicator */}
            {thinking && <ThinkingDots />}

            <div ref={bottomRef} />
          </div>

          {/* ── Input bar ── */}
          <div className="flex-shrink-0 border-t border-zinc-800 bg-zinc-900/80 px-4 py-3">
            <form onSubmit={handleSubmit} className="flex items-center gap-3">
              <span className="text-green-500 font-mono text-sm flex-shrink-0 select-none">
                {sessionDone ? '✗' : '❯'}
              </span>
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={!started || thinking || sessionDone}
                placeholder={
                  !started         ? 'Press ▶ start to begin...' :
                  sessionDone      ? 'Session complete — type /restart to go again' :
                  thinking         ? 'AI is evaluating...' :
                                     'Type your response and press Enter...'
                }
                className="flex-1 bg-transparent text-green-300 font-mono text-sm
                           placeholder-zinc-600 focus:outline-none
                           disabled:opacity-40 disabled:cursor-not-allowed"
              />
              {input.trim() && !sessionDone && (
                <button
                  type="submit"
                  disabled={thinking}
                  className="text-xs font-mono text-zinc-500 hover:text-green-400 transition-colors
                             disabled:opacity-30 flex-shrink-0"
                >
                  [enter]
                </button>
              )}
              {started && !thinking && !sessionDone && <Cursor />}
            </form>
          </div>
        </div>
      </div>

      {/* Help text */}
      <p className="text-xs text-zinc-500 font-mono mt-2 text-center">
        shift+enter for new line &nbsp;·&nbsp; /restart to reset &nbsp;·&nbsp; /clear to wipe screen
      </p>
    </div>
  );
}
