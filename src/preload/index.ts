import { contextBridge, ipcRenderer } from 'electron';

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
  authStorage: AuthStorageAPI;
}

const electronAPI: ElectronAPI = {
  getAppVersion: () => ipcRenderer.invoke('app:get-version'),
  getPlatform: () => ipcRenderer.invoke('app:get-platform'),
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),
  closeWindow: () => ipcRenderer.send('window:close'),
  authStorage: {
    getRefreshToken: () => ipcRenderer.invoke('auth:get-refresh-token'),
    setRefreshToken: (token: string) =>
      ipcRenderer.invoke('auth:set-refresh-token', token),
    clearRefreshToken: () => ipcRenderer.invoke('auth:clear-refresh-token'),
  },
};

// Expose protected methods that allow the renderer process to use
// safe electron capabilities without exposing the entire ipcRenderer object
contextBridge.exposeInMainWorld('electronAPI', electronAPI);
