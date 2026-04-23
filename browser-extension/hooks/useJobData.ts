import { useState, useEffect, useCallback } from 'react';
import type { JobData, ConnectionStatus } from '@/types';
import { getCurrentJob, getSettings } from '@/lib/api';

export function useJobData() {
  const [job, setJob] = useState<JobData | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('checking');

  useEffect(() => {
    async function load() {
      try {
        const settings = await getSettings();
        try {
          await fetch(`${settings.backendUrl}/resume`, { method: 'GET' });
          setConnectionStatus('connected');
        } catch {
          setConnectionStatus('disconnected');
        }
        const currentJob = await getCurrentJob();
        setJob(currentJob);
      } catch (err) {
        console.error('Failed to load job data:', err);
        setConnectionStatus('disconnected');
      } finally {
        setLoading(false);
      }
    }
    load();

    const listener = (changes: Record<string, { newValue?: unknown; oldValue?: unknown }>) => {
      if (changes.currentJob) {
        setJob((changes.currentJob.newValue as JobData | null) ?? null);
      }
    };
    browser.storage.onChanged.addListener(listener);
    return () => browser.storage.onChanged.removeListener(listener);
  }, []);

  const refreshJob = useCallback(async () => {
    setLoading(true);
    try {
      const currentJob = await getCurrentJob();
      setJob(currentJob);
    } finally {
      setLoading(false);
    }
  }, []);

  return { job, loading, connectionStatus, refreshJob };
}