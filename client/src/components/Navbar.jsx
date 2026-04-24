import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Sun, Moon, Bell, LogOut, User, Menu } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth }  from '../context/AuthContext';

const mobileLinks = [
  { to: '/',                icon: '🏠', label: 'Home' },
  { to: '/recommendations', icon: '🤖', label: 'Recs' },
  { to: '/dashboard',       icon: '📊', label: 'Dash' },
  { to: '/interview',       icon: '🎤', label: 'Interview' },
  { to: '/history',         icon: '🕓', label: 'History' },
];

export default function Navbar({ onToggleSidebar }) {
  const { dark, toggle } = useTheme();
  const { user, logout } = useAuth();
  const navigate         = useNavigate();

  const [notifOpen,   setNotifOpen]   = useState(false);
  const [avatarOpen,  setAvatarOpen]  = useState(false);
  const notifRef  = useRef(null);
  const avatarRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current  && !notifRef.current.contains(e.target))  setNotifOpen(false);
      if (avatarRef.current && !avatarRef.current.contains(e.target)) setAvatarOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const initial = user?.name?.[0]?.toUpperCase() ?? 'U';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* ── Top Bar ── */}
      <header className="sticky top-0 z-50 h-16
        bg-white/80 dark:bg-slate-900/80
        backdrop-blur-md
        border-b border-slate-200 dark:border-slate-800
        flex items-center px-4 gap-3 shadow-sm">

        {/* Sidebar toggle */}
        <button
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
          className="hidden md:flex items-center justify-center w-9 h-9 rounded-lg
                     text-slate-500 dark:text-slate-400
                     hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <Menu size={18} />
        </button>

        {/* Brand */}
        <span className="text-base font-bold gradient-text tracking-tight select-none mr-2">
          🎯 CareerAI
        </span>

        {/* Search */}
        <div className="flex-1 max-w-sm relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
          <input
            type="text"
            placeholder="Search careers, skills..."
            className="w-full pl-8 pr-3 py-2 h-9 text-sm rounded-xl
                       bg-slate-100 dark:bg-slate-800
                       border border-transparent dark:border-slate-700
                       text-slate-700 dark:text-slate-200
                       placeholder-slate-400 dark:placeholder-slate-500
                       focus:outline-none focus:ring-2 focus:ring-indigo-400/40 focus:border-indigo-400
                       transition"
          />
        </div>

        <div className="flex items-center gap-1.5 ml-auto">

          {/* Dark / Light toggle — pill switch */}
          <button
            onClick={toggle}
            aria-label="Toggle theme"
            className={`relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-400/50
              ${dark ? 'bg-indigo-500' : 'bg-slate-200'}`}
          >
            {/* Track icons */}
            <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[11px] select-none">🌙</span>
            <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[11px] select-none">☀️</span>
            {/* Thumb */}
            <span
              className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md
                          flex items-center justify-center transition-transform duration-300
                          ${dark ? 'translate-x-7' : 'translate-x-0.5'}`}
            >
              {dark
                ? <Moon size={12} className="text-indigo-500" />
                : <Sun  size={12} className="text-amber-500" />
              }
            </span>
          </button>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen(o => !o)}
              aria-label="Notifications"
              className="relative w-9 h-9 rounded-xl flex items-center justify-center
                         text-slate-500 dark:text-slate-400
                         hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <Bell size={17} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full border-2 border-white dark:border-slate-900" />
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-11 w-72 z-50 rounded-2xl overflow-hidden
                              bg-white dark:bg-slate-900
                              border border-slate-200 dark:border-slate-700
                              shadow-xl shadow-slate-200/50 dark:shadow-black/40">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Notifications</span>
                  <span className="badge">2 new</span>
                </div>
                {[
                  { icon: '🤖', msg: 'New career match: ML Engineer', time: '2m ago' },
                  { icon: '📊', msg: 'Your dashboard has new insights', time: '1h ago' },
                ].map((n, i) => (
                  <div key={i} className="flex items-start gap-3 px-4 py-3
                                          hover:bg-slate-50 dark:hover:bg-slate-800/60
                                          cursor-pointer border-b border-slate-50 dark:border-slate-800 last:border-0 transition-colors">
                    <span className="text-xl mt-0.5">{n.icon}</span>
                    <div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">{n.msg}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{n.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Avatar + dropdown */}
          <div className="relative" ref={avatarRef}>
            <button
              onClick={() => setAvatarOpen(o => !o)}
              aria-label="Account menu"
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-400
                         flex items-center justify-center text-white font-bold text-sm
                         shadow-md shadow-indigo-200 dark:shadow-indigo-900/40
                         hover:opacity-90 transition"
            >
              {initial}
            </button>

            {avatarOpen && (
              <div className="absolute right-0 top-11 w-52 z-50 rounded-2xl overflow-hidden
                              bg-white dark:bg-slate-900
                              border border-slate-200 dark:border-slate-700
                              shadow-xl shadow-slate-200/50 dark:shadow-black/40">
                {/* User info */}
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">
                    {user?.name ?? 'Guest'}
                  </p>
                  <p className="text-xs text-slate-400 truncate">{user?.email ?? ''}</p>
                </div>

                <button
                  onClick={() => { setAvatarOpen(false); navigate('/profile'); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm
                             text-slate-600 dark:text-slate-300
                             hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                >
                  <User size={15} /> Profile
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm
                             text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10
                             transition-colors border-t border-slate-100 dark:border-slate-800"
                >
                  <LogOut size={15} /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Mobile Bottom Nav ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-16
                      bg-white/90 dark:bg-slate-900/90 backdrop-blur-md
                      border-t border-slate-200 dark:border-slate-800 flex">
        {mobileLinks.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors
               ${isActive
                 ? 'text-indigo-600 dark:text-indigo-400'
                 : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`
            }
          >
            <span className="text-lg leading-none">{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}
