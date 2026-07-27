'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'cheongeumrok-theme';

function getInitialTheme() {
  if (typeof window === 'undefined') return 'day';
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === 'day' || saved === 'night') return saved;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'night' : 'day';
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme === 'night' ? 'dark' : 'light';
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState('day');
  const isNight = theme === 'night';

  useEffect(() => {
    const initialTheme = getInitialTheme();
    setTheme(initialTheme);
    applyTheme(initialTheme);
  }, []);

  function toggleTheme() {
    const nextTheme = isNight ? 'day' : 'night';
    setTheme(nextTheme);
    window.localStorage.setItem(STORAGE_KEY, nextTheme);
    applyTheme(nextTheme);
  }

  return (
    <button
      type="button"
      className="themeToggle"
      onClick={toggleTheme}
      aria-label={isNight ? '데이모드로 변경' : '나이트모드로 변경'}
    >
      <span aria-hidden="true">{isNight ? '☀' : '☾'}</span>
      {isNight ? '데이' : '나이트'}
    </button>
  );
}
