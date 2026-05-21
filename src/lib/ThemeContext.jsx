import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext({
  theme: 'light',
  setTheme: () => {},
  toggleTheme: () => {},
});

const STORAGE_KEY = 'theme';

function getStoredTheme() {
  if (typeof window === 'undefined') return 'light';
  const storedTheme = window.localStorage.getItem(STORAGE_KEY);
  return storedTheme === 'dark' ? 'dark' : 'light';
}

const initialTheme = getStoredTheme();
if (typeof document !== 'undefined') {
  const html = document.documentElement;
  html.classList.toggle('light', initialTheme === 'light');
  html.classList.toggle('dark', initialTheme === 'dark');
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(initialTheme);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const html = document.documentElement;
    html.classList.toggle('light', theme === 'light');
    html.classList.toggle('dark', theme === 'dark');
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => setTheme((current) => (current === 'dark' ? 'light' : 'dark'));

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
