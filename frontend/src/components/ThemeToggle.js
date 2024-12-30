import React from 'react';

function ThemeToggle({ isDark, onToggle }) {
  return (
    <button 
      className={`theme-toggle ${isDark ? 'dark' : 'light'}`}
      onClick={onToggle}
      aria-label="Toggle theme"
    >
      {isDark ? '🌙' : '☀️'}
    </button>
  );
}

export default ThemeToggle; 