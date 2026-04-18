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

  async deleteApplication(id: string): Promise<void> {
    const applications = await this.getApplications();
    const filtered = applications.filter(a => a.id !== id);
    await chrome.storage.local.set({ [STORAGE_KEYS.APPLICATIONS]: filtered });
  }

  // User Profile (cached from backend)
  async getUserProfile(): Promise<UserProfile | null> {
    const result = await chrome.storage.local.get(STORAGE_KEYS.USER_PROFILE);
    return result[STORAGE_KEYS.USER_PROFILE] || null;
  }

  async saveUserProfile(profile: UserProfile): Promise<void> {
    await chrome.storage.local.set({ [STORAGE_KEYS.USER_PROFILE]: profile });
  }

  async clearUserProfile(): Promise<void> {
    await chrome.storage.local.remove(STORAGE_KEYS.USER_PROFILE);
  }

  // Theme (for quick access)
  async getTheme(): Promise<'dark' | 'light' | 'system'> {
    const result = await chrome.storage.local.get(STORAGE_KEYS.THEME);
    return result[STORAGE_KEYS.THEME] || 'system';
  }

  async saveTheme(theme: 'dark' | 'light' | 'system'): Promise<void> {
    await chrome.storage.local.set({ [STORAGE_KEYS.THEME]: theme });
  }

  // Clear all data (for logout/reset)
  async clearAll(): Promise<void> {
    await chrome.storage.local.remove([
      STORAGE_KEYS.USER_PROFILE,
      STORAGE_KEYS.APPLICATIONS,
    ]);
  }
}

export const storage = new StorageManager();
