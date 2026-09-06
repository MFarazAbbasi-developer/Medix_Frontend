import { useAuthStore } from '../store/authStore';

export function usePermission() {
  const user = useAuthStore((state) => state.user);

  const roles = user?.roles || [];
  const permissions = user?.permissions || [];
  const isAdmin = roles.includes('ADMIN');

  /**
   * Checks if the active user possesses a specific permission (or is Admin).
   */
  const hasPermission = (permission: string): boolean => {
    if (isAdmin) return true;
    return permissions.includes(permission);
  };

  /**
   * Checks if the active user possesses at least one of the provided permissions.
   */
  const hasAnyPermission = (requiredPermissions: string[]): boolean => {
    if (isAdmin) return true;
    return requiredPermissions.some((perm) => permissions.includes(perm));
  };

  /**
   * Checks if the active user belongs to a specific role.
   */
  const hasRole = (role: string): boolean => {
    return roles.includes(role);
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasRole,
    permissions,
    roles,
    isAdmin,
  };
}
