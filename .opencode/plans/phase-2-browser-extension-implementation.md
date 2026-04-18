# Phase 2: Browser Extension Implementation Plan

**Status:** Ready for Execution  
**Priority:** Phase 2.1 → 2.2 → 2.3 → 2.4 → 2.5 → 2.6 → 2.7  
**Backend:** FastAPI (localhost:8000) - Existing  
**Framework:** Plasmo (React + TypeScript + Tailwind)  

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                   EXTENSION ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌─────────────────┐   │
│  │   POPUP      │◄──►│  BACKGROUND  │◄──►│  CONTENT SCRIPT │   │
│  │   (UI)       │    │  (Messaging) │    │  (Page Inject)  │   │
│  └──────┬───────┘    └──────┬───────┘    └────────┬────────┘   │
│         │                   │                     │            │
│         │            ┌──────┴──────┐             │            │
│         │            │             │             │            │
│         └───────────►│  LOCAL      │◄────────────┘            │
│                      │  STORAGE    │                           │
│                      │  (chrome)   │                           │
│                      └──────┬─────┘                           │
│                             │                                  │
│                      ┌──────┴──────┐                           │
│                      │   BACKEND   │  (FastAPI:8000)            │
│                      │  (Ollama)   │                           │
│                      └─────────────┘                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase 2.1: Foundation & Storage Layer

**Goal:** Set up data persistence, theme system, and shared types

### Files to Modify/Create

#### 1. `src/types/index.ts` (NEW)
```typescript
// Shared TypeScript interfaces

// User Profile (from backend)
interface UserProfile {
  id: number;
  resumeText: string;
  parsedData: {
    skills: string[];
    experience: Array<{
      title: string;
      company: string;
      duration: string;
      description: string;
    }>;
    education: Array<{
      degree: string;
      school: string;
      year: string;
    }>;
    summary: string;
  };
  keywords: string[];
}

// Job Data (extracted from page)
interface JobData {
  company: string;
  title: string;
  description: string;
  location?: string;
  url: string;
  source: 'greenhouse' | 'lever' | 'workday' | 'other';
}

// Application Tracking
interface Application {
  id: string;
  company: string;
  jobTitle: string;
  dateApplied: string;
  matchScore: number;
  jobUrl: string;
  status: 'applied' | 'interview' | 'rejected' | 'offer';
  notes?: string;
  resumeVersion?: string;
}

// Extension Settings
interface ExtensionSettings {
  theme: 'dark' | 'light' | 'system';
  aiProvider: 'ollama' | 'openai' | 'claude' | 'custom';
  ollamaUrl: string;
  ollamaModel: string;
  apiKey?: string;
  autoDetectForms: boolean;
  showFloatingButton: boolean;
  smartFieldMatching: boolean;
  backendUrl: string;
}

// Field Status for Form Filling
interface FieldStatus {
  id: string;
  label: string;
  selector: string;
  type: 'text' | 'email' | 'tel' | 'file' | 'select' | 'textarea' | 'checkbox';
  value?: string;
  filled: boolean;
  required: boolean;
}

// Popup State
interface PopupState {
  currentJob: JobData | null;
  matchScore: number | null;
  fieldProgress: {
    filled: number;
    total: number;
    fields: FieldStatus[];
  };
  isLoading: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'checking';
}
```

#### 2. `src/storage/index.ts` (NEW)
```typescript
// Chrome Storage API wrapper with type safety

import type { ExtensionSettings, Application, UserProfile } from '~types';

const STORAGE_KEYS = {
  SETTINGS: 'joboracle_settings',
  APPLICATIONS: 'joboracle_applications',
  USER_PROFILE: 'joboracle_user_profile',
  THEME: 'joboracle_theme',
};

class StorageManager {
  // Settings
  async getSettings(): Promise<ExtensionSettings> {
    const result = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
    return result[STORAGE_KEYS.SETTINGS] || this.getDefaultSettings();
  }

  async saveSettings(settings: ExtensionSettings): Promise<void> {
    await chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: settings });
  }

  getDefaultSettings(): ExtensionSettings {
    return {
      theme: 'system',
      aiProvider: 'ollama',
      ollamaUrl: 'http://localhost:11434',
      ollamaModel: 'llama3.2',
      autoDetectForms: true,
      showFloatingButton: true,
      smartFieldMatching: true,
      backendUrl: 'http://localhost:8000/api',
    };
  }

  // Applications
  async getApplications(): Promise<Application[]> {
    const result = await chrome.storage.local.get(STORAGE_KEYS.APPLICATIONS);
    return result[STORAGE_KEYS.APPLICATIONS] || [];
  }

  async addApplication(application: Application): Promise<void> {
    const applications = await this.getApplications();
    applications.unshift(application); // Add to beginning
    await chrome.storage.local.set({ [STORAGE_KEYS.APPLICATIONS]: applications });
  }

  async updateApplication(id: string, updates: Partial<Application>): Promise<void> {
    const applications = await this.getApplications();
    const index = applications.findIndex(a => a.id === id);
    if (index !== -1) {
      applications[index] = { ...applications[index], ...updates };
      await chrome.storage.local.set({ [STORAGE_KEYS.APPLICATIONS]: applications });
    }
  }

  // User Profile (cached from backend)
  async getUserProfile(): Promise<UserProfile | null> {
    const result = await chrome.storage.local.get(STORAGE_KEYS.USER_PROFILE);
    return result[STORAGE_KEYS.USER_PROFILE] || null;
  }

  async saveUserProfile(profile: UserProfile): Promise<void> {
    await chrome.storage.local.set({ [STORAGE_KEYS.USER_PROFILE]: profile });
  }

  // Theme (for quick access)
  async getTheme(): Promise<'dark' | 'light' | 'system'> {
    const result = await chrome.storage.local.get(STORAGE_KEYS.THEME);
    return result[STORAGE_KEYS.THEME] || 'system';
  }

  async saveTheme(theme: 'dark' | 'light' | 'system'): Promise<void> {
    await chrome.storage.local.set({ [STORAGE_KEYS.THEME]: theme });
  }
}

export const storage = new StorageManager();
```

