import { UserAiSettings } from './storage';

const AI_SETTINGS_KEY = 'ai-mocker:user-settings';

// Save user AI settings to local storage
export function saveAiSettingsToLocal(userId: string, settings: Partial<UserAiSettings>): boolean {
  if (typeof window === 'undefined') {
    console.warn('Cannot save settings to localStorage on server');
    return false;
  }
  
  try {
    // Get existing settings or initialize empty object
    const existingSettingsStr = localStorage.getItem(AI_SETTINGS_KEY);
    const userSettings: Record<string, UserAiSettings> = existingSettingsStr 
      ? JSON.parse(existingSettingsStr) 
      : {};
    
    // Update settings for this user
    userSettings[userId] = {
      ...(userSettings[userId] || {}),
      ...settings,
      updatedAt: Date.now()
    };
    
    // Save back to localStorage
    localStorage.setItem(AI_SETTINGS_KEY, JSON.stringify(userSettings));
    return true;
  } catch (error) {
    console.error('Error saving to localStorage:', error);
    return false;
  }
}

// Get user AI settings from local storage
export function getAiSettingsFromLocal(userId: string): UserAiSettings | null {
  if (typeof window === 'undefined') {
    return null;
  }
  
  try {
    const settingsStr = localStorage.getItem(AI_SETTINGS_KEY);
    if (!settingsStr) return null;
    
    const allSettings = JSON.parse(settingsStr);
    return allSettings[userId] || null;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return null;
  }
}

// Clear user AI settings from local storage
export function clearAiSettings(userId: string): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  
  try {
    const settingsStr = localStorage.getItem(AI_SETTINGS_KEY);
    if (!settingsStr) return true; // Nothing to clear
    
    const allSettings = JSON.parse(settingsStr);
    
    // If this user has settings, delete them
    if (allSettings[userId]) {
      delete allSettings[userId];
      localStorage.setItem(AI_SETTINGS_KEY, JSON.stringify(allSettings));
    }
    
    return true;
  } catch (error) {
    console.error('Error clearing localStorage settings:', error);
    return false;
  }
}

// Clear all user data from local storage
export function clearAllUserData(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  
  try {
    localStorage.removeItem(AI_SETTINGS_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing all localStorage data:', error);
    return false;
  }
} 