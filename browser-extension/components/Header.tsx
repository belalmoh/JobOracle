import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Gear, Circle } from '@phosphor-icons/react';
import type { ConnectionStatus } from '@/types';
import { cn } from '@/lib/utils';

interface HeaderProps {
  connectionStatus: ConnectionStatus;
  onSettingsClick?: () => void;
}

export function Header({ connectionStatus, onSettingsClick }: HeaderProps) {
  const statusColor = {
    connected: 'text-green-500',
    disconnected: 'text-red-500',
    checking: 'text-yellow-500',
  }[connectionStatus];

  const statusLabel = {
    connected: 'Connected',
    disconnected: 'Offline',
    checking: 'Checking',
  }[connectionStatus];

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
      <div className="flex items-center gap-2.5">
        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary text-primary-foreground">
          <span className="text-xs font-bold">JO</span>
        </div>
        <span className="font-semibold text-sm">JobOracle</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5" title={statusLabel}>
          <Circle size={8} weight="fill" className={cn(statusColor)} />
          <span className="text-[10px] text-muted-foreground">{statusLabel}</span>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onSettingsClick}>
          <Gear size={16} weight="duotone" />
        </Button>
      </div>
    </div>
  );
}