#### 3. `src/hooks/useTheme.ts` (NEW)
```typescript
// Theme management hook

import { useState, useEffect, useCallback } from 'react';
import { storage } from '~storage';

export function useTheme() {
  const [theme, setThemeState] = useState<'dark' | 'light' | 'system'>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    // Load saved theme
    storage.getTheme().then(saved => {
      setThemeState(saved);
    });
  }, []);

  useEffect(() => {
    // Resolve system preference
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setResolvedTheme(prefersDark ? 'dark' : 'light');
      
      // Listen for changes
      const listener = (e: MediaQueryListEvent) => {
        setResolvedTheme(e.matches ? 'dark' : 'light');
      };
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', listener);
      return () => window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', listener);
    } else {
      setResolvedTheme(theme);
    }
  }, [theme]);

  const setTheme = useCallback(async (newTheme: 'dark' | 'light' | 'system') => {
    setThemeState(newTheme);
    await storage.saveTheme(newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    const themes: Array<'dark' | 'light' | 'system'> = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    setTheme(nextTheme);
  }, [theme]);

  return { theme, resolvedTheme, setTheme, toggleTheme };
}
```

#### 4. `src/style.css` (MODIFY)
```css
/* Add custom CSS variables for theming */

@import url("https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap");

@tailwind base;
@tailwind components;
@tailwind utilities;

#plasmo-shadow-container {
  all: initial;
  box-sizing: border-box;
}

/* CSS Variables for theming */
:root {
  /* Dark Theme (Default) */
  --bg-primary: #0F1419;
  --bg-secondary: #1A1F26;
  --bg-tertiary: #252B33;
  --accent-primary: #6366F1;
  --accent-secondary: #8B5CF6;
  --accent-glow: rgba(99, 102, 241, 0.3);
  --text-primary: #F8FAFC;
  --text-secondary: #94A3B8;
  --text-muted: #64748B;
  --success: #10B981;
  --warning: #F59E0B;
  --error: #EF4444;
  --border-subtle: rgba(148, 163, 184, 0.1);
  --border-default: rgba(148, 163, 184, 0.2);
  --gradient-hero: linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #A78BFA 100%);
  --shadow-glow: 0 0 40px rgba(99, 102, 241, 0.3);
}

[data-theme="light"] {
  --bg-primary: #FFFFFF;
  --bg-secondary: #F8FAFC;
  --bg-tertiary: #F1F5F9;
  --text-primary: #0F172A;
  --text-secondary: #475569;
  --text-muted: #64748B;
  --border-subtle: rgba(148, 163, 184, 0.2);
  --border-default: rgba(148, 163, 184, 0.3);
  --shadow-glow: 0 0 40px rgba(99, 102, 241, 0.15);
}

/* Apply to plasmo container */
.plasmo-popup-container {
  font-family: 'Outfit', sans-serif;
  background: var(--bg-primary);
  color: var(--text-primary);
  width: 400px;
  min-height: 600px;
}

/* Typography */
.font-display {
  font-family: 'Space Grotesk', sans-serif;
}

.font-body {
  font-family: 'Outfit', sans-serif;
}
```

#### 5. `tailwind.config.js` (MODIFY)
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{tsx,html}"],
  darkMode: ["class", "[data-theme='dark']"],
  prefix: "plasmo-",
  theme: {
    extend: {
      colors: {
        bg: {
          primary: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          tertiary: 'var(--bg-tertiary)',
        },
        accent: {
          primary: 'var(--accent-primary)',
          secondary: 'var(--accent-secondary)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        },
      },
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        body: ['Outfit', 'sans-serif'],
      },
    },
  },
}
```

**Deliverables:**
- ✅ Type-safe storage layer
- ✅ Theme system with system preference
- ✅ CSS variable theming
- ✅ Tailwind custom config

---

## Phase 2.2: Popup UI - Main Interface

**Goal:** Build the main popup with all visual elements

### Files to Modify/Create

#### 1. `src/popup.tsx` (MODIFY - Complete rewrite)
```typescript
// Main popup entry point

import { useEffect, useState } from 'react';
import { useTheme } from '~hooks/useTheme';
import { storage } from '~storage';
import { Header } from '~components/Header';
import { JobCard } from '~components/JobCard';
import { AutoFillButton } from '~components/AutoFillButton';
import { AIOptions } from '~components/AIOptions';
import { ProgressSection } from '~components/ProgressSection';
import { ConnectionStatus } from '~components/ConnectionStatus';
import { api } from '~services/api';
import type { JobData, FieldStatus, PopupState } from '~types';

import "~style.css";

