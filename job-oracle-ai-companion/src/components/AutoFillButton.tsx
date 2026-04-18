// Primary CTA button with shimmer effect

interface AutoFillButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export function AutoFillButton({ onClick, disabled }: AutoFillButtonProps) {
  return (
    <div className="plasmo-px-4 plasmo-mt-4">
      <button
        onClick={onClick}
        disabled={disabled}
        className="plasmo-w-full plasmo-py-4 plasmo-rounded-xl plasmo-font-display plasmo-font-semibold plasmo-text-white plasmo-text-base plasmo-flex plasmo-items-center plasmo-justify-center plasmo-gap-2 plasmo-relative plasmo-overflow-hidden disabled:plasmo-opacity-50 disabled:plasmo-cursor-not-allowed hover:plasmo-transform hover:plasmo-translate-y-[-2px] plasmo-transition-all plasmo-duration-300"
        style={{ 
          background: 'var(--gradient-hero)',
          boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)'
        }}
      >
        <div 
          className="plasmo-absolute plasmo-inset-0"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
            animation: 'shimmer 3s infinite'
          }}
        />
        <span className="plasmo-relative">⚡</span>
        <span className="plasmo-relative">Autofill Application</span>
      </button>
      
      <div className="plasmo-text-center plasmo-mt-3 plasmo-text-xs plasmo-text-text-muted">
        <span style={{ color: 'var(--accent-primary)' }}>●</span> Free — powered by Ollama
      </div>
    </div>
  );
}
