import React from 'react';
import { NavLink } from 'react-router-dom';

const links = [
  { to: '/',                icon: '🏠', label: 'Home' },
  { to: '/recommendations', icon: '🤖', label: 'Recommendations' },
  { to: '/dashboard',       icon: '📊', label: 'Dashboard' },
  { to: '/history',         icon: '🕓', label: 'History' },
  { to: '/profile',         icon: '👤', label: 'Profile' },
];

export default function Sidebar({ collapsed }) {
  return (
    <aside
      className={`
        hidden md:flex flex-col flex-shrink-0
        bg-white/80 dark:bg-slate-900/80 backdrop-blur-md
        border-r border-slate-200 dark:border-slate-800
        transition-all duration-300 ease-in-out overflow-hidden
        ${collapsed ? 'w-16' : 'w-56'}
      `}
    >
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5
                       border-b border-slate-100 dark:border-slate-800
                       ${collapsed ? 'justify-center' : ''}`}>
        <span className="text-2xl flex-shrink-0">🎯</span>
        {!collapsed && (
          <span className="font-bold text-sm gradient-text tracking-tight whitespace-nowrap">
            CareerAI
          </span>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex-1 py-4 px-2 space-y-1">
        {links.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            title={collapsed ? label : undefined}
            className={({ isActive }) => `
              flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
              transition-all duration-150
              ${isActive
                ? 'bg-gradient-to-r from-indigo-500 to-sky-400 text-white shadow-md shadow-indigo-200 dark:shadow-indigo-900/40'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200'
              }
              ${collapsed ? 'justify-center' : ''}
            `}
          >
            <span className="text-base flex-shrink-0 leading-none">{icon}</span>
            {!collapsed && <span className="whitespace-nowrap">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="px-4 py-4 border-t border-slate-100 dark:border-slate-800">
          <div className="rounded-xl bg-indigo-50 dark:bg-indigo-500/10
                          border border-indigo-100 dark:border-indigo-500/20 p-3 text-center">
            <p className="text-xs text-indigo-500 font-semibold">AI-Powered</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Career Recommender</p>
          </div>
        </div>
      )}
    </aside>
  );
}
