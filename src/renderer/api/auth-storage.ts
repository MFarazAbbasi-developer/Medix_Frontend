// Web storage key for browser/LAN environments when outside Electron safeStorage
const WEB_REFRESH_TOKEN_KEY = 'medix_refresh_token';

// Memory fallback when storage is inaccessible
let memoryRefreshToken: string | null = null;

export const authStorage = {
  /**
   * Retrieves the secure refresh token via OS-protected storage (Electron safeStorage)
   * or web storage fallback.
   */
  async getRefreshToken(): Promise<string | null> {
    if (typeof window !== 'undefined' && window.electronAPI?.authStorage) {
      try {
        const token = await window.electronAPI.authStorage.getRefreshToken();
        if (token) return token;
      } catch (err) {
        console.error('Failed to get refresh token from secure storage:', err);
      }
    }

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const token = window.localStorage.getItem(WEB_REFRESH_TOKEN_KEY);
        if (token) return token;
      } catch (err) {
        console.error('Failed to read from localStorage:', err);
      }
    }

    return memoryRefreshToken;
  },

  /**
   * Stores the refresh token in OS-protected storage or web storage fallback.
   */
  async setRefreshToken(token: string): Promise<boolean> {
    if (typeof window !== 'undefined' && window.electronAPI?.authStorage) {
      try {
        return await window.electronAPI.authStorage.setRefreshToken(token);
      } catch (err) {
        console.error('Failed to store refresh token in secure storage:', err);
      }
    }

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(WEB_REFRESH_TOKEN_KEY, token);
      } catch (err) {
        console.error('Failed to write to localStorage:', err);
      }
    }

    memoryRefreshToken = token;
    return true;
  },

  /**
   * Clears the refresh token upon logout.
   */
  async clearRefreshToken(): Promise<boolean> {
    if (typeof window !== 'undefined' && window.electronAPI?.authStorage) {
      try {
        await window.electronAPI.authStorage.clearRefreshToken();
      } catch (err) {
        console.error('Failed to clear refresh token from secure storage:', err);
      }
    }

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem(WEB_REFRESH_TOKEN_KEY);
      } catch (err) {
        console.error('Failed to clear from localStorage:', err);
      }
    }

    memoryRefreshToken = null;
    return true;
  },
};