function IndexPopup() {
  const { resolvedTheme } = useTheme();
  const [state, setState] = useState<PopupState>({
    currentJob: null,
    matchScore: null,
    fieldProgress: { filled: 0, total: 0, fields: [] },
    isLoading: true,
    connectionStatus: 'checking',
  });

  useEffect(() => {
    // Check backend connection
    checkConnection();
    
    // Get current tab job data
    getCurrentJobData();
  }, []);

  const checkConnection = async () => {
    try {
      await api.checkConnection();
      setState(prev => ({ ...prev, connectionStatus: 'connected' }));
    } catch {
      setState(prev => ({ ...prev, connectionStatus: 'disconnected' }));
    }
  };

  const getCurrentJobData = async () => {
    // Query content script for job data
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, { action: 'GET_JOB_DATA' }, (response) => {
        if (response?.jobData) {
          setState(prev => ({ 
            ...prev, 
            currentJob: response.jobData,
            isLoading: false 
          }));
          // Calculate match score
          calculateMatchScore(response.jobData);
          // Get field progress
          getFieldProgress(response.jobData);
        } else {
          setState(prev => ({ ...prev, isLoading: false }));
        }
      });
    }
  };

  const calculateMatchScore = async (jobData: JobData) => {
    try {
      const score = await api.calculateMatchScore(jobData);
      setState(prev => ({ ...prev, matchScore: score }));
    } catch (error) {
      console.error('Failed to calculate match score:', error);
    }
  };

  const getFieldProgress = async (jobData: JobData) => {
    // Query content script for field detection
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, { action: 'GET_FIELD_PROGRESS' }, (response) => {
        if (response?.fields) {
          const filled = response.fields.filter((f: FieldStatus) => f.filled).length;
          setState(prev => ({
            ...prev,
            fieldProgress: {
              filled,
              total: response.fields.length,
              fields: response.fields,
            },
          }));
        }
      });
    }
  };

  const handleAutofill = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, { action: 'AUTOFILL_FORM' });
    }
  };

  const handleGenerateResume = async () => {
    if (!state.currentJob) return;
    // Open options page with resume generator
    chrome.runtime.openOptionsPage();
  };

  const handleGenerateCoverLetter = async () => {
    if (!state.currentJob) return;
    // Open options page with cover letter generator
    chrome.runtime.openOptionsPage();
  };

  return (
    <div 
      className="plasmo-popup-container" 
      data-theme={resolvedTheme}
    >
      <Header />
      
      <ConnectionStatus status={state.connectionStatus} />
      
      {state.isLoading ? (
        <div className="plasmo-flex plasmo-items-center plasmo-justify-center plasmo-py-12">
          <div className="plasmo-animate-spin plasmo-w-8 plasmo-h-8 plasmo-border-2 plasmo-border-accent-primary plasmo-border-t-transparent plasmo-rounded-full" />
        </div>
      ) : state.currentJob ? (
        <>
          <JobCard 
            job={state.currentJob} 
            matchScore={state.matchScore} 
          />
          
          <AutoFillButton 
            onClick={handleAutofill}
            disabled={state.fieldProgress.filled === state.fieldProgress.total}
          />
          
          <AIOptions 
            onGenerateResume={handleGenerateResume}
            onGenerateCoverLetter={handleGenerateCoverLetter}
          />
          
          <ProgressSection 
            filled={state.fieldProgress.filled}
            total={state.fieldProgress.total}
            fields={state.fieldProgress.fields}
          />
        </>
      ) : (
        <div className="plasmo-text-center plasmo-py-12 plasmo-px-6">
          <div className="plasmo-text-4xl plasmo-mb-4">🔍</div>
          <h3 className="plasmo-font-display plasmo-font-semibold plasmo-text-lg plasmo-text-text-primary plasmo-mb-2">
            No Job Detected
          </h3>
          <p className="plasmo-text-text-secondary plasmo-text-sm">
            Navigate to a job application page to see JobOracle in action.
          </p>
        </div>
      )}
    </div>
  );
}

export default IndexPopup;
```

#### 2. `src/components/Header.tsx` (NEW)
```typescript
// Header with logo, theme toggle, settings button

import { useTheme } from '~hooks/useTheme';

