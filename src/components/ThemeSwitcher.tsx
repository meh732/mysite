import React, { useState, useEffect } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';

export default function ThemeSwitcher() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      return saved;
    }
    return 'system';
  });

  const applyTheme = (mode: 'light' | 'dark' | 'system') => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    
    if (mode === 'light') {
      root.classList.add('light');
    } else if (mode === 'dark') {
      root.classList.add('dark');
    } else if (mode === 'system') {
      const systemIsDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (systemIsDark) {
        root.classList.add('dark');
      } else {
        root.classList.add('light');
      }
    }
  };

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem('theme', theme);

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme('system');
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  return (
    <div className="flex bg-zinc-900/80 border border-zinc-800 p-1.5 rounded-full items-center gap-1">
      <button
        onClick={() => setTheme('light')}
        title="حالت روشن"
        className={`p-2 rounded-full transition-all cursor-pointer ${
          theme === 'light'
            ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
            : 'text-zinc-500 hover:text-zinc-300'
        }`}
      >
        <Sun className="w-4 h-4" />
      </button>
      <button
        onClick={() => setTheme('dark')}
        title="حالت تاریک"
        className={`p-2 rounded-full transition-all cursor-pointer ${
          theme === 'dark'
            ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
            : 'text-zinc-500 hover:text-zinc-300'
        }`}
      >
        <Moon className="w-4 h-4" />
      </button>
      <button
        onClick={() => setTheme('system')}
        title="منطبق با سیستم"
        className={`p-2 rounded-full transition-all cursor-pointer ${
          theme === 'system'
            ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
            : 'text-zinc-500 hover:text-zinc-300'
        }`}
      >
        <Monitor className="w-4 h-4" />
      </button>
    </div>
  );
}
