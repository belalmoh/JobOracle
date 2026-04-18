// Backend connection indicator

import type { ConnectionStatus } from '~types';

interface ConnectionStatusProps {
  status: ConnectionStatus;
}

export function ConnectionStatusComponent({ status }: ConnectionStatusProps) {
  if (status === 'checking') return null;
  
  const isConnected = status === 'connected';
  
  return (
    <div 
      className="plasmo-mx-4 plasmo-mt-4 plasmo-p-3 plasmo-rounded-lg plasmo-flex plasmo-items-center plasmo-gap-3"
      style={{ 
        background: isConnected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
        border: `1px solid ${isConnected ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
      }}
    >
      <div 
        className="plasmo-w-2 plasmo-h-2 plasmo-rounded-full"
        style={{ 
          background: isConnected ? 'var(--success)' : 'var(--error)',
          boxShadow: isConnected ? '0 0 10px var(--success)' : 'none'
        }}
      />
      <span className="plasmo-text-sm plasmo-text-text-primary">
        {isConnected ? 'Connected to backend' : 'Backend disconnected'}
      </span>
    </div>
  );
}
