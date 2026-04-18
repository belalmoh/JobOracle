// Settings page entry point

import { useEffect, useState } from 'react';
import { storage } from '~storage';
import { AIProviderSelector } from '~components/settings/AIProviderSelector';
import { ToggleSwitch } from '~components/settings/ToggleSwitch';
import { ApplicationHistory } from '~components/settings/ApplicationHistory';
import type { ExtensionSettings } from '~types';

import "~style.css";
import "~options-style.css";

function OptionsPage() {
  const [settings, setSettings] = useState<ExtensionSettings | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const savedSettings = await storage.getSettings();
    setSettings(savedSettings);
  };

  const updateSettings = async (updates: Partial<ExtensionSettings>) => {
    if (!settings) return;
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    await storage.saveSettings(newSettings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!settings) {
    return (
      <div className="plasmo-min-h-screen plasmo-flex plasmo-items-center plasmo-justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="plasmo-animate-spin plasmo-w-8 plasmo-h-8 plasmo-border-2 plasmo-border-accent-primary plasmo-border-t-transparent plasmo-rounded-full" />
      </div>
    );
  }

  return (
    <div className="options-page-container" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: 'Outfit, sans-serif' }}>
      <div className="plasmo-max-w-2xl plasmo-mx-auto plasmo-p-8">
        <h1 className="plasmo-font-display plasmo-text-3xl plasmo-font-bold plasmo-mb-8">Settings</h1>
        
        {saved && (
          <div 
            className="plasmo-mb-6 plasmo-p-4 plasmo-rounded-lg plasmo-text-center"
            style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)' }}
          >
            <span style={{ color: 'var(--success)' }}>✓</span> Settings saved
          </div>
        )}

        {/* AI Integration */}
        <section className="plasmo-mb-8">
          <h2 className="plasmo-text-xs plasmo-uppercase plasmo-tracking-wider plasmo-text-text-muted plasmo-mb-4">
            AI Integration
          </h2>
          
          <AIProviderSelector 
            value={settings.aiProvider}
            onChange={(provider) => updateSettings({ aiProvider: provider })}
          />
          
          <div className="plasmo-mt-4 plasmo-p-4 plasmo-rounded-xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
            <label className="plasmo-block plasmo-text-sm plasmo-font-medium plasmo-text-text-primary plasmo-mb-2">
              Backend URL
            </label>
            <input
              type="text"
              value={settings.backendUrl}
              onChange={(e) => updateSettings({ backendUrl: e.target.value })}
              className="plasmo-w-full plasmo-px-3 plasmo-py-2 plasmo-rounded-lg plasmo-text-sm"
              style={{ 
                background: 'var(--bg-tertiary)', 
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          {settings.aiProvider === 'ollama' && (
            <>
              <div className="plasmo-mt-4 plasmo-p-4 plasmo-rounded-xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                <label className="plasmo-block plasmo-text-sm plasmo-font-medium plasmo-text-text-primary plasmo-mb-2">
                  Ollama URL
                </label>
                <input
                  type="text"
                  value={settings.ollamaUrl}
                  onChange={(e) => updateSettings({ ollamaUrl: e.target.value })}
                  className="plasmo-w-full plasmo-px-3 plasmo-py-2 plasmo-rounded-lg plasmo-text-sm"
                  style={{ 
                    background: 'var(--bg-tertiary)', 
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
              
              <div className="plasmo-mt-4 plasmo-p-4 plasmo-rounded-xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                <label className="plasmo-block plasmo-text-sm plasmo-font-medium plasmo-text-text-primary plasmo-mb-2">
                  Model
                </label>
                <input
                  type="text"
                  value={settings.ollamaModel}
                  onChange={(e) => updateSettings({ ollamaModel: e.target.value })}
                  className="plasmo-w-full plasmo-px-3 plasmo-py-2 plasmo-rounded-lg plasmo-text-sm"
                  style={{ 
                    background: 'var(--bg-tertiary)', 
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
            </>
          )}
        </section>

        {/* Autofill Behavior */}
        <section className="plasmo-mb-8">
          <h2 className="plasmo-text-xs plasmo-uppercase plasmo-tracking-wider plasmo-text-text-muted plasmo-mb-4">
            Autofill Behavior
          </h2>
          
          <div className="plasmo-space-y-3">
            <div className="plasmo-p-4 plasmo-rounded-xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
              <div className="plasmo-flex plasmo-justify-between plasmo-items-center plasmo-mb-2">
                <span className="plasmo-font-medium plasmo-text-text-primary">Auto-detect forms</span>
                <ToggleSwitch 
                  checked={settings.autoDetectForms}
                  onChange={(v) => updateSettings({ autoDetectForms: v })}
                />
              </div>
              <p className="plasmo-text-sm plasmo-text-text-secondary">
                Automatically detect job application forms on page load
              </p>
            </div>
            
            <div className="plasmo-p-4 plasmo-rounded-xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
              <div className="plasmo-flex plasmo-justify-between plasmo-items-center plasmo-mb-2">
                <span className="plasmo-font-medium plasmo-text-text-primary">Show floating button</span>
                <ToggleSwitch 
                  checked={settings.showFloatingButton}
                  onChange={(v) => updateSettings({ showFloatingButton: v })}
                />
              </div>
              <p className="plasmo-text-sm plasmo-text-text-secondary">
                Display floating autofill button on detected forms
              </p>
            </div>
            
            <div className="plasmo-p-4 plasmo-rounded-xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
              <div className="plasmo-flex plasmo-justify-between plasmo-items-center plasmo-mb-2">
                <span className="plasmo-font-medium plasmo-text-text-primary">Smart field matching</span>
                <ToggleSwitch 
                  checked={settings.smartFieldMatching}
                  onChange={(v) => updateSettings({ smartFieldMatching: v })}
                />
              </div>
              <p className="plasmo-text-sm plasmo-text-text-secondary">
                Use AI to understand field labels and match to your data
              </p>
            </div>
          </div>
        </section>

        {/* Application History */}
        <section>
          <h2 className="plasmo-text-xs plasmo-uppercase plasmo-tracking-wider plasmo-text-text-muted plasmo-mb-4">
            Application History
          </h2>
          <ApplicationHistory />
        </section>
      </div>
    </div>
  );
}

export default OptionsPage;
