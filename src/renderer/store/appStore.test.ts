import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from './appStore';

describe('useAppStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useAppStore.setState({
      apiBaseUrl: 'http://localhost:3000/api/v1',
      backendStatus: 'checking',
      serverInfo: null,
      isSidebarCollapsed: false,
    });
  });

  it('should initialize with default values', () => {
    const state = useAppStore.getState();
    expect(state.apiBaseUrl).toBe('http://localhost:3000/api/v1');
    expect(state.backendStatus).toBe('checking');
    expect(state.isSidebarCollapsed).toBe(false);
  });

  it('should update apiBaseUrl and sanitize trailing slashes', () => {
    useAppStore.getState().setApiBaseUrl('http://192.168.1.100:3000/api/v1///');
    const state = useAppStore.getState();
    expect(state.apiBaseUrl).toBe('http://192.168.1.100:3000/api/v1');
    expect(state.backendStatus).toBe('checking');
  });

  it('should toggle sidebar collapsed state', () => {
    expect(useAppStore.getState().isSidebarCollapsed).toBe(false);
    useAppStore.getState().toggleSidebar();
    expect(useAppStore.getState().isSidebarCollapsed).toBe(true);
    useAppStore.getState().toggleSidebar();
    expect(useAppStore.getState().isSidebarCollapsed).toBe(false);
  });
});
