import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getSettings, updateSettings, getOverallStats, getBookmarks, toggleBookmark as toggleBm } from '../utils/storage';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [settings, setSettings] = useState(getSettings);
  const [stats, setStats] = useState(getOverallStats);
  const [bookmarks, setBookmarks] = useState(getBookmarks);

  // Apply dark/light mode to html element
  useEffect(() => {
    const root = document.documentElement;
    if (settings.darkMode) {
      root.classList.remove('light');
    } else {
      root.classList.add('light');
    }
  }, [settings.darkMode]);

  const changeSetting = useCallback((key, value) => {
    const updated = updateSettings({ [key]: value });
    setSettings(updated);
  }, []);

  const toggleDarkMode = useCallback(() => {
    changeSetting('darkMode', !settings.darkMode);
  }, [settings.darkMode, changeSetting]);

  const refreshStats = useCallback(() => {
    setStats(getOverallStats());
  }, []);

  const toggleBookmark = useCallback((questionId) => {
    const updated = toggleBm(questionId);
    setBookmarks([...updated]);
  }, []);

  const value = {
    settings,
    changeSetting,
    toggleDarkMode,
    stats,
    refreshStats,
    bookmarks,
    toggleBookmark,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
