import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Home            from './pages/Home';
import Recommendations from './pages/Recommendations';
import Dashboard       from './pages/Dashboard';
import HistoryPage     from './pages/HistoryPage';
import Profile         from './pages/Profile';
import Login           from './pages/Login';
import Register        from './pages/Register';

// Pages that live inside the shell layout
const PROTECTED = [
  { path: '/',                element: <Home /> },
  { path: '/recommendations', element: <Recommendations /> },
  { path: '/dashboard',       element: <Dashboard /> },
  { path: '/history',         element: <HistoryPage /> },
  { path: '/profile',         element: <Profile /> },
];

function AppShell() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-100 dark:bg-slate-950 transition-colors duration-300">
      <Navbar onToggleSidebar={() => setCollapsed(c => !c)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar collapsed={collapsed} />
        <main className="flex-1 overflow-y-auto p-6 md:p-8 pb-20 md:pb-8 transition-colors duration-300">
          <div className="max-w-4xl mx-auto">
            <Routes>
              {PROTECTED.map(({ path, element }) => (
                <Route
                  key={path}
                  path={path}
                  element={<ProtectedRoute>{element}</ProtectedRoute>}
                />
              ))}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public auth routes */}
            <Route path="/login"    element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Shell layout wraps all protected pages */}
            <Route path="/*" element={<AppShell />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
