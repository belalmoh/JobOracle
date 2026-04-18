// Application tracking list

import { useEffect, useState } from 'react';
import { storage } from '~storage';
import type { Application } from '~types';

export function ApplicationHistory() {
  const [applications, setApplications] = useState<Application[]>([]);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    const apps = await storage.getApplications();
    setApplications(apps);
  };

  const exportData = async () => {
    const apps = await storage.getApplications();
    const blob = new Blob([JSON.stringify(apps, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'joboracle-applications.json';
    a.click();
  };

  if (applications.length === 0) {
    return (
      <div 
        className="plasmo-p-8 plasmo-rounded-xl plasmo-text-center"
        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}
      >
        <div className="plasmo-text-3xl plasmo-mb-2">📋</div>
        <p className="plasmo-text-text-secondary plasmo-text-sm">
          No applications tracked yet. Start applying!
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="plasmo-flex plasmo-justify-end plasmo-mb-3">
        <button
          onClick={exportData}
          className="plasmo-px-4 plasmo-py-2 plasmo-rounded-lg plasmo-text-sm plasmo-font-medium"
          style={{ background: 'var(--accent-primary)', color: 'white' }}
        >
          Export Data
        </button>
      </div>
      
      <div className="plasmo-space-y-2">
        {applications.map((app) => (
          <div 
            key={app.id}
            className="plasmo-p-4 plasmo-rounded-xl"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}
          >
            <div className="plasmo-flex plasmo-justify-between plasmo-items-start plasmo-mb-2">
              <div>
                <div className="plasmo-font-medium plasmo-text-text-primary">{app.company}</div>
                <div className="plasmo-text-sm plasmo-text-text-secondary">{app.jobTitle}</div>
              </div>
              <span 
                className="plasmo-px-2 plasmo-py-1 plasmo-rounded plasmo-text-xs"
                style={{ 
                  background: app.matchScore >= 80 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                  color: app.matchScore >= 80 ? 'var(--success)' : 'var(--warning)'
                }}
              >
                {app.matchScore}%
              </span>
            </div>
            <div className="plasmo-flex plasmo-justify-between plasmo-items-center plasmo-text-xs plasmo-text-text-muted">
              <span>{new Date(app.dateApplied).toLocaleDateString()}</span>
              <span className="plasmo-capitalize">{app.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
