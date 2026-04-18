// Header with logo, theme toggle, settings button

import { useTheme } from '~hooks/useTheme';

export function Header() {
  const { resolvedTheme, toggleTheme } = useTheme();

  const openSettings = () => {
    chrome.runtime.openOptionsPage();
  };

  return (
    <header 
      className="plasmo-flex plasmo-items-center plasmo-justify-between plasmo-px-6 plasmo-py-4 plasmo-border-b plasmo-border-border-subtle"
      style={{ 
        background: 'var(--gradient-aurora, radial-gradient(ellipse at top, rgba(99, 102, 241, 0.15) 0%, transparent 50%))'
      }}
    >
      <div className="plasmo-flex plasmo-items-center plasmo-gap-3">
        <div 
          className="plasmo-w-9 plasmo-h-9 plasmo-rounded-lg plasmo-flex plasmo-items-center plasmo-justify-center plasmo-text-xl"
          style={{ 
            background: 'var(--gradient-hero)', 
            boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)' 
          }}
        >
          🎯
        </div>
        <span 
          className="plasmo-font-display plasmo-font-bold plasmo-text-lg plasmo-text-text-primary"
          style={{ letterSpacing: '-0.5px' }}
        >
          JobOracle
        </span>
      </div>
      
      <div className="plasmo-flex plasmo-items-center plasmo-gap-2">
        <button
          onClick={toggleTheme}
          className="plasmo-w-8 plasmo-h-8 plasmo-rounded-lg plasmo-flex plasmo-items-center plasmo-justify-center plasmo-transition-all plasmo-duration-200 hover:plasmo-text-text-primary"
          style={{ 
            background: 'var(--bg-secondary)', 
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-secondary)'
          }}
          title="Toggle theme"
        >
          {resolvedTheme === 'dark' ? '☀️' : '🌙'}
        </button>
        <button
          onClick={openSettings}
          className="plasmo-w-8 plasmo-h-8 plasmo-rounded-lg plasmo-flex plasmo-items-center plasmo-justify-center plasmo-text-text-secondary hover:plasmo-text-text-primary plasmo-transition-all plasmo-duration-200"
          style={{ 
            background: 'var(--bg-secondary)', 
            border: '1px solid var(--border-subtle)'
          }}
          title="Settings"
        >
          ⚙️
        </button>
      </div>
    </header>
  );
}