export function Header() {
  const { resolvedTheme, toggleTheme } = useTheme();

  const openSettings = () => {
    chrome.runtime.openOptionsPage();
  };

  return (
    <header className="plasmo-flex plasmo-items-center plasmo-justify-between plasmo-px-6 plasmo-py-4 plasmo-border-b plasmo-border-border-subtle" style={{ background: 'var(--gradient-aurora, radial-gradient(ellipse at top, rgba(99, 102, 241, 0.15) 0%, transparent 50%)' }}>
      <div className="plasmo-flex plasmo-items-center plasmo-gap-3">
        <div className="plasmo-w-9 plasmo-h-9 plasmo-rounded-lg plasmo-flex plasmo-items-center plasmo-justify-center plasmo-text-xl" style={{ background: 'var(--gradient-hero)', boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)' }}>
          🎯
        </div>
        <span className="plasmo-font-display plasmo-font-bold plasmo-text-lg plasmo-text-text-primary" style={{ letterSpacing: '-0.5px' }}>
          JobOracle
        </span>
      </div>
      
      <div className="plasmo-flex plasmo-items-center plasmo-gap-2">
        <button
          onClick={toggleTheme}
          className="plasmo-w-8 plasmo-h-8 plasmo-rounded-lg plasmo-flex plasmo-items-center plasmo-justify-center plasmo-transition-all plasmo-duration-200"
          style={{ 
            background: 'var(--bg-secondary)', 
            border: '1px solid var(--border-subtle)' 
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
```

#### 3. `src/components/ConnectionStatus.tsx` (NEW)
```typescript
// Backend connection indicator

interface ConnectionStatusProps {
  status: 'connected' | 'disconnected' | 'checking';
}

export function ConnectionStatus({ status }: ConnectionStatusProps) {
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
```

#### 4. `src/components/JobCard.tsx` (NEW)
```typescript
// Job information card with match score

import type { JobData } from '~types';

interface JobCardProps {
  job: JobData;
  matchScore: number | null;
}

export function JobCard({ job, matchScore }: JobCardProps) {
  const companyInitials = job.company.slice(0, 2).toUpperCase();
  const score = matchScore ?? 0;
  const circumference = 2 * Math.PI * 18;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div 
      className="plasmo-mx-4 plasmo-mt-4 plasmo-p-4 plasmo-rounded-xl"
      style={{ 
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-subtle)'
      }}
    >
      <div className="plasmo-flex plasmo-gap-3 plasmo-mb-3">
        <div 
          className="plasmo-w-11 plasmo-h-11 plasmo-rounded-lg plasmo-flex plasmo-items-center plasmo-justify-center plasmo-font-semibold plasmo-text-sm"
          style={{ 
            background: 'var(--bg-tertiary)',
            color: 'var(--accent-primary)'
          }}
        >
          {companyInitials}
        </div>
        <div className="plasmo-flex-1 plasmo-min-w-0">
          <div className="plasmo-text-xs plasmo-text-text-secondary plasmo-mb-0.5">
            {job.company}
          </div>
          <div className="plasmo-font-display plasmo-font-semibold plasmo-text-text-primary plasmo-text-sm plasmo-truncate">
            {job.title}
          </div>
        </div>
        
        {matchScore !== null && (
          <div className="plasmo-flex plasmo-flex-col plasmo-items-center">
            <div className="plasmo-relative plasmo-w-11 plasmo-h-11">
              <svg className="plasmo-w-full plasmo-h-full -plasmo-rotate-90" viewBox="0 0 40 40">
                <circle
                  cx="20"
                  cy="20"
                  r="18"
                  fill="none"
                  stroke="var(--bg-tertiary)"
                  strokeWidth="3"
                />
                <circle
                  cx="20"
                  cy="20"
                  r="18"
                  fill="none"
                  stroke={score >= 80 ? 'var(--success)' : score >= 60 ? 'var(--warning)' : 'var(--error)'}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="plasmo-transition-all plasmo-duration-1000"
                />
              </svg>
              <div className="plasmo-absolute plasmo-inset-0 plasmo-flex plasmo-items-center plasmo-justify-center">
                <span className="plasmo-font-display plasmo-font-bold plasmo-text-xs" style={{ color: score >= 80 ? 'var(--success)' : score >= 60 ? 'var(--warning)' : 'var(--error)' }}>
                  {Math.round(score)}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="plasmo-flex plasmo-gap-4 plasmo-text-xs plasmo-text-text-muted">
        <span>🕐 Just now</span>
        <span>👥 200+ applicants</span>
      </div>
    </div>
  );
}
```

#### 5. `src/components/AutoFillButton.tsx` (NEW)
```typescript
// Primary CTA button

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
      
      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
```

#### 6. `src/components/AIOptions.tsx` (NEW)
```typescript
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
          WebkitTextFillColor: 'transparent'
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
```

#### 7. `src/components/ProgressSection.tsx` (NEW)
```typescript
// Field completion progress with list

import type { FieldStatus } from '~types';

interface ProgressSectionProps {
  filled: number;
  total: number;
  fields: FieldStatus[];
}

export function ProgressSection({ filled, total, fields }: ProgressSectionProps) {
  const percentage = total > 0 ? Math.round((filled / total) * 100) : 0;
  
  return (
    <div 
      className="plasmo-mx-4 plasmo-mt-4 plasmo-mb-4 plasmo-p-4 plasmo-rounded-xl"
      style={{ 
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-subtle)'
      }}
    >
      <div className="plasmo-flex plasmo-justify-between plasmo-items-center plasmo-mb-3">
        <span className="plasmo-font-medium plasmo-text-text-primary plasmo-text-sm">
          {filled} of {total} fields filled
        </span>
        <span className="plasmo-font-display plasmo-font-bold plasmo-text-lg" style={{ color: 'var(--success)' }}>
          {percentage}%
        </span>
      </div>
      
      <div className="plasmo-h-1.5 plasmo-rounded-full plasmo-overflow-hidden plasmo-mb-4" style={{ background: 'var(--bg-tertiary)' }}>
        <div 
          className="plasmo-h-full plasmo-rounded-full plasmo-relative"
          style={{ 
            width: `${percentage}%`,
            background: 'linear-gradient(90deg, var(--success), #34D399)'
          }}
        >
          <div 
            className="plasmo-absolute plasmo-right-0 plasmo-top-0 plasmo-bottom-0 plasmo-w-5"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3))' }}
          />
        </div>
      </div>
      
      <div className="plasmo-flex plasmo-flex-col plasmo-gap-1">
        {fields.slice(0, 6).map((field) => (
          <div key={field.id} className="plasmo-flex plasmo-items-center plasmo-gap-2 plasmo-py-2 plasmo-border-b plasmo-border-border-subtle last:plasmo-border-b-0">
            <div 
              className="plasmo-w-5 plasmo-h-5 plasmo-rounded-full plasmo-flex plasmo-items-center plasmo-justify-center plasmo-text-xs"
              style={{ 
                background: field.filled ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                color: field.filled ? 'var(--success)' : 'var(--warning)'
              }}
            >
              {field.filled ? '✓' : '−'}
            </div>
            <span className={`plasmo-text-sm ${field.filled ? 'plasmo-text-text-primary' : 'plasmo-text-text-secondary'}`}>
              {field.label}
            </span>
          </div>
        ))}
        {fields.length > 6 && (
          <div className="plasmo-text-xs plasmo-text-text-muted plasmo-text-center plasmo-py-2">
            +{fields.length - 6} more fields
          </div>
        )}
      </div>
    </div>
  );
}
```

**Deliverables:**
- ✅ Complete popup UI with all components
- ✅ Theme-aware styling
- ✅ Loading states and empty states
- ✅ Connection status indicator

---

## Phase 2.3: Settings Page

**Goal:** Complete settings with AI configuration

### Files to Modify/Create

#### 1. `src/options.tsx` (NEW or MODIFY if exists)
```typescript
// Settings page entry point

import { useEffect, useState } from 'react';
import { storage } from '~storage';
import type { ExtensionSettings } from '~types';
import { AIProviderSelector } from '~components/settings/AIProviderSelector';
import { ToggleSwitch } from '~components/settings/ToggleSwitch';
import { ApplicationHistory } from '~components/settings/ApplicationHistory';

import "~style.css";

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
    <div className="plasmo-min-h-screen plasmo-p-8" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: 'Outfit, sans-serif' }}>
      <div className="plasmo-max-w-2xl plasmo-mx-auto">
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
```

#### 2. `src/components/settings/AIProviderSelector.tsx` (NEW)
```typescript
// Provider grid selector

type Provider = 'ollama' | 'openai' | 'claude' | 'custom';

interface AIProviderSelectorProps {
  value: Provider;
  onChange: (provider: Provider) => void;
}

const providers = [
  { id: 'ollama' as Provider, name: 'Ollama', desc: 'Local', recommended: true },
  { id: 'openai' as Provider, name: 'OpenAI', desc: 'API Key' },
  { id: 'claude' as Provider, name: 'Claude', desc: 'API Key' },
  { id: 'custom' as Provider, name: 'Custom', desc: 'Compatible' },
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
```

#### 3. `src/components/settings/ToggleSwitch.tsx` (NEW)
```typescript
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
```

#### 4. `src/components/settings/ApplicationHistory.tsx` (NEW)
```typescript
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
```

**Deliverables:**
- ✅ Complete settings page
- ✅ AI provider selector
- ✅ Toggle switches for autofill options
- ✅ Application history with export

---

## Phase 2.4: Content Script - Greenhouse Detection

**Goal:** Detect job forms and extract job data

### Files to Modify/Create

#### 1. `src/content.tsx` (MODIFY - Complete rewrite)
```typescript
// Content script for page interaction

import cssText from "data-text:~style.css";
import type { PlasmoCSConfig } from "plasmo";
import { GreenhouseDetector } from '~detectors/greenhouse';
import { FieldMatcher } from '~detectors/field-matcher';
import { AutoFillEngine } from '~services/autofill';
import { storage } from '~storage';
import type { JobData, FieldStatus } from '~types';

export const config: PlasmoCSConfig = {
  matches: [
    "https://boards.greenhouse.io/*",
    "https://*.greenhouse.io/*"
  ],
  all_frames: false
};

// Inject styles
export const getStyle = (): HTMLStyleElement => {
  const styleElement = document.createElement("style");
  styleElement.textContent = cssText;
  return styleElement;
};

// State
let currentJobData: JobData | null = null;
let detectedFields: FieldStatus[] = [];
let floatingButton: HTMLElement | null = null;

// Initialize
const init = async () => {
  const settings = await storage.getSettings();
  
  // Check if we're on a job application page
  if (GreenhouseDetector.isJobApplicationPage()) {
    // Extract job data
    currentJobData = GreenhouseDetector.extractJobData();
    
    // Detect form fields
    detectedFields = await detectFields(settings.smartFieldMatching);
    
    // Show floating button if enabled
    if (settings.showFloatingButton) {
      showFloatingButton();
    }
  }
};

const detectFields = async (useSmartMatching: boolean): Promise<FieldStatus[]> => {
  const form = document.querySelector('form, #application-form, [data-testid="application-form"]');
  if (!form) return [];
  
  const inputs = form.querySelectorAll('input, textarea, select');
  const fields: FieldStatus[] = [];
  
  inputs.forEach((input, index) => {
    const label = findLabel(input);
    const field = FieldMatcher.categorizeField(label, input, useSmartMatching);
    
    fields.push({
      id: `field-${index}`,
      label: label || `Field ${index + 1}`,
      selector: generateSelector(input),
      type: getFieldType(input),
      filled: !!(input as HTMLInputElement).value,
      required: input.hasAttribute('required'),
    });
  });
  
  return fields;
};

const findLabel = (input: Element): string => {
  // Try various label finding strategies
  const id = input.getAttribute('id');
  const name = input.getAttribute('name');
  const ariaLabel = input.getAttribute('aria-label');
  const placeholder = input.getAttribute('placeholder');
  
  // Check for explicit label
  if (id) {
    const label = document.querySelector(`label[for="${id}"]`);
    if (label) return label.textContent?.trim() || '';
  }
  
  // Check for parent label
  const parentLabel = input.closest('label');
  if (parentLabel) return parentLabel.textContent?.trim() || '';
  
  // Check for preceding element
  const prevElement = input.previousElementSibling;
  if (prevElement && prevElement.tagName === 'LABEL') {
    return prevElement.textContent?.trim() || '';
  }
  
  return ariaLabel || placeholder || name || '';
};

const getFieldType = (input: Element): FieldStatus['type'] => {
  const tag = input.tagName.toLowerCase();
  if (tag === 'textarea') return 'textarea';
  if (tag === 'select') return 'select';
  
  const type = input.getAttribute('type') || 'text';
  if (type === 'email') return 'email';
  if (type === 'tel') return 'tel';
  if (type === 'file') return 'file';
  if (type === 'checkbox') return 'checkbox';
  
  return 'text';
};

const generateSelector = (element: Element): string => {
  // Generate a unique selector for the element
  const id = element.getAttribute('id');
  if (id) return `#${id}`;
  
  const name = element.getAttribute('name');
  if (name) return `[name="${name}"]`;
  
  // Fallback to nth-child
  const tag = element.tagName.toLowerCase();
  const parent = element.parentElement;
  if (parent) {
    const siblings = Array.from(parent.children).filter(el => el.tagName === element.tagName);
    const index = siblings.indexOf(element as HTMLElement);
    return `${tag}:nth-of-type(${index + 1})`;
  }
  
  return tag;
};

const showFloatingButton = () => {
  if (floatingButton) return;
  
  floatingButton = document.createElement('div');
  floatingButton.innerHTML = `
    <button id="joboracle-float-btn" style="
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: linear-gradient(135deg, #6366F1, #8B5CF6);
      color: white;
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      transition: transform 0.2s;
    " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
      ⚡
    </button>
  `;
  
  document.body.appendChild(floatingButton);
  
  const btn = document.getElementById('joboracle-float-btn');
  if (btn) {
    btn.addEventListener('click', handleAutofill);
  }
};

const handleAutofill = async () => {
  const profile = await storage.getUserProfile();
  if (!profile) {
    alert('Please upload your resume in the extension settings first!');
    return;
  }
  
  AutoFillEngine.fillForm(detectedFields, profile);
  
  // Update field status
  detectedFields = detectedFields.map(f => ({ ...f, filled: true }));
};

// Message handler for popup communication
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'GET_JOB_DATA':
      sendResponse({ jobData: currentJobData });
      break;
    case 'GET_FIELD_PROGRESS':
      sendResponse({ fields: detectedFields });
      break;
    case 'AUTOFILL_FORM':
      handleAutofill();
      sendResponse({ success: true });
      break;
    default:
      sendResponse({ error: 'Unknown action' });
  }
  return true;
});

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Plasmo overlay (optional UI element)
const PlasmoOverlay = () => {
  return null; // We handle UI via floating button
};

