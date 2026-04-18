// Reusable toggle component

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function ToggleSwitch({ checked, onChange }: ToggleSwitchProps) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="plasmo-w-11 plasmo-h-6 plasmo-rounded-full plasmo-relative plasmo-transition-all plasmo-duration-200"
      style={{ 
        background: checked ? 'var(--accent-primary)' : 'var(--bg-tertiary)'
      }}
    >
      <span 
        className="plasmo-absolute plasmo-top-0.5 plasmo-w-5 plasmo-h-5 plasmo-bg-white plasmo-rounded-full plasmo-transition-all plasmo-duration-200"
        style={{ 
          left: checked ? 'calc(100% - 22px)' : '2px'
        }}
      />
    </button>
  );
}
