// AI-powered generation options

interface AIOptionsProps {
  onGenerateResume: () => void;
  onGenerateCoverLetter: () => void;
}

export function AIOptions({ onGenerateResume, onGenerateCoverLetter }: AIOptionsProps) {
  return (
    <div className="plasmo-px-4 plasmo-mt-4">
      <div className="plasmo-text-xs plasmo-uppercase plasmo-tracking-wider plasmo-text-text-muted plasmo-mb-3">
        <span style={{ 
          background: 'var(--gradient-hero)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          ✨ AI POWERED
        </span>
      </div>
      
      <div className="plasmo-flex plasmo-flex-col plasmo-gap-2">
        <button
          onClick={onGenerateResume}
          className="plasmo-flex plasmo-items-center plasmo-gap-3 plasmo-p-4 plasmo-rounded-xl plasmo-text-left hover:plasmo-border-accent-primary plasmo-transition-all plasmo-duration-200"
          style={{ 
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)'
          }}
        >
          <div 
            className="plasmo-w-9 plasmo-h-9 plasmo-rounded-lg plasmo-flex plasmo-items-center plasmo-justify-center plasmo-text-lg"
            style={{ background: 'rgba(99, 102, 241, 0.1)' }}
          >
            ✨
          </div>
          <div className="plasmo-flex-1">
            <div className="plasmo-font-medium plasmo-text-text-primary plasmo-text-sm">
              Generate Custom Resume
            </div>
            <div className="plasmo-text-xs plasmo-text-text-secondary">
              Tailored to this job description
            </div>
          </div>
          <span className="plasmo-text-text-muted">›</span>
        </button>
        
        <button
          onClick={onGenerateCoverLetter}
          className="plasmo-flex plasmo-items-center plasmo-gap-3 plasmo-p-4 plasmo-rounded-xl plasmo-text-left hover:plasmo-border-accent-primary plasmo-transition-all plasmo-duration-200"
          style={{ 
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)'
          }}
        >
          <div 
            className="plasmo-w-9 plasmo-h-9 plasmo-rounded-lg plasmo-flex plasmo-items-center plasmo-justify-center plasmo-text-lg"
            style={{ background: 'rgba(99, 102, 241, 0.1)' }}
          >
            📝
          </div>
          <div className="plasmo-flex-1">
            <div className="plasmo-font-medium plasmo-text-text-primary plasmo-text-sm">
              Generate Cover Letter
            </div>
            <div className="plasmo-text-xs plasmo-text-text-secondary">
              Personalized for this role
            </div>
          </div>
          <span className="plasmo-text-text-muted">›</span>
        </button>
      </div>
    </div>
  );
}