export default PlasmoOverlay;
```

#### 2. `src/detectors/greenhouse.ts` (NEW)
```typescript
// Greenhouse-specific detection logic

import type { JobData } from '~types';

export class GreenhouseDetector {
  static isJobApplicationPage(): boolean {
    const url = window.location.href;
    // Match patterns like: boards.greenhouse.io/{company}/jobs/{id}
    return /boards\.greenhouse\.io\/[^/]+\/jobs\/\d+/.test(url);
  }

  static extractJobData(): JobData {
    const url = window.location.href;
    const urlMatch = url.match(/boards\.greenhouse\.io\/([^/]+)\/jobs\/(\d+)/);
    const company = urlMatch ? urlMatch[1] : 'Unknown Company';
    
    // Try to extract job title from various selectors
    const titleSelectors = [
      'h1.app-title',
      'h1.posting-headline',
      '.app-title',
      'h1',
      '[data-testid="job-title"]',
      '.posting-title'
    ];
    
    let title = 'Unknown Position';
    for (const selector of titleSelectors) {
      const el = document.querySelector(selector);
      if (el && el.textContent) {
        title = el.textContent.trim();
        break;
      }
    }
    
    // Extract job description
    const descriptionSelectors = [
      '.description',
      '[data-testid="job-description"]',
      '.posting-description',
      '#job-description',
      '.app-description'
    ];
    
    let description = '';
    for (const selector of descriptionSelectors) {
      const el = document.querySelector(selector);
      if (el && el.textContent) {
        description = el.textContent.trim();
        break;
      }
    }
    
    // Extract location if available
    const locationSelectors = [
      '.location',
      '[data-testid="job-location"]',
      '.posting-location'
    ];
    
    let location = '';
    for (const selector of locationSelectors) {
      const el = document.querySelector(selector);
      if (el && el.textContent) {
        location = el.textContent.trim();
        break;
      }
    }
    
    return {
      company: this.capitalizeCompany(company),
      title,
      description,
      location,
      url,
      source: 'greenhouse'
    };
  }

