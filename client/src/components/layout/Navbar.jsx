import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  GraduationCap, Moon, Sun, BarChart3, Bookmark, List, Home
} from 'lucide-react';

export default function Navbar() {
  const { settings, toggleDarkMode } = useApp();
  const location = useLocation();

  const navLinks = [
    { to: '/', label: 'Dashboard', icon: Home },
    { to: '/exams', label: 'Exams', icon: List },
    { to: '/history', label: 'History', icon: BarChart3 },
    { to: '/bookmarks', label: 'Saved', icon: Bookmark },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-glass)] backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-shadow">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-primary-light to-accent bg-clip-text text-transparent hidden sm:block">
              ExitPrep
            </span>
          </Link>

          {/* Nav Links */}
          <div className="flex items-center gap-1">
            {navLinks.map(({ to, label, icon: Icon }) => {
              const isActive = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-primary/15 text-primary-light'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-glass-light)]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              );
            })}

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="ml-2 p-2 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-glass-light)] transition-all"
              aria-label="Toggle dark mode"
            >
              {settings.darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
