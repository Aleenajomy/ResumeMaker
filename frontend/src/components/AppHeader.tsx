import React from 'react';
import { LogOut, Sparkles } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { authService } from '../services/api';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
    isActive
      ? 'bg-emerald-500 text-white'
      : 'text-slate-700 hover:bg-emerald-50 hover:text-emerald-700'
  }`;

export const AppHeader: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    authService.logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 font-['Manrope'] text-xl font-bold tracking-tight text-emerald-600"
        >
          <Sparkles size={18} />
          Resume Maker
        </button>

        <nav className="flex items-center gap-2">
          <NavLink to="/resume-optimizer" className={navLinkClass}>
            Resume Generator
          </NavLink>
          <NavLink to="/dashboard" className={navLinkClass}>
            Dashboard
          </NavLink>
        </nav>

        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </header>
  );
};