  private static capitalizeCompany(company: string): string {
    return company
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  static findApplicationForm(): HTMLFormElement | null {
    const selectors = [
      'form#application-form',
      'form[action*="/applications"]',
      '[data-testid="application-form"]',
      'form'
    ];
    
    for (const selector of selectors) {
      const form = document.querySelector(selector) as HTMLFormElement;
      if (form) return form;
    }
    
    return null;
  }
}
```

#### 3. `src/detectors/field-matcher.ts` (NEW)
```typescript
// Hybrid field matching (keywords + AI)

import { api } from '~services/api';
import { storage } from '~storage';

interface FieldMapping {
  keywords: string[];
  field: string;
  type: string;
}

// Pre-defined keyword mappings
const KEYWORD_MAPPINGS: FieldMapping[] = [
  { keywords: ['first name', 'firstname', 'given name'], field: 'firstName', type: 'text' },
  { keywords: ['last name', 'lastname', 'surname', 'family name'], field: 'lastName', type: 'text' },
  { keywords: ['full name', 'name'], field: 'fullName', type: 'text' },
  { keywords: ['email', 'e-mail', 'email address'], field: 'email', type: 'email' },
  { keywords: ['phone', 'telephone', 'mobile', 'cell'], field: 'phone', type: 'tel' },
  { keywords: ['linkedin', 'linked-in'], field: 'linkedin', type: 'text' },
  { keywords: ['portfolio', 'website', 'personal site'], field: 'portfolio', type: 'text' },
  { keywords: ['github', 'git hub'], field: 'github', type: 'text' },
  { keywords: ['resume', 'cv', 'curriculum vitae'], field: 'resume', type: 'file' },
  { keywords: ['cover letter', 'coverletter'], field: 'coverLetter', type: 'textarea' },
  { keywords: ['address', 'street address'], field: 'address', type: 'text' },
  { keywords: ['city'], field: 'city', type: 'text' },
  { keywords: ['state', 'province'], field: 'state', type: 'text' },
  { keywords: ['zip', 'postal code', 'zipcode'], field: 'zipCode', type: 'text' },
  { keywords: ['country'], field: 'country', type: 'text' },
  { keywords: ['salary', 'compensation', 'expected salary'], field: 'salary', type: 'text' },
  { keywords: ['how did you hear', 'source', 'referral'], field: 'source', type: 'text' },
  { keywords: ['sponsor', 'visa', 'work authorization'], field: 'sponsorship', type: 'checkbox' },
];

export class FieldMatcher {
  static categorizeField(
    label: string, 
    element: Element, 
    useSmartMatching: boolean
  ): { field: string; confidence: number } {
    const normalizedLabel = label.toLowerCase().trim();
    
    // 1. Try keyword matching first (fast, offline)
    for (const mapping of KEYWORD_MAPPINGS) {
      for (const keyword of mapping.keywords) {
        if (normalizedLabel.includes(keyword)) {
          return { field: mapping.field, confidence: 0.9 };
        }
      }
    }
    
    // 2. Try input type/name matching
    const name = element.getAttribute('name')?.toLowerCase() || '';
    const id = element.getAttribute('id')?.toLowerCase() || '';
    
    for (const mapping of KEYWORD_MAPPINGS) {
      for (const keyword of mapping.keywords) {
        if (name.includes(keyword) || id.includes(keyword)) {
          return { field: mapping.field, confidence: 0.85 };
        }
      }
    }
    
    // 3. Fallback: use label as-is (low confidence)
    return { field: normalizedLabel, confidence: 0.3 };
  }

