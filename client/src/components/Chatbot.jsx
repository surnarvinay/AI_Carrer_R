import React, { useState, useRef, useEffect } from 'react';
import { sendChatMessage } from '../api';

// ── Typing dots indicator ─────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 mb-3">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-sky-400 flex items-center justify-center text-white text-xs flex-shrink-0">
        🎯
      </div>
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
        <div className="flex gap-1 items-center h-4">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-indigo-400"
              style={{ animation: `chatBounce 1s ease-in-out ${i * 0.2}s infinite` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Single message bubble ─────────────────────────────────────────────────────
function Message({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex items-end gap-2 mb-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0 font-bold
        ${isUser
          ? 'bg-gradient-to-br from-indigo-500 to-sky-400 text-white'
          : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-base'
        }`}
      >
        {isUser ? 'U' : '🎯'}
      </div>

      {/* Bubble */}
      <div className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm
        ${isUser
          ? 'bg-gradient-to-br from-indigo-500 to-sky-400 text-white rounded-br-sm'
          : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-bl-sm'
        }`}
      >
        {msg.content}
      </div>
    </div>
  );
}

// ── Main Chatbot component ────────────────────────────────────────────────────
export default function Chatbot() {
  const [open,     setOpen]     = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', content: "Hi! I'm your AI Career Assistant 👋 Ask me anything about careers, skills, resumes, or interviews." }
  ]);
  const [input,    setInput]    = useState('');
  const [typing,   setTyping]   = useState(false);

  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || typing) return;

    const userMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setTyping(true);

    // Build history for context (exclude the initial greeting)
    const history = messages
      .filter(m => m.role !== 'bot' || messages.indexOf(m) > 0)
      .map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content }));

    try {
      const { data } = await sendChatMessage(text, history);
      setMessages(prev => [...prev, { role: 'bot', content: data.reply }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'bot',
        content: "Sorry, I couldn't connect right now. Please check that the server is running and try again."
      }]);
    } finally {
      setTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* ── Keyframe style injected once ── */}
      <style>{`
        @keyframes chatBounce {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50%       { transform: translateY(-4px); opacity: 1; }
        }
        @keyframes chatPop {
          0%   { transform: scale(0.85) translateY(12px); opacity: 0; }
          100% { transform: scale(1) translateY(0);       opacity: 1; }
        }
        .chat-pop { animation: chatPop 0.2s ease-out forwards; }
      `}</style>

      {/* ── Floating button ── */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Open AI Career Assistant"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full
                   bg-gradient-to-br from-indigo-500 to-sky-400
                   text-white text-2xl shadow-lg shadow-indigo-300/50 dark:shadow-indigo-900/50
                   hover:scale-110 active:scale-95 transition-transform duration-150
                   flex items-center justify-center"
      >
        {open ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
      </button>

      {/* ── Chat window ── */}
      {open && (
        <div
          className="chat-pop fixed bottom-24 right-6 z-50 w-[340px] sm:w-[380px]
                     bg-white dark:bg-slate-900
                     border border-slate-200 dark:border-slate-700
                     rounded-2xl shadow-2xl shadow-slate-300/40 dark:shadow-black/50
                     flex flex-col overflow-hidden"
          style={{ height: '480px' }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3.5 bg-gradient-to-r from-indigo-500 to-sky-400 flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-lg">
              🎯
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold text-sm leading-none">AI Career Assistant</p>
              <p className="text-white/70 text-xs mt-0.5">Powered by Gemini</p>
            </div>
            {/* Online dot */}
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-300" />
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto px-4 py-4"
               style={{ scrollbarWidth: 'thin', scrollbarColor: '#e2e8f0 transparent' }}>
            {messages.map((msg, i) => <Message key={i} msg={msg} />)}
            {typing && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>

          {/* Quick suggestions (only when no user messages yet) */}
          {messages.length === 1 && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5 flex-shrink-0">
              {['Best skills to learn?', 'Resume tips', 'Interview prep'].map(s => (
                <button
                  key={s}
                  onClick={() => { setInput(s); setTimeout(() => inputRef.current?.focus(), 50); }}
                  className="text-xs px-3 py-1.5 rounded-full border border-indigo-200 dark:border-indigo-500/30
                             text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10
                             hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input bar */}
          <div className="flex items-center gap-2 px-3 py-3 border-t border-slate-100 dark:border-slate-800 flex-shrink-0">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={typing}
              placeholder="Ask about careers, skills..."
              className="flex-1 px-3.5 py-2 rounded-xl text-sm
                         bg-slate-50 dark:bg-slate-800
                         border border-slate-200 dark:border-slate-700
                         text-slate-800 dark:text-slate-100
                         placeholder-slate-400 dark:placeholder-slate-500
                         focus:outline-none focus:ring-2 focus:ring-indigo-400/40 focus:border-indigo-400
                         disabled:opacity-50 transition"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || typing}
              aria-label="Send message"
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0
                         bg-gradient-to-br from-indigo-500 to-sky-400 text-white
                         hover:opacity-90 active:scale-95 transition-all
                         disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
