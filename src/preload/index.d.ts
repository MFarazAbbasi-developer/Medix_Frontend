export interface AuthStorageAPI {
  getRefreshToken: () => Promise<string | null>;
  setRefreshToken: (token: string) => Promise<boolean>;
  clearRefreshToken: () => Promise<boolean>;
}

export interface ElectronAPI {
  getAppVersion: () => Promise<string>;
  getPlatform: () => Promise<string>;
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  closeWindow: () => void;
  authStorage?: AuthStorageAPI;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