  static async categorizeWithAI(label: string): Promise<{ field: string; confidence: number }> {
    try {
      const result = await api.categorizeField(label);
      return result;
    } catch (error) {
      console.error('AI categorization failed:', error);
      return { field: label, confidence: 0.1 };
    }
  }

  static getFieldValue(field: string, profile: any): string | null {
    const mapping: Record<string, string[]> = {
      firstName: [profile.parsedData?.personal?.firstName],
      lastName: [profile.parsedData?.personal?.lastName],
      fullName: [profile.parsedData?.personal?.fullName],
      email: [profile.parsedData?.personal?.email],
      phone: [profile.parsedData?.personal?.phone],
      linkedin: [profile.parsedData?.personal?.linkedin],
      portfolio: [profile.parsedData?.personal?.website],
      github: [profile.parsedData?.personal?.github],
      address: [profile.parsedData?.personal?.address],
      city: [profile.parsedData?.personal?.city],
      state: [profile.parsedData?.personal?.state],
      zipCode: [profile.parsedData?.personal?.zipCode],
      country: [profile.parsedData?.personal?.country],
    };

    const values = mapping[field];
    if (values && values[0]) return values[0];
    
    // Try to extract from resume text
    return null;
  }
}
```

**Deliverables:**
- ✅ Greenhouse-specific detection
- ✅ Job data extraction (title, company, description, location)
- ✅ Field detection with hybrid matching
- ✅ Floating autofill button
- ✅ Message passing for popup communication

---

## Phase 2.5: AI Integration Layer

**Goal:** Connect to backend API

### Files to Modify/Create

#### 1. `src/services/api.ts` (NEW)
```typescript
// Backend API client

import { storage } from '~storage';
import type { JobData } from '~types';

class APIClient {
  private async getBaseURL(): Promise<string> {
    const settings = await storage.getSettings();
    return settings.backendUrl || 'http://localhost:8000/api';
  }

  private async fetch(endpoint: string, options?: RequestInit) {
    const baseURL = await this.getBaseURL();
    const response = await fetch(`${baseURL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || `API error: ${response.status}`);
    }

    return response.json();
  }

  // Connection check
  async checkConnection(): Promise<boolean> {
    try {
      await this.fetch('/settings');
      return true;
    } catch {
      return false;
    }
  }

  // Match score calculation
  async calculateMatchScore(jobData: JobData): Promise<number> {
    const userProfile = await storage.getUserProfile();
    if (!userProfile) return 0;

    // First, create a job entry in the database
    const job = await this.fetch('/jobs', {
      method: 'POST',
      body: JSON.stringify({
        title: jobData.title,
        company: jobData.company,
        description: jobData.description,
        location: jobData.location,
        url: jobData.url,
        source: jobData.source,
      }),
    });

    // Calculate score
    const result = await this.fetch('/jobs/score', {
      method: 'POST',
      body: JSON.stringify({ job_id: job.id }),
    });

    return result.score;
  }

  // Resume upload
  async uploadResume(file: File): Promise<{ id: number }> {
    const formData = new FormData();
    formData.append('file', file);

    const baseURL = await this.getBaseURL();
    const response = await fetch(`${baseURL}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) throw new Error('Upload failed');
    return response.json();
  }

  // Parse resume
  async parseResume(resumeId: number): Promise<any> {
    return this.fetch('/parse', {
      method: 'POST',
      body: JSON.stringify({ resume_id: resumeId }),
    });
  }

  // Get user profile
  async getUserProfile(): Promise<any> {
    // Get latest resume and parsed data
    const resumes = await this.fetch('/resumes');
    if (!resumes.length) return null;

    const latestResume = resumes[resumes.length - 1];
    const parsedData = await this.fetch(`/resumes/${latestResume.id}/parsed`);
    
    return {
      ...latestResume,
      parsedData,
    };
  }

  // Generate tailored resume
  async generateResume(jobData: JobData): Promise<string> {
    return this.fetch('/ai/generate-resume', {
      method: 'POST',
      body: JSON.stringify({
        job_title: jobData.title,
        company: jobData.company,
        job_description: jobData.description,
      }),
    });
  }

  // Generate cover letter
  async generateCoverLetter(jobData: JobData): Promise<string> {
    return this.fetch('/ai/generate-cover-letter', {
      method: 'POST',
      body: JSON.stringify({
        job_title: jobData.title,
        company: jobData.company,
        job_description: jobData.description,
      }),
    });
  }

  // Categorize field (for smart matching)
  async categorizeField(label: string): Promise<{ field: string; confidence: number }> {
    return this.fetch('/ai/categorize-field', {
      method: 'POST',
      body: JSON.stringify({ label }),
    });
  }
}

export const api = new APIClient();
```

**Deliverables:**
- ✅ Backend API client
- ✅ Match score calculation
- ✅ Resume upload and parsing
- ✅ AI generation endpoints

---

## Phase 2.6: Autofill Engine

**Goal:** Actually fill the forms

### Files to Modify/Create

#### 1. `src/services/autofill.ts` (NEW)
```typescript
// Autofill logic

import type { FieldStatus } from '~types';
import { FieldMatcher } from '~detectors/field-matcher';

export class AutoFillEngine {
  static async fillForm(fields: FieldStatus[], profile: any): Promise<void> {
    for (const field of fields) {
      if (field.filled) continue;
      
      const value = FieldMatcher.getFieldValue(field.field, profile);
      if (value) {
        await this.fillField(field, value);
        field.filled = true;
      }
    }
  }

