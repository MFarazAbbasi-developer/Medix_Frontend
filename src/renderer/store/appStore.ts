import { create } from 'zustand';
import { APP_CONFIG } from '../config/app.config';

export type BackendStatus = 'connected' | 'checking' | 'disconnected';

interface AppState {
  apiBaseUrl: string;
  backendStatus: BackendStatus;
  lastCheckedAt: string | null;
  serverInfo: {
    appName?: string;
    appVersion?: string;
    databaseStatus?: string;
    uptimeSeconds?: number;
  } | null;
  isSidebarCollapsed: boolean;
  isCommandPaletteOpen: boolean;
  setApiBaseUrl: (url: string) => void;
  setBackendStatus: (status: BackendStatus) => void;
  setServerInfo: (info: AppState['serverInfo']) => void;
  toggleSidebar: () => void;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  toggleCommandPalette: () => void;
}

export const useAppStore = create<AppState>((set) => {
  const storedUrl = localStorage.getItem(APP_CONFIG.storageKeys.apiBaseUrl);
  const storedSidebar = localStorage.getItem(
    APP_CONFIG.storageKeys.sidebarCollapsed,
  );

  return {
    apiBaseUrl: storedUrl || APP_CONFIG.defaultApiBaseUrl,
    backendStatus: 'checking',
    lastCheckedAt: null,
    serverInfo: null,
    isSidebarCollapsed: storedSidebar === 'true',
    isCommandPaletteOpen: false,

    setApiBaseUrl: (url: string) => {
      const sanitized = url.trim().replace(/\/+$/, '');
      localStorage.setItem(APP_CONFIG.storageKeys.apiBaseUrl, sanitized);
      set({ apiBaseUrl: sanitized, backendStatus: 'checking' });
    },

    setBackendStatus: (status: BackendStatus) => {
      set({ backendStatus: status, lastCheckedAt: new Date().toISOString() });
    },

    setServerInfo: (info) => {
      set({ serverInfo: info });
    },

    toggleSidebar: () => {
      set((state) => {
        const next = !state.isSidebarCollapsed;
        localStorage.setItem(
          APP_CONFIG.storageKeys.sidebarCollapsed,
          String(next),
        );
        return { isSidebarCollapsed: next };
      });
    },

    openCommandPalette: () => set({ isCommandPaletteOpen: true }),
    closeCommandPalette: () => set({ isCommandPaletteOpen: false }),
    toggleCommandPalette: () =>
      set((state) => ({ isCommandPaletteOpen: !state.isCommandPaletteOpen })),
  };
});
