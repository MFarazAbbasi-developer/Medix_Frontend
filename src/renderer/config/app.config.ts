export const APP_CONFIG = {
  appName: 'Medix by FARMAX',
  appSubtitle: 'Pharmaceutical Distribution System',
  version: '0.1.0',
  company: 'Farmax Software Solutions',
  defaultApiBaseUrl:
    (import.meta.env.VITE_API_BASE_URL as string) ||
    'http://localhost:3000/api/v1',
  storageKeys: {
    apiBaseUrl: 'medix_api_base_url',
    sidebarCollapsed: 'medix_sidebar_collapsed',
  },
} as const;