  static async fillField(field: FieldStatus, value: string): Promise<void> {
    const element = document.querySelector(field.selector) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    if (!element) return;

    switch (field.type) {
      case 'text':
      case 'email':
      case 'tel':
        this.setInputValue(element as HTMLInputElement, value);
        break;
      case 'textarea':
        this.setTextareaValue(element as HTMLTextAreaElement, value);
        break;
      case 'select':
        this.setSelectValue(element as HTMLSelectElement, value);
        break;
      case 'checkbox':
        this.setCheckboxValue(element as HTMLInputElement, value === 'true');
        break;
    }

    // Trigger change events
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }

  private static setInputValue(element: HTMLInputElement, value: string): void {
    element.focus();
    element.value = value;
    element.dispatchEvent(new Event('input', { bubbles: true }));
  }

  private static setTextareaValue(element: HTMLTextAreaElement, value: string): void {
    element.focus();
    element.value = value;
    element.dispatchEvent(new Event('input', { bubbles: true }));
  }

  private static setSelectValue(element: HTMLSelectElement, value: string): void {
    // Try exact match first
    let option = Array.from(element.options).find(opt => 
      opt.value.toLowerCase() === value.toLowerCase() ||
      opt.text.toLowerCase() === value.toLowerCase()
    );
    
    // Try partial match
    if (!option) {
      option = Array.from(element.options).find(opt =>
        opt.text.toLowerCase().includes(value.toLowerCase())
      );
    }
    
    if (option) {
      element.value = option.value;
      element.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  private static setCheckboxValue(element: HTMLInputElement, checked: boolean): void {
    element.checked = checked;
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }
}
```

**Deliverables:**
- ✅ Form field filling logic
- ✅ Event triggering for React/Angular/Vue compatibility
- ✅ Smart value matching for selects

---

## Phase 2.7: Application Tracking

**Goal:** Save application history

### Files to Modify/Create

#### 1. `src/services/tracker.ts` (NEW)
```typescript
// Application tracking service

import { storage } from '~storage';
import type { Application, JobData } from '~types';

export class ApplicationTracker {
  static async trackApplication(jobData: JobData, matchScore: number): Promise<void> {
    const application: Application = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      company: jobData.company,
      jobTitle: jobData.title,
      dateApplied: new Date().toISOString(),
      matchScore,
      jobUrl: jobData.url,
      status: 'applied',
    };

    await storage.addApplication(application);
  }

  static async updateStatus(applicationId: string, status: Application['status']): Promise<void> {
    await storage.updateApplication(applicationId, { status });
  }

  static async addNotes(applicationId: string, notes: string): Promise<void> {
    await storage.updateApplication(applicationId, { notes });
  }
}
```

#### 2. Integrate tracking into autofill

Modify `content.tsx` to track after successful autofill:

```typescript
// In handleAutofill:
const handleAutofill = async () => {
  // ... existing code ...
  
  // Track application
  if (currentJobData && state.matchScore) {
    await ApplicationTracker.trackApplication(currentJobData, state.matchScore);
  }
};
```

**Deliverables:**
- ✅ Application tracking
- ✅ Status updates
- ✅ Export functionality

---

## Package.json Updates

Add these dependencies:

```json
{
  "dependencies": {
    "plasmo": "0.90.5",
    "react": "18.2.0",
    "react-dom": "18.2.0",
    "tailwindcss": "3.4.1"
  },
  "devDependencies": {
    "@ianvs/prettier-plugin-sort-imports": "4.1.1",
    "@types/chrome": "0.0.258",
    "@types/node": "20.11.5",
    "@types/react": "18.2.48",
    "@types/react-dom": "18.2.18",
    "postcss": "8.4.33",
    "prettier": "3.2.4",
    "typescript": "5.3.3"
  },
  "manifest": {
    "host_permissions": [
      "https://boards.greenhouse.io/*",
      "https://*.greenhouse.io/*"
    ],
    "permissions": [
      "storage",
      "activeTab"
    ],
    "options_page": "options.html"
  }
}
```

---

## File Structure Summary

```
job-oracle-ai-companion/
├── src/
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── JobCard.tsx
│   │   ├── AutoFillButton.tsx
│   │   ├── AIOptions.tsx
│   │   ├── ProgressSection.tsx
│   │   ├── ConnectionStatus.tsx
│   │   └── settings/
│   │       ├── AIProviderSelector.tsx
│   │       ├── ToggleSwitch.tsx
│   │       └── ApplicationHistory.tsx
│   ├── detectors/
│   │   ├── greenhouse.ts
│   │   └── field-matcher.ts
│   ├── services/
│   │   ├── api.ts
│   │   ├── autofill.ts
│   │   └── tracker.ts
│   ├── hooks/
│   │   └── useTheme.ts
│   ├── storage/
│   │   └── index.ts
│   ├── types/
│   │   └── index.ts
│   ├── popup.tsx
│   ├── content.tsx
│   ├── options.tsx
│   └── style.css
├── package.json
└── tailwind.config.js
```

---

## Execution Checklist

- [ ] Phase 2.1: Foundation & Storage
- [ ] Phase 2.2: Popup UI
- [ ] Phase 2.3: Settings Page
- [ ] Phase 2.4: Content Script - Greenhouse Detection
- [ ] Phase 2.5: AI Integration Layer
- [ ] Phase 2.6: Autofill Engine
- [ ] Phase 2.7: Application Tracking

---

## Testing Strategy

1. **Local Development**: `pnpm dev` for hot reload
2. **Greenhouse Test**: Navigate to any greenhouse job application page
3. **Verify Detection**: Check if job data is extracted correctly
4. **Test Autofill**: Upload resume, click autofill button
5. **Check Tracking**: Verify application appears in settings

---

**Ready to implement?** Let me know which phase you'd like to start with, or if you'd like any adjustments to the plan!