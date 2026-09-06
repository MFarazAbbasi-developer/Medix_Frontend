// Memory fallback when running outside Electron (e.g. unit tests or web dev)
let memoryRefreshToken: string | null = null;

export const authStorage = {
  /**
   * Retrieves the secure refresh token via OS-protected storage (Electron safeStorage).
   */
  async getRefreshToken(): Promise<string | null> {
    if (window.electronAPI?.authStorage) {
      try {
        return await window.electronAPI.authStorage.getRefreshToken();
      } catch (err) {
        console.error('Failed to get refresh token from secure storage:', err);
      }
    }
    return memoryRefreshToken;
  },

  /**
   * Stores the refresh token in OS-protected storage.
   */
  async setRefreshToken(token: string): Promise<boolean> {
    if (window.electronAPI?.authStorage) {
      try {
        return await window.electronAPI.authStorage.setRefreshToken(token);
      } catch (err) {
        console.error('Failed to store refresh token in secure storage:', err);
      }
    }
    memoryRefreshToken = token;
    return true;
  },

  /**
   * Clears the refresh token upon logout.
   */
  async clearRefreshToken(): Promise<boolean> {
    if (window.electronAPI?.authStorage) {
      try {
        return await window.electronAPI.authStorage.clearRefreshToken();
      } catch (err) {
        console.error('Failed to clear refresh token from secure storage:', err);
      }
    }
    memoryRefreshToken = null;
    return true;
  },
};
