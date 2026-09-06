import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePermission } from './usePermission';
import { useAuthStore } from '../store/authStore';

describe('usePermission', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null });
  });

  it('should grant all permissions when user has ADMIN role', () => {
    useAuthStore.setState({
      user: {
        id: 'u1',
        username: 'admin',
        displayName: 'Administrator',
        roles: ['ADMIN'],
        permissions: [],
      },
    });

    const { result } = renderHook(() => usePermission());

    expect(result.current.isAdmin).toBe(true);
    expect(result.current.hasPermission('sales.create')).toBe(true);
    expect(result.current.hasPermission('inventory.adjust')).toBe(true);
    expect(result.current.hasRole('ADMIN')).toBe(true);
  });

  it('should correctly check granular permissions for non-admin user', () => {
    useAuthStore.setState({
      user: {
        id: 'u2',
        username: 'operator',
        displayName: 'Operator User',
        roles: ['OPERATOR'],
        permissions: ['dashboard.view', 'sales.view', 'sales.create'],
      },
    });

    const { result } = renderHook(() => usePermission());

    expect(result.current.isAdmin).toBe(false);
    expect(result.current.hasPermission('sales.create')).toBe(true);
    expect(result.current.hasPermission('sales.view')).toBe(true);
    expect(result.current.hasPermission('sales.cancel')).toBe(false);
    expect(result.current.hasPermission('settings.manage')).toBe(false);
    expect(result.current.hasAnyPermission(['sales.cancel', 'sales.create'])).toBe(true);
    expect(result.current.hasRole('OPERATOR')).toBe(true);
  });
});
