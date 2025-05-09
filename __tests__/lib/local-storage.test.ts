/**
 * @jest-environment jsdom
 */

import { saveAiSettingsToLocal, getAiSettingsFromLocal, clearAiSettings, clearAllUserData } from '@/lib/local-storage';
import { UserAiSettings } from '@/lib/storage';

describe('Local Storage API Settings', () => {
  // Setup localStorage mock
  const localStorageMock = (function() {
    let store: Record<string, string> = {};
    return {
      getItem: jest.fn((key: string) => store[key] || null),
      setItem: jest.fn((key: string, value: string) => {
        store[key] = value.toString();
      }),
      removeItem: jest.fn((key: string) => {
        delete store[key];
      }),
      clear: jest.fn(() => {
        store = {};
      })
    };
  })();

  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
  });

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    jest.spyOn(Date, 'now').mockReturnValue(1000000000000);
  });

  describe('saveAiSettingsToLocal', () => {
    it('should save new settings to localStorage', () => {
      const userId = 'user123';
      const settings: Partial<UserAiSettings> = {
        apiKey: 'test-api-key',
        model: 'gpt-4',
        temperature: 0.7
      };

      const result = saveAiSettingsToLocal(userId, settings);

      expect(result).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledTimes(1);
      
      // Verify the key used for localStorage
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'ai-mocker:user-settings',
        expect.any(String)
      );
      
      // Verify the content saved
      const savedContent = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(savedContent).toHaveProperty(userId);
      expect(savedContent[userId]).toEqual({
        ...settings,
        updatedAt: 1000000000000
      });
    });

    it('should update existing settings for a user', () => {
      const userId = 'user123';
      
      // First save
      const initialSettings: Partial<UserAiSettings> = {
        apiKey: 'initial-api-key',
        model: 'gpt-3.5-turbo'
      };
      
      saveAiSettingsToLocal(userId, initialSettings);
      
      // Then update
      const updatedSettings: Partial<UserAiSettings> = {
        apiKey: 'updated-api-key'
      };
      
      const result = saveAiSettingsToLocal(userId, updatedSettings);
      
      expect(result).toBe(true);
      
      // Verify the content was merged
      const savedContent = JSON.parse(localStorageMock.setItem.mock.calls[1][1]);
      expect(savedContent[userId]).toEqual({
        apiKey: 'updated-api-key', 
        model: 'gpt-3.5-turbo',
        updatedAt: 1000000000000
      });
    });
  });

  describe('getAiSettingsFromLocal', () => {
    it('should retrieve user settings from localStorage', () => {
      const userId = 'user123';
      const settings: UserAiSettings = {
        apiKey: 'test-api-key',
        model: 'gpt-4',
        temperature: 0.7,
        updatedAt: 1000000000000
      };
      
      // Store settings in localStorage
      localStorageMock.setItem(
        'ai-mocker:user-settings', 
        JSON.stringify({ [userId]: settings })
      );
      
      // Retrieve settings
      const result = getAiSettingsFromLocal(userId);
      
      expect(result).toEqual(settings);
    });
    
    it('should return null when no settings exist', () => {
      const result = getAiSettingsFromLocal('nonexistent-user');
      expect(result).toBeNull();
    });
    
    it('should return null when storage key is empty', () => {
      localStorageMock.setItem('ai-mocker:user-settings', '');
      const result = getAiSettingsFromLocal('user123');
      expect(result).toBeNull();
    });
  });

  describe('clearAiSettings', () => {
    it('should clear settings for a specific user', () => {
      // Setup multiple users with settings
      const settings = {
        'user123': {
          apiKey: 'user123-key',
          updatedAt: 1000000000000
        },
        'user456': {
          apiKey: 'user456-key',
          updatedAt: 1000000000000
        }
      };
      
      localStorageMock.setItem(
        'ai-mocker:user-settings',
        JSON.stringify(settings)
      );
      
      // Reset mock calls count after initial setup
      localStorageMock.setItem.mockClear();
      
      // Clear one user's settings
      const result = clearAiSettings('user123');
      
      expect(result).toBe(true);
      
      // Get the most recent call to setItem
      expect(localStorageMock.setItem).toHaveBeenCalledTimes(1);
      
      // Verify only user123 was removed from settings
      const expectedRemainingSettings = {
        'user456': {
          apiKey: 'user456-key',
          updatedAt: 1000000000000
        }
      };
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'ai-mocker:user-settings',
        JSON.stringify(expectedRemainingSettings)
      );
    });
    
    it('should return true when no settings exist to clear', () => {
      const result = clearAiSettings('nonexistent-user');
      expect(result).toBe(true);
      // localStorage should not be modified
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });
  });

  describe('clearAllUserData', () => {
    it('should remove all user data from localStorage', () => {
      // Set some rubbish data
      localStorageMock.setItem(
        'ai-mocker:user-settings',
        JSON.stringify({ 'user123': { apiKey: 'test' } })
      );
      
      // delete the rubbish data
      const result = clearAllUserData();
      
      expect(result).toBe(true);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('ai-mocker:user-settings');
    });
  });
}); 