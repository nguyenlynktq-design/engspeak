import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// --- Types ---
export type ThemeMode = 'light' | 'dark';

export interface AppContextType {
  // API Key
  apiKey: string;
  setApiKey: (key: string) => void;
  showApiModal: boolean;
  setShowApiModal: (show: boolean) => void;
  hasApiKey: boolean;

  // Theme
  theme: ThemeMode;
  toggleTheme: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [apiKey, setApiKeyState] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [showApiModal, setShowApiModal] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>(() => {
    return (localStorage.getItem('theme') as ThemeMode) || 'light';
  });

  const setApiKey = useCallback((key: string) => {
    setApiKeyState(key);
    if (key) {
      localStorage.setItem('gemini_api_key', key);
    } else {
      localStorage.removeItem('gemini_api_key');
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', next);
      return next;
    });
  }, []);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Show API modal on first load if no key
  useEffect(() => {
    if (!apiKey) {
      setShowApiModal(true);
    }
  }, []);

  return (
    <AppContext.Provider value={{
      apiKey,
      setApiKey,
      showApiModal,
      setShowApiModal,
      hasApiKey: !!apiKey,
      theme,
      toggleTheme,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}
