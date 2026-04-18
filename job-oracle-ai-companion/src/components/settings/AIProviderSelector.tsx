// Provider grid selector

import type { AIProvider } from '~types';

interface AIProviderSelectorProps {
  value: AIProvider;
  onChange: (provider: AIProvider) => void;
}

const providers = [
  { id: 'ollama' as AIProvider, name: 'Ollama', desc: 'Local', recommended: true },
  { id: 'openai' as AIProvider, name: 'OpenAI', desc: 'API Key' },
  { id: 'claude' as AIProvider, name: 'Claude', desc: 'API Key' },
  { id: 'custom' as AIProvider, name: 'Custom', desc: 'Compatible' },
];

export function AIProviderSelector({ value, onChange }: AIProviderSelectorProps) {
  return (
    <div className="plasmo-grid plasmo-grid-cols-2 plasmo-gap-3">
      {providers.map((provider) => (
        <button
          key={provider.id}
          onClick={() => onChange(provider.id)}
          className="plasmo-p-3 plasmo-rounded-xl plasmo-text-left plasmo-transition-all plasmo-duration-200"
          style={{ 
            background: value === provider.id ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-secondary)',
            border: `1px solid ${value === provider.id ? 'var(--accent-primary)' : 'var(--border-subtle)'}`
          }}
        >
          <div className="plasmo-flex plasmo-justify-between plasmo-items-start plasmo-mb-1">
            <span className="plasmo-font-medium plasmo-text-text-primary plasmo-text-sm">
              {provider.name}
            </span>
            {provider.recommended && (
              <span 
                className="plasmo-text-[10px] plasmo-px-1.5 plasmo-py-0.5 plasmo-rounded"
                style={{ background: 'var(--success)', color: 'white' }}
              >
                FREE
              </span>
            )}
          </div>
          <div className="plasmo-text-xs plasmo-text-text-muted">
            {provider.desc}
          </div>
        </button>
      ))}
    </div>
  );
}
