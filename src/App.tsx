import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Admin from './pages/Admin';
import UserDashboard from './pages/UserDashboard';

export default function App() {
  useEffect(() => {
    // Bootstrap user's theme choice instantly on mount
    const saved = localStorage.getItem('theme');
    const root = document.documentElement;
    root.classList.remove('light');
    
    if (saved === 'light') {
      root.classList.add('light');
    } else if (saved === 'system' || !saved) {
      const systemIsDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (!systemIsDark) {
        root.classList.add('light');
      }
    }
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin/*" element={<Admin />} />
        <Route path="/dashboard" element={<UserDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
