import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Shield,
  Database,
  FileSpreadsheet,
  History,
  Info,
  Search,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  KeyRound,
  UserCheck,
  UserX,
  Edit2,
  Trash2,
  Download,
  Check,
  Eye,
  Wifi,
  WifiOff,
  Server,
  Lock,
} from 'lucide-react';
import {
  adminApi,
  AdminUser,
  AdminRole,
  PermissionGroup,
  BackupRecord,
  SystemInfoResponse,
  auditApi,
  AuditLogItem,
} from '../api';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

type TabType = 'users' | 'roles' | 'backup' | 'export' | 'audit' | 'system';

export const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [loading, setLoading] = useState<boolean>(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const showNotification = (
    message: string,
    type: 'success' | 'error' | 'info' = 'success',
  ) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    description: React.ReactNode;
    confirmText?: string;
    variant?: 'primary' | 'danger' | 'warning';
    onConfirm: () => Promise<void> | void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  // -------------------------------------------------------------
  // 1. Users Tab State
  // -------------------------------------------------------------
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersSearch, setUsersSearch] = useState<string>('');
  const [usersStatusFilter, setUsersStatusFilter] = useState<string>('all');
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [isViewPermissionsModalOpen, setIsViewPermissionsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  // User Form states
  const [userFormData, setUserFormData] = useState({
    username: '',
    password: '',
    displayName: '',
    roleIds: [] as string[],
  });
  const [newPassword, setNewPassword] = useState('');

  // -------------------------------------------------------------
  // 2. Roles & Permissions Tab State
  // -------------------------------------------------------------
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>([]);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<AdminRole | null>(null);
  const [roleFormData, setRoleFormData] = useState({
    name: '',
    description: '',
    permissionCodes: [] as string[],
  });

  // -------------------------------------------------------------
  // 3. Backup & Restore Tab State
  // -------------------------------------------------------------
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [backupDir, setBackupDir] = useState<string>('');
  const [backupLabel, setBackupLabel] = useState<string>('');
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [selectedBackupForRestore, setSelectedBackupForRestore] =
    useState<BackupRecord | null>(null);
  const [restoreConfirmInput, setRestoreConfirmInput] = useState<string>('');
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoringBackup, setIsRestoringBackup] = useState(false);

  // -------------------------------------------------------------
  // 4. Data Export Tab State
  // -------------------------------------------------------------
  const [exportDataset, setExportDataset] = useState<
    | 'products'
    | 'batches'
    | 'customers'
    | 'suppliers'
    | 'sales_invoices'
    | 'purchases'
    | 'payments'
    | 'returns'
    | 'stock'
    | 'stock_movements'
  >('products');
  const [exportStartDate, setExportStartDate] = useState<string>('');
  const [exportEndDate, setExportEndDate] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);

  // -------------------------------------------------------------
  // 5. Audit Trail Tab State
  // -------------------------------------------------------------
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [auditSearch, setAuditSearch] = useState('');
  const [auditEntity, setAuditEntity] = useState('');
  const [auditAction, setAuditAction] = useState('');
  const [auditStartDate, setAuditStartDate] = useState('');
  const [auditEndDate, setAuditEndDate] = useState('');
  const [auditTotal, setAuditTotal] = useState(0);
  const [selectedAuditLog, setSelectedAuditLog] = useState<AuditLogItem | null>(null);

  // -------------------------------------------------------------
  // 6. System Information & Connection State
  // -------------------------------------------------------------
  const [systemInfo, setSystemInfo] = useState<SystemInfoResponse | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<
    'connected' | 'connecting' | 'disconnected' | 'unavailable'
  >('connected');
  const [connectionLatency, setConnectionLatency] = useState<number | null>(null);

  // -------------------------------------------------------------
  // Data Fetching Methods
  // -------------------------------------------------------------
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (usersSearch) params.search = usersSearch;
      if (usersStatusFilter === 'active') params.isActive = true;
      if (usersStatusFilter === 'disabled') params.isActive = false;

      const data = await adminApi.listUsers(params);
      setUsers(data.items);
    } catch (err: any) {
      showNotification(err.message || 'Failed to fetch users', 'error');
    } finally {
      setLoading(false);
    }
  }, [usersSearch, usersStatusFilter]);

  const fetchRolesAndMatrix = useCallback(async () => {
    try {
      setLoading(true);
      const matrix = await adminApi.getPermissionsMatrix();
      setPermissionGroups(matrix.groups);
      const rolesList = await adminApi.listRoles();
      setRoles(rolesList as any);
    } catch (err: any) {
      showNotification(err.message || 'Failed to fetch roles', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBackups = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminApi.listBackups();
      setBackups(res.items);
      setBackupDir(res.backupDirectory);
    } catch (err: any) {
      showNotification(err.message || 'Failed to fetch backup history', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAuditLogs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await auditApi.getLogs({
        search: auditSearch || undefined,
        entity: auditEntity || undefined,
        action: auditAction || undefined,
        startDate: auditStartDate || undefined,
        endDate: auditEndDate || undefined,
        limit: 100,
      });
      setAuditLogs(res.items);
      setAuditTotal(res.meta.total);
    } catch (err: any) {
      showNotification(err.message || 'Failed to fetch audit logs', 'error');
    } finally {
      setLoading(false);
    }
  }, [auditSearch, auditEntity, auditAction, auditStartDate, auditEndDate]);

  const fetchSystemInfo = useCallback(async () => {
    const startTime = Date.now();
    try {
      setConnectionStatus('connecting');
      const info = await adminApi.getSystemInfo();
      setSystemInfo(info);
      setConnectionLatency(Date.now() - startTime);
      setConnectionStatus('connected');
    } catch {
      setConnectionStatus('unavailable');
      setConnectionLatency(null);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
      fetchRolesAndMatrix();
    } else if (activeTab === 'roles') {
      fetchRolesAndMatrix();
    } else if (activeTab === 'backup') {
      fetchBackups();
    } else if (activeTab === 'audit') {
      fetchAuditLogs();
    } else if (activeTab === 'system') {
      fetchSystemInfo();
    }
  }, [
    activeTab,
    fetchUsers,
    fetchRolesAndMatrix,
    fetchBackups,
    fetchAuditLogs,
    fetchSystemInfo,
  ]);

  // -------------------------------------------------------------
  // User Actions
  // -------------------------------------------------------------
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFormData.username || !userFormData.password || !userFormData.displayName) {
      showNotification('Please fill in all required fields', 'error');
      return;
    }
    try {
      await adminApi.createUser({
        username: userFormData.username,
        password: userFormData.password,
        displayName: userFormData.displayName,
        roleIds: userFormData.roleIds,
      });
      showNotification(`User "${userFormData.username}" created successfully`);
      setIsCreateUserModalOpen(false);
      setUserFormData({ username: '', password: '', displayName: '', roleIds: [] });
      fetchUsers();
    } catch (err: any) {
      showNotification(err.message || 'Failed to create user', 'error');
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      await adminApi.updateUser(selectedUser.id, {
        displayName: userFormData.displayName,
        roleIds: userFormData.roleIds,
      });
      showNotification(`User "${selectedUser.username}" updated successfully`);
      setIsEditUserModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      showNotification(err.message || 'Failed to update user', 'error');
    }
  };

  const handleToggleUserStatus = (user: AdminUser) => {
    const nextStatus = !user.isActive;
    const confirmMessage = nextStatus
      ? `Activate user account "${user.username}"?`
      : `Deactivate user account "${user.username}"? Active sessions will be terminated.`;

    setConfirmConfig({
      isOpen: true,
      title: `${nextStatus ? 'Activate' : 'Deactivate'} User Account`,
      description: confirmMessage,
      confirmText: nextStatus ? 'Activate User' : 'Deactivate User',
      variant: nextStatus ? 'primary' : 'danger',
      onConfirm: async () => {
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        try {
          await adminApi.setUserStatus(user.id, nextStatus);
          showNotification(
            `User "${user.username}" ${nextStatus ? 'activated' : 'deactivated'} successfully`,
          );
          fetchUsers();
        } catch (err: any) {
          showNotification(err.message || 'Failed to change user status', 'error');
        }
      },
    });
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !newPassword || newPassword.length < 6) {
      showNotification('New password must be at least 6 characters long', 'error');
      return;
    }
    try {
      const res = await adminApi.resetPassword(selectedUser.id, newPassword);
      showNotification(res.message || 'Password reset successfully');
      setIsResetPasswordModalOpen(false);
      setNewPassword('');
    } catch (err: any) {
      showNotification(err.message || 'Failed to reset password', 'error');
    }
  };

  const openViewPermissions = async (user: AdminUser) => {
    try {
      const fullUser = await adminApi.getUserById(user.id);
      setSelectedUser(fullUser);
      setIsViewPermissionsModalOpen(true);
    } catch (err: any) {
      showNotification(err.message || 'Failed to load user permissions', 'error');
    }
  };

  // -------------------------------------------------------------
  // Role Actions
  // -------------------------------------------------------------
  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleFormData.name) {
      showNotification('Role name is required', 'error');
      return;
    }

    try {
      if (editingRole) {
        await adminApi.updateRole(editingRole.id, {
          name: roleFormData.name,
          description: roleFormData.description,
          permissionCodes: roleFormData.permissionCodes,
        });
        showNotification(`Role "${roleFormData.name}" updated successfully`);
      } else {
        await adminApi.createRole({
          name: roleFormData.name,
          description: roleFormData.description,
          permissionCodes: roleFormData.permissionCodes,
        });
        showNotification(`Role "${roleFormData.name}" created successfully`);
      }
      setIsRoleModalOpen(false);
      setEditingRole(null);
      fetchRolesAndMatrix();
    } catch (err: any) {
      showNotification(err.message || 'Failed to save role', 'error');
    }
  };

  const handleDeleteRole = (role: AdminRole) => {
    if (role.isSystem) {
      showNotification('System roles cannot be deleted', 'error');
      return;
    }

    setConfirmConfig({
      isOpen: true,
      title: `Delete Role "${role.name}"`,
      description: `Are you sure you want to delete role "${role.name}"? This action cannot be undone.`,
      confirmText: 'Delete Role',
      variant: 'danger',
      onConfirm: async () => {
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        try {
          await adminApi.deleteRole(role.id);
          showNotification(`Role "${role.name}" deleted successfully`);
          fetchRolesAndMatrix();
        } catch (err: any) {
          showNotification(err.message || 'Failed to delete role', 'error');
        }
      },
    });
  };

  const togglePermissionCode = (code: string) => {
    setRoleFormData((prev) => {
      const exists = prev.permissionCodes.includes(code);
      return {
        ...prev,
        permissionCodes: exists
          ? prev.permissionCodes.filter((c) => c !== code)
          : [...prev.permissionCodes, code],
      };
    });
  };

  const toggleAllModulePermissions = (group: PermissionGroup) => {
    const codesInGroup = group.permissions.map((p) => p.code);
    const allSelected = codesInGroup.every((c) =>
      roleFormData.permissionCodes.includes(c),
    );

    setRoleFormData((prev) => {
      if (allSelected) {
        return {
          ...prev,
          permissionCodes: prev.permissionCodes.filter(
            (c) => !codesInGroup.includes(c),
          ),
        };
      } else {
        const union = Array.from(
          new Set([...prev.permissionCodes, ...codesInGroup]),
        );
        return {
          ...prev,
          permissionCodes: union,
        };
      }
    });
  };

  // -------------------------------------------------------------
  // Backup & Restore Actions
  // -------------------------------------------------------------
  const handleCreateBackup = async () => {
    try {
      setIsCreatingBackup(true);
      const record = await adminApi.createBackup({
        label: backupLabel.trim() || undefined,
      });
      showNotification(
        `Database backup created successfully: ${record.filename}`,
        'success',
      );
      setBackupLabel('');
      fetchBackups();
    } catch (err: any) {
      showNotification(err.message || 'Failed to generate backup', 'error');
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleValidateBackup = async (filename: string) => {
    try {
      const res = await adminApi.validateBackup(filename);
      if (res.isValid) {
        showNotification(
          `Backup verified valid (${(res.sizeBytes / 1024 / 1024).toFixed(2)} MB). Checksum: ${res.checksum.slice(0, 16)}...`,
          'success',
        );
      }
    } catch (err: any) {
      showNotification(err.message || 'Backup validation failed', 'error');
    }
  };

  const handleExecuteRestore = async () => {
    if (!selectedBackupForRestore) return;
    if (restoreConfirmInput !== 'CONFIRM_RESTORE') {
      showNotification('You must type "CONFIRM_RESTORE" exactly', 'error');
      return;
    }

    try {
      setIsRestoringBackup(true);
      const res = await adminApi.restoreBackup(
        selectedBackupForRestore.filename,
        'CONFIRM_RESTORE',
      );
      showNotification(
        `Database restored successfully! Safety backup saved as: ${res.safetyBackup}`,
        'success',
      );
      setIsRestoreModalOpen(false);
      setSelectedBackupForRestore(null);
      setRestoreConfirmInput('');
      fetchBackups();
    } catch (err: any) {
      showNotification(err.message || 'Database restore failed', 'error');
    } finally {
      setIsRestoringBackup(false);
    }
  };

  // -------------------------------------------------------------
  // Data Export Action
  // -------------------------------------------------------------
  const handleExportCsv = async () => {
    try {
      setIsExporting(true);
      const csvData = await adminApi.exportDataset({
        dataset: exportDataset,
        startDate: exportStartDate || undefined,
        endDate: exportEndDate || undefined,
      });

      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `medix_${exportDataset}_${new Date().toISOString().slice(0, 10)}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showNotification(`Dataset "${exportDataset}" exported to CSV successfully`);
    } catch (err: any) {
      showNotification(err.message || 'CSV Export failed', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface-bg text-surface-text-primary">
      {/* Top Header */}
      <header className="px-6 py-4 border-b border-surface-border bg-surface-card flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-surface-text-primary flex items-center gap-2">
            <Shield className="w-5 h-5 text-accent-primary" />
            System Administration & Reliability
          </h1>
          <p className="text-xs text-surface-text-secondary mt-0.5">
            User security, role-based access control, local database snapshots, data export & system diagnostics
          </p>
        </div>

        {/* Global Connection / LAN Status Indicator */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchSystemInfo}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded border border-surface-border bg-surface-bg hover:bg-surface-border text-surface-text-primary transition-colors"
            title="Check connection & server latency"
          >
            {connectionStatus === 'connected' ? (
              <Wifi className="w-3.5 h-3.5 text-emerald-600" />
            ) : connectionStatus === 'connecting' ? (
              <RefreshCw className="w-3.5 h-3.5 text-amber-500 animate-spin" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-red-600" />
            )}
            <span className="capitalize">{connectionStatus}</span>
            {connectionLatency !== null && (
              <span className="text-[10px] text-surface-text-muted">
                ({connectionLatency}ms)
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Toast Notification */}
      {notification && (
        <div
          className={`mx-6 mt-3 px-4 py-2.5 rounded text-xs font-medium flex items-center justify-between shadow-sm border ${
            notification.type === 'error'
              ? 'bg-red-50 text-red-800 border-red-200'
              : notification.type === 'info'
                ? 'bg-blue-50 text-blue-800 border-blue-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-surface-text-muted hover:text-surface-text-primary ml-4"
          >
            &times;
          </button>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="px-6 border-b border-surface-border bg-surface-card flex gap-1 overflow-x-auto select-none">
        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'users'
              ? 'border-accent-primary text-accent-primary'
              : 'border-transparent text-surface-text-secondary hover:text-surface-text-primary'
          }`}
        >
          <Users className="w-4 h-4" />
          User Management
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('roles')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'roles'
              ? 'border-accent-primary text-accent-primary'
              : 'border-transparent text-surface-text-secondary hover:text-surface-text-primary'
          }`}
        >
          <Shield className="w-4 h-4" />
          Roles & Permissions
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('backup')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'backup'
              ? 'border-accent-primary text-accent-primary'
              : 'border-transparent text-surface-text-secondary hover:text-surface-text-primary'
          }`}
        >
          <Database className="w-4 h-4" />
          Database Backup & Restore
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('export')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'export'
              ? 'border-accent-primary text-accent-primary'
              : 'border-transparent text-surface-text-secondary hover:text-surface-text-primary'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          Data Export
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'audit'
              ? 'border-accent-primary text-accent-primary'
              : 'border-transparent text-surface-text-secondary hover:text-surface-text-primary'
          }`}
        >
          <History className="w-4 h-4" />
          Audit Trail
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('system')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'system'
              ? 'border-accent-primary text-accent-primary'
              : 'border-transparent text-surface-text-secondary hover:text-surface-text-primary'
          }`}
        >
          <Info className="w-4 h-4" />
          System Information & LAN
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {/* ======================================================== */}
        {/* TAB 1: USER MANAGEMENT */}
        {/* ======================================================== */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-surface-card p-3 rounded-lg border border-surface-border">
              <div className="flex items-center gap-2 flex-1 min-w-[280px]">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-surface-text-muted" />
                  <input
                    type="text"
                    placeholder="Search users by username or display name..."
                    value={usersSearch}
                    onChange={(e) => setUsersSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded border border-surface-border bg-surface-bg text-surface-text-primary focus:outline-none focus:border-accent-primary"
                  />
                </div>
                <select
                  value={usersStatusFilter}
                  onChange={(e) => setUsersStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs rounded border border-surface-border bg-surface-bg text-surface-text-primary"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active Only</option>
                  <option value="disabled">Disabled Only</option>
                </select>
                <button
                  type="button"
                  onClick={fetchUsers}
                  className="p-1.5 text-surface-text-secondary hover:text-surface-text-primary border border-surface-border rounded bg-surface-bg hover:bg-surface-border transition-colors"
                  title="Refresh User List"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setUserFormData({ username: '', password: '', displayName: '', roleIds: [] });
                  setIsCreateUserModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-accent-primary text-white hover:bg-accent-hover transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                New User Account
              </button>
            </div>

            {/* Users Table */}
            <div className="border border-surface-border rounded-lg bg-surface-card overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-surface-bg border-b border-surface-border text-surface-text-secondary font-semibold">
                    <th className="py-2.5 px-3">Username</th>
                    <th className="py-2.5 px-3">Display Name</th>
                    <th className="py-2.5 px-3">Assigned Roles</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Last Login</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-surface-text-muted">
                        No user accounts found matching criteria.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.id} className="hover:bg-surface-bg/50 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-surface-text-primary">
                          {u.username}
                        </td>
                        <td className="py-2.5 px-3 text-surface-text-primary">
                          {u.displayName}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex flex-wrap gap-1">
                            {u.roles && u.roles.length > 0 ? (
                              u.roles.map((r) => (
                                <span
                                  key={r.id}
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                    r.name === 'ADMIN'
                                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                      : 'bg-surface-border text-surface-text-secondary'
                                  }`}
                                >
                                  {r.name}
                                </span>
                              ))
                            ) : (
                              <span className="text-surface-text-muted italic text-[11px]">
                                No roles assigned
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          {u.isActive ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-800 border border-red-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                              Disabled
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-surface-text-muted">
                          {u.lastLoginAt
                            ? new Date(u.lastLoginAt).toLocaleString()
                            : 'Never logged in'}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => openViewPermissions(u)}
                              className="p-1 rounded text-surface-text-secondary hover:text-surface-text-primary hover:bg-surface-border"
                              title="View Effective Permissions"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedUser(u);
                                setUserFormData({
                                  username: u.username,
                                  password: '',
                                  displayName: u.displayName,
                                  roleIds: u.roles ? u.roles.map((r) => r.id) : [],
                                });
                                setIsEditUserModalOpen(true);
                              }}
                              className="p-1 rounded text-surface-text-secondary hover:text-surface-text-primary hover:bg-surface-border"
                              title="Edit User Details & Roles"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedUser(u);
                                setNewPassword('');
                                setIsResetPasswordModalOpen(true);
                              }}
                              className="p-1 rounded text-amber-700 hover:text-amber-900 hover:bg-amber-50"
                              title="Change / Reset Password"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleUserStatus(u)}
                              className={`p-1 rounded ${
                                u.isActive
                                  ? 'text-red-700 hover:text-red-900 hover:bg-red-50'
                                  : 'text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50'
                              }`}
                              title={u.isActive ? 'Deactivate User' : 'Activate User'}
                            >
                              {u.isActive ? (
                                <UserX className="w-3.5 h-3.5" />
                              ) : (
                                <UserCheck className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: ROLES & PERMISSIONS */}
        {/* ======================================================== */}
        {activeTab === 'roles' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-surface-card p-3 rounded-lg border border-surface-border">
              <div>
                <h2 className="text-sm font-bold text-surface-text-primary">
                  Configured Roles & Permission Assignments
                </h2>
                <p className="text-xs text-surface-text-secondary">
                  Manage role authorities and inspect the module permission matrix
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingRole(null);
                  setRoleFormData({ name: '', description: '', permissionCodes: [] });
                  setIsRoleModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-accent-primary text-white hover:bg-accent-hover transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Create Role
              </button>
            </div>

            {/* Role Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {roles.map((r) => (
                <div
                  key={r.id}
                  className="bg-surface-card border border-surface-border rounded-lg p-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <h3 className="text-sm font-bold text-surface-text-primary flex items-center gap-1.5">
                        {r.name}
                        {r.isSystem && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                            SYSTEM
                          </span>
                        )}
                      </h3>
                      <span className="text-[11px] text-surface-text-muted font-medium">
                        {r.usersCount} user(s)
                      </span>
                    </div>
                    <p className="text-xs text-surface-text-secondary mb-3 min-h-[32px]">
                      {r.description || 'No description provided for this role.'}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-surface-border flex items-center justify-between">
                    <span className="text-[11px] text-surface-text-muted">
                      {r.permissionsCount || (Array.isArray(r.permissions) ? r.permissions.length : 0)} permission(s)
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingRole(r);
                          const activeCodes = Array.isArray(r.permissions)
                            ? r.permissions.map((p: any) =>
                                typeof p === 'string' ? p : p.code,
                              )
                            : [];
                          setRoleFormData({
                            name: r.name,
                            description: r.description || '',
                            permissionCodes: activeCodes,
                          });
                          setIsRoleModalOpen(true);
                        }}
                        className="px-2 py-1 text-xs font-medium rounded border border-surface-border hover:bg-surface-border text-surface-text-primary"
                      >
                        Configure
                      </button>

                      {!r.isSystem && (
                        <button
                          type="button"
                          onClick={() => handleDeleteRole(r)}
                          className="p-1 rounded text-red-600 hover:bg-red-50"
                          title="Delete Role"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: DATABASE BACKUP & RESTORE */}
        {/* ======================================================== */}
        {activeTab === 'backup' && (
          <div className="space-y-6">
            {/* Backup Creation Box */}
            <div className="bg-surface-card p-4 rounded-lg border border-surface-border">
              <h2 className="text-sm font-bold text-surface-text-primary mb-1 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-accent-primary" />
                Local PostgreSQL Database Snapshot
              </h2>
              <p className="text-xs text-surface-text-secondary mb-4">
                Creates a timestamped, native PostgreSQL binary archive (`.dump`) into the local backup storage repository.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[240px]">
                  <input
                    type="text"
                    placeholder="Optional backup label or note (e.g. pre_upgrade_snapshot)..."
                    value={backupLabel}
                    onChange={(e) => setBackupLabel(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded border border-surface-border bg-surface-bg text-surface-text-primary focus:outline-none focus:border-accent-primary"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleCreateBackup}
                  disabled={isCreatingBackup}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded bg-accent-primary text-white hover:bg-accent-hover transition-colors disabled:opacity-50 shadow-sm"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${isCreatingBackup ? 'animate-spin' : ''}`}
                  />
                  {isCreatingBackup ? 'Generating Backup...' : 'Create Backup Now'}
                </button>
              </div>

              {backupDir && (
                <div className="mt-2 text-[11px] text-surface-text-muted">
                  Storage Directory: <span className="font-mono text-surface-text-secondary">{backupDir}</span>
                </div>
              )}
            </div>

            {/* Backup History Register */}
            <div className="bg-surface-card rounded-lg border border-surface-border overflow-hidden">
              <div className="px-4 py-3 border-b border-surface-border flex items-center justify-between">
                <h3 className="text-xs font-bold text-surface-text-primary uppercase tracking-wider">
                  Backup History & Manifest Register
                </h3>
                <button
                  type="button"
                  onClick={fetchBackups}
                  className="p-1 text-surface-text-secondary hover:text-surface-text-primary"
                  title="Refresh Backup History"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-surface-bg border-b border-surface-border text-surface-text-secondary font-semibold">
                    <th className="py-2.5 px-3">Filename</th>
                    <th className="py-2.5 px-3">Created At</th>
                    <th className="py-2.5 px-3">Size</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Created By</th>
                    <th className="py-2.5 px-3">SHA-256 Checksum</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {backups.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-surface-text-muted">
                        No database backups recorded in manifest yet.
                      </td>
                    </tr>
                  ) : (
                    backups.map((b) => (
                      <tr key={b.id} className="hover:bg-surface-bg/50 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-semibold text-surface-text-primary text-[11px]">
                          {b.filename}
                        </td>
                        <td className="py-2.5 px-3 text-surface-text-muted">
                          {new Date(b.createdAt).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 font-mono">
                          {b.sizeBytes > 0
                            ? `${(b.sizeBytes / 1024 / 1024).toFixed(2)} MB`
                            : '0 KB'}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                              b.status === 'SUCCESS'
                                ? 'bg-emerald-100 text-emerald-800'
                                : b.status === 'RESTORED'
                                  ? 'bg-blue-100 text-blue-800'
                                  : b.status === 'IMPORTED'
                                    ? 'bg-purple-100 text-purple-800'
                                    : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {b.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-surface-text-secondary">
                          {b.createdBy}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[10px] text-surface-text-muted">
                          {b.checksum ? `${b.checksum.slice(0, 14)}...` : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleValidateBackup(b.filename)}
                              className="px-2 py-1 text-[11px] font-medium rounded border border-surface-border bg-surface-bg hover:bg-surface-border text-surface-text-primary"
                              title="Verify backup file presence and structure"
                            >
                              Verify
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedBackupForRestore(b);
                                setRestoreConfirmInput('');
                                setIsRestoreModalOpen(true);
                              }}
                              className="px-2 py-1 text-[11px] font-semibold rounded bg-red-600 text-white hover:bg-red-700"
                              title="Destructive Database Restore"
                            >
                              Restore
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: DATA EXPORT */}
        {/* ======================================================== */}
        {activeTab === 'export' && (
          <div className="space-y-6">
            <div className="bg-surface-card p-4 rounded-lg border border-surface-border">
              <h2 className="text-sm font-bold text-surface-text-primary mb-1 flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-accent-primary" />
                Controlled Business Data Export (CSV)
              </h2>
              <p className="text-xs text-surface-text-secondary mb-4">
                Export operational datasets in standard RFC 4180 CSV format for reporting, audits, or external analysis.
              </p>

              {/* Notice Banner */}
              <div className="mb-4 p-3 rounded bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Notice:</span> Business data exports are analytical snapshots and <strong>NOT</strong> database backups. Sensitive credentials, security tokens, and password hashes are strictly redacted.
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-surface-text-secondary mb-1">
                    Select Dataset
                  </label>
                  <select
                    value={exportDataset}
                    onChange={(e: any) => setExportDataset(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded border border-surface-border bg-surface-bg text-surface-text-primary focus:outline-none focus:border-accent-primary"
                  >
                    <option value="products">Products Master Catalog</option>
                    <option value="batches">Batches & Expiry Dates</option>
                    <option value="customers">Customers Directory</option>
                    <option value="suppliers">Suppliers & Vendors</option>
                    <option value="sales_invoices">Sales Invoices Register</option>
                    <option value="purchases">Purchases & GRNs</option>
                    <option value="payments">Financial Payments & Receipts</option>
                    <option value="returns">Sales & Purchase Returns</option>
                    <option value="stock">Warehouse Stock Valuation</option>
                    <option value="stock_movements">Stock Ledger Movements</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-surface-text-secondary mb-1">
                    Start Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={exportStartDate}
                    onChange={(e) => setExportStartDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded border border-surface-border bg-surface-bg text-surface-text-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-surface-text-secondary mb-1">
                    End Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={exportEndDate}
                    onChange={(e) => setExportEndDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded border border-surface-border bg-surface-bg text-surface-text-primary"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleExportCsv}
                disabled={isExporting}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded bg-accent-primary text-white hover:bg-accent-hover transition-colors disabled:opacity-50 shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                {isExporting ? 'Generating CSV...' : 'Download CSV Dataset'}
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 5: AUDIT TRAIL */}
        {/* ======================================================== */}
        {activeTab === 'audit' && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="bg-surface-card p-3 rounded-lg border border-surface-border flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[200px] relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-surface-text-muted" />
                <input
                  type="text"
                  placeholder="Search audit actions, entities, usernames..."
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded border border-surface-border bg-surface-bg text-surface-text-primary"
                />
              </div>

              <input
                type="text"
                placeholder="Filter Entity..."
                value={auditEntity}
                onChange={(e) => setAuditEntity(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded border border-surface-border bg-surface-bg text-surface-text-primary w-28"
              />

              <input
                type="text"
                placeholder="Filter Action..."
                value={auditAction}
                onChange={(e) => setAuditAction(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded border border-surface-border bg-surface-bg text-surface-text-primary w-28"
              />

              <input
                type="date"
                value={auditStartDate}
                onChange={(e) => setAuditStartDate(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded border border-surface-border bg-surface-bg text-surface-text-primary"
                title="Start Date"
              />

              <input
                type="date"
                value={auditEndDate}
                onChange={(e) => setAuditEndDate(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded border border-surface-border bg-surface-bg text-surface-text-primary"
                title="End Date"
              />

              <button
                type="button"
                onClick={fetchAuditLogs}
                className="px-3 py-1.5 text-xs font-semibold rounded bg-surface-border text-surface-text-primary hover:bg-surface-border/80 transition-colors"
              >
                Apply Filters
              </button>
            </div>

            {/* Audit Logs Table */}
            <div className="border border-surface-border rounded-lg bg-surface-card overflow-hidden">
              <div className="px-4 py-2 bg-surface-bg border-b border-surface-border flex items-center justify-between text-xs text-surface-text-secondary">
                <span>Total Audit Entries: <strong>{auditTotal}</strong></span>
              </div>

              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-surface-bg border-b border-surface-border text-surface-text-secondary font-semibold">
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">User</th>
                    <th className="py-2.5 px-3">Action</th>
                    <th className="py-2.5 px-3">Entity</th>
                    <th className="py-2.5 px-3">Entity ID</th>
                    <th className="py-2.5 px-3 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-surface-text-muted">
                        No audit records found matching filters.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-surface-bg/50 transition-colors">
                        <td className="py-2 px-3 text-surface-text-muted font-mono text-[11px]">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="py-2 px-3 font-medium text-surface-text-primary">
                          {log.user ? log.user.username : 'SYSTEM'}
                        </td>
                        <td className="py-2 px-3">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-surface-border text-surface-text-primary">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-semibold text-surface-text-secondary">
                          {log.entity}
                        </td>
                        <td className="py-2 px-3 font-mono text-[11px] text-surface-text-muted">
                          {log.entityId || '-'}
                        </td>
                        <td className="py-2 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedAuditLog(log)}
                            className="px-2 py-0.5 text-[11px] font-medium rounded border border-surface-border hover:bg-surface-border text-surface-text-primary"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 6: SYSTEM INFORMATION & LAN DIAGNOSTICS */}
        {/* ======================================================== */}
        {activeTab === 'system' && systemInfo && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Application Details */}
              <div className="bg-surface-card p-4 rounded-lg border border-surface-border space-y-2">
                <h3 className="text-xs font-bold text-surface-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-accent-primary" />
                  Application Runtime
                </h3>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between py-1 border-b border-surface-border">
                    <span className="text-surface-text-muted">Name</span>
                    <span className="font-semibold">{systemInfo.application.name}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-surface-border">
                    <span className="text-surface-text-muted">Version</span>
                    <span className="font-mono">{systemInfo.application.version}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-surface-border">
                    <span className="text-surface-text-muted">Node.js</span>
                    <span className="font-mono">{systemInfo.application.nodeVersion}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-surface-border">
                    <span className="text-surface-text-muted">Platform</span>
                    <span className="capitalize">{systemInfo.application.platform} ({systemInfo.application.arch})</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-surface-text-muted">Uptime</span>
                    <span>{Math.floor(systemInfo.server.uptimeSeconds / 60)} minutes</span>
                  </div>
                </div>
              </div>

              {/* Database Status */}
              <div className="bg-surface-card p-4 rounded-lg border border-surface-border space-y-2">
                <h3 className="text-xs font-bold text-surface-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-emerald-600" />
                  Database Health & Engine
                </h3>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between py-1 border-b border-surface-border">
                    <span className="text-surface-text-muted">Status</span>
                    <span className="font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                      {systemInfo.database.status}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-surface-border">
                    <span className="text-surface-text-muted">Engine</span>
                    <span>{systemInfo.database.engine}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-surface-border">
                    <span className="text-surface-text-muted">Products / Batches</span>
                    <span className="font-mono font-semibold">
                      {systemInfo.database.stats.productsCount} / {systemInfo.database.stats.batchesCount}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-surface-border">
                    <span className="text-surface-text-muted">Sales Invoices</span>
                    <span className="font-mono font-semibold">
                      {systemInfo.database.stats.invoicesCount}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-surface-text-muted">Audit Records</span>
                    <span className="font-mono font-semibold">
                      {systemInfo.database.stats.auditLogsCount}
                    </span>
                  </div>
                </div>
              </div>

              {/* Deployment Profile */}
              <div className="bg-surface-card p-4 rounded-lg border border-surface-border space-y-2">
                <h3 className="text-xs font-bold text-surface-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-accent-primary" />
                  Organization & Security
                </h3>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between py-1 border-b border-surface-border">
                    <span className="text-surface-text-muted">Organization</span>
                    <span className="font-semibold">
                      {systemInfo.deployment.organization?.name || 'Farmax Pharma'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-surface-border">
                    <span className="text-surface-text-muted">Drug License</span>
                    <span className="font-mono">
                      {systemInfo.deployment.organization?.drugLicense || 'DL-PK-2026'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-surface-border">
                    <span className="text-surface-text-muted">Active Branches</span>
                    <span>{systemInfo.deployment.branches.length} configured</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-surface-text-muted">Server Time</span>
                    <span className="font-mono text-[11px]">
                      {new Date(systemInfo.server.serverTime).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* MODAL: CREATE USER */}
      {/* ======================================================== */}
      {isCreateUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-surface-card border border-surface-border rounded-lg max-w-md w-full p-5 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <h3 className="text-sm font-bold text-surface-text-primary">
                Create User Account
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateUserModalOpen(false)}
                className="text-surface-text-muted hover:text-surface-text-primary"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-surface-text-secondary mb-1">
                  Username *
                </label>
                <input
                  type="text"
                  required
                  value={userFormData.username}
                  onChange={(e) =>
                    setUserFormData({ ...userFormData, username: e.target.value })
                  }
                  className="w-full px-3 py-1.5 rounded border border-surface-border bg-surface-bg text-surface-text-primary"
                  placeholder="e.g. jdoe"
                />
              </div>

              <div>
                <label className="block font-semibold text-surface-text-secondary mb-1">
                  Full Display Name *
                </label>
                <input
                  type="text"
                  required
                  value={userFormData.displayName}
                  onChange={(e) =>
                    setUserFormData({
                      ...userFormData,
                      displayName: e.target.value,
                    })
                  }
                  className="w-full px-3 py-1.5 rounded border border-surface-border bg-surface-bg text-surface-text-primary"
                  placeholder="e.g. John Doe"
                />
              </div>

              <div>
                <label className="block font-semibold text-surface-text-secondary mb-1">
                  Initial Password * (min 6 chars, Argon2id)
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={userFormData.password}
                  onChange={(e) =>
                    setUserFormData({ ...userFormData, password: e.target.value })
                  }
                  className="w-full px-3 py-1.5 rounded border border-surface-border bg-surface-bg text-surface-text-primary"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block font-semibold text-surface-text-secondary mb-1">
                  Assign Roles
                </label>
                <div className="space-y-1 max-h-32 overflow-y-auto border border-surface-border rounded p-2 bg-surface-bg">
                  {roles.map((r) => {
                    const isChecked = userFormData.roleIds.includes(r.id);
                    return (
                      <label
                        key={r.id}
                        className="flex items-center gap-2 cursor-pointer hover:bg-surface-card p-1 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            setUserFormData((prev) => ({
                              ...prev,
                              roleIds: isChecked
                                ? prev.roleIds.filter((id) => id !== r.id)
                                : [...prev.roleIds, r.id],
                            }));
                          }}
                          className="rounded text-accent-primary"
                        />
                        <span className="font-medium text-surface-text-primary">
                          {r.name}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-surface-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateUserModalOpen(false)}
                  className="px-3 py-1.5 font-medium rounded border border-surface-border hover:bg-surface-border text-surface-text-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-semibold rounded bg-accent-primary text-white hover:bg-accent-hover transition-colors"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: EDIT USER */}
      {/* ======================================================== */}
      {isEditUserModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-surface-card border border-surface-border rounded-lg max-w-md w-full p-5 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <h3 className="text-sm font-bold text-surface-text-primary">
                Edit User: {selectedUser.username}
              </h3>
              <button
                type="button"
                onClick={() => setIsEditUserModalOpen(false)}
                className="text-surface-text-muted hover:text-surface-text-primary"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-surface-text-secondary mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  required
                  value={userFormData.displayName}
                  onChange={(e) =>
                    setUserFormData({
                      ...userFormData,
                      displayName: e.target.value,
                    })
                  }
                  className="w-full px-3 py-1.5 rounded border border-surface-border bg-surface-bg text-surface-text-primary"
                />
              </div>

              <div>
                <label className="block font-semibold text-surface-text-secondary mb-1">
                  Assign Roles
                </label>
                <div className="space-y-1 max-h-40 overflow-y-auto border border-surface-border rounded p-2 bg-surface-bg">
                  {roles.map((r) => {
                    const isChecked = userFormData.roleIds.includes(r.id);
                    return (
                      <label
                        key={r.id}
                        className="flex items-center gap-2 cursor-pointer hover:bg-surface-card p-1 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            setUserFormData((prev) => ({
                              ...prev,
                              roleIds: isChecked
                                ? prev.roleIds.filter((id) => id !== r.id)
                                : [...prev.roleIds, r.id],
                            }));
                          }}
                          className="rounded text-accent-primary"
                        />
                        <span className="font-medium text-surface-text-primary">
                          {r.name}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-surface-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditUserModalOpen(false)}
                  className="px-3 py-1.5 font-medium rounded border border-surface-border hover:bg-surface-border text-surface-text-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-semibold rounded bg-accent-primary text-white hover:bg-accent-hover transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: RESET PASSWORD */}
      {/* ======================================================== */}
      {isResetPasswordModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-surface-card border border-surface-border rounded-lg max-w-sm w-full p-5 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <h3 className="text-sm font-bold text-surface-text-primary flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-amber-600" />
                Reset Password: {selectedUser.username}
              </h3>
              <button
                type="button"
                onClick={() => setIsResetPasswordModalOpen(false)}
                className="text-surface-text-muted hover:text-surface-text-primary"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-surface-text-secondary">
              Changing this password will immediately revoke all active refresh tokens and sessions for user <strong>{selectedUser.username}</strong>.
            </p>

            <form onSubmit={handleResetPassword} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-surface-text-secondary mb-1">
                  New Password (min 6 characters)
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-1.5 rounded border border-surface-border bg-surface-bg text-surface-text-primary focus:outline-none focus:border-accent-primary"
                  placeholder="••••••••"
                />
              </div>

              <div className="pt-3 border-t border-surface-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsResetPasswordModalOpen(false)}
                  className="px-3 py-1.5 font-medium rounded border border-surface-border hover:bg-surface-border text-surface-text-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-semibold rounded bg-amber-600 text-white hover:bg-amber-700 transition-colors"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: VIEW EFFECTIVE PERMISSIONS */}
      {/* ======================================================== */}
      {isViewPermissionsModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-surface-card border border-surface-border rounded-lg max-w-lg w-full p-5 space-y-4 shadow-lg max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <div>
                <h3 className="text-sm font-bold text-surface-text-primary">
                  Effective Permissions: {selectedUser.username}
                </h3>
                <p className="text-xs text-surface-text-secondary">
                  Derived from {selectedUser.roles?.length || 0} assigned role(s)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsViewPermissionsModalOpen(false)}
                className="text-surface-text-muted hover:text-surface-text-primary"
              >
                &times;
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {selectedUser.permissions && selectedUser.permissions.length > 0 ? (
                <div className="grid grid-cols-2 gap-1.5">
                  {selectedUser.permissions.map((perm) => (
                    <div
                      key={perm}
                      className="px-2 py-1 bg-surface-bg border border-surface-border rounded text-[11px] font-mono text-surface-text-primary flex items-center gap-1.5"
                    >
                      <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span className="truncate">{perm}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-surface-text-muted italic">
                  No active permissions granted for this user account.
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-surface-border flex justify-end">
              <button
                type="button"
                onClick={() => setIsViewPermissionsModalOpen(false)}
                className="px-4 py-1.5 text-xs font-semibold rounded bg-surface-border hover:bg-surface-border/80 text-surface-text-primary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CONFIGURE ROLE & PERMISSIONS MATRIX */}
      {/* ======================================================== */}
      {isRoleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-surface-card border border-surface-border rounded-lg max-w-2xl w-full p-5 space-y-4 shadow-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <h3 className="text-sm font-bold text-surface-text-primary">
                {editingRole ? `Edit Role: ${editingRole.name}` : 'Create New Custom Role'}
              </h3>
              <button
                type="button"
                onClick={() => setIsRoleModalOpen(false)}
                className="text-surface-text-muted hover:text-surface-text-primary"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveRole} className="flex-1 flex flex-col overflow-hidden space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-surface-text-secondary mb-1">
                    Role Name *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={editingRole?.isSystem}
                    value={roleFormData.name}
                    onChange={(e) =>
                      setRoleFormData({ ...roleFormData, name: e.target.value })
                    }
                    className="w-full px-3 py-1.5 rounded border border-surface-border bg-surface-bg text-surface-text-primary uppercase disabled:opacity-50"
                    placeholder="e.g. CASHIER"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-surface-text-secondary mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={roleFormData.description}
                    onChange={(e) =>
                      setRoleFormData({
                        ...roleFormData,
                        description: e.target.value,
                      })
                    }
                    className="w-full px-3 py-1.5 rounded border border-surface-border bg-surface-bg text-surface-text-primary"
                    placeholder="e.g. Front desk POS & customer checkout operator"
                  />
                </div>
              </div>

              {/* Grouped Permissions Matrix */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <label className="block font-semibold text-surface-text-secondary mb-1">
                  Module Permissions Matrix ({roleFormData.permissionCodes.length} selected)
                </label>
                <div className="flex-1 overflow-y-auto border border-surface-border rounded-lg bg-surface-bg p-3 space-y-4">
                  {permissionGroups.map((group) => {
                    const codesInGroup = group.permissions.map((p) => p.code);
                    const selectedCount = codesInGroup.filter((c) =>
                      roleFormData.permissionCodes.includes(c),
                    ).length;

                    return (
                      <div
                        key={group.module}
                        className="bg-surface-card border border-surface-border rounded p-3 space-y-2"
                      >
                        <div className="flex items-center justify-between border-b border-surface-border pb-1.5">
                          <span className="font-bold text-surface-text-primary text-xs">
                            {group.module}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleAllModulePermissions(group)}
                            className="text-[11px] text-accent-primary hover:underline font-semibold"
                          >
                            {selectedCount === codesInGroup.length
                              ? 'Deselect Module'
                              : 'Select All'}
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {group.permissions.map((perm) => {
                            const isChecked = roleFormData.permissionCodes.includes(
                              perm.code,
                            );
                            return (
                              <label
                                key={perm.code}
                                className="flex items-start gap-2 p-1.5 rounded hover:bg-surface-bg cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => togglePermissionCode(perm.code)}
                                  className="mt-0.5 rounded text-accent-primary"
                                />
                                <div>
                                  <div className="font-mono text-[11px] font-semibold text-surface-text-primary">
                                    {perm.code}
                                  </div>
                                  <div className="text-[10px] text-surface-text-muted">
                                    {perm.description}
                                  </div>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-surface-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRoleModalOpen(false)}
                  className="px-3 py-1.5 font-medium rounded border border-surface-border hover:bg-surface-border text-surface-text-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-semibold rounded bg-accent-primary text-white hover:bg-accent-hover transition-colors"
                >
                  Save Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: RESTORE CONFIRMATION SAFEGUARD */}
      {/* ======================================================== */}
      {isRestoreModalOpen && selectedBackupForRestore && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-surface-card border-2 border-red-500 rounded-lg max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-red-600 border-b border-surface-border pb-3">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="text-sm font-bold uppercase tracking-wide">
                Destructive Database Restore Warning
              </h3>
            </div>

            <div className="text-xs text-surface-text-primary space-y-2">
              <p>
                You are about to restore the database from snapshot:
              </p>
              <div className="p-2 bg-surface-bg rounded border border-surface-border font-mono text-[11px] font-bold text-red-700">
                {selectedBackupForRestore.filename}
              </div>
              <p className="text-red-700 font-semibold">
                ⚠️ All transactional records and changes made after this backup was taken will be overwritten.
              </p>
              <p className="text-surface-text-muted text-[11px]">
                A pre-restore safety snapshot will automatically be generated prior to executing the restore.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-surface-text-secondary mb-1">
                Type <span className="font-mono text-red-600">CONFIRM_RESTORE</span> to proceed:
              </label>
              <input
                type="text"
                value={restoreConfirmInput}
                onChange={(e) => setRestoreConfirmInput(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded border border-red-300 bg-surface-bg text-surface-text-primary font-mono focus:outline-none focus:border-red-600"
                placeholder="CONFIRM_RESTORE"
              />
            </div>

            <div className="pt-3 border-t border-surface-border flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setIsRestoreModalOpen(false);
                  setSelectedBackupForRestore(null);
                }}
                className="px-3 py-1.5 font-medium rounded border border-surface-border hover:bg-surface-border text-surface-text-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteRestore}
                disabled={restoreConfirmInput !== 'CONFIRM_RESTORE' || isRestoringBackup}
                className="px-4 py-1.5 font-bold rounded bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-40"
              >
                {isRestoringBackup ? 'Executing Restore...' : 'Confirm Destructive Restore'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: INSPECT AUDIT LOG */}
      {/* ======================================================== */}
      {selectedAuditLog && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-surface-card border border-surface-border rounded-lg max-w-lg w-full p-5 space-y-4 shadow-lg max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <div>
                <h3 className="text-sm font-bold text-surface-text-primary">
                  Audit Entry: {selectedAuditLog.action}
                </h3>
                <p className="text-xs text-surface-text-secondary">
                  {new Date(selectedAuditLog.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAuditLog(null)}
                className="text-surface-text-muted hover:text-surface-text-primary"
              >
                &times;
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-surface-bg p-2.5 rounded border border-surface-border">
                <div>
                  <span className="text-surface-text-muted block text-[10px]">USER</span>
                  <span className="font-semibold">
                    {selectedAuditLog.user ? selectedAuditLog.user.username : 'SYSTEM'}
                  </span>
                </div>
                <div>
                  <span className="text-surface-text-muted block text-[10px]">ENTITY</span>
                  <span className="font-semibold">{selectedAuditLog.entity}</span>
                </div>
                <div>
                  <span className="text-surface-text-muted block text-[10px]">ENTITY ID</span>
                  <span className="font-mono">{selectedAuditLog.entityId || '-'}</span>
                </div>
                <div>
                  <span className="text-surface-text-muted block text-[10px]">IP ADDRESS</span>
                  <span className="font-mono">{selectedAuditLog.ipAddress || '-'}</span>
                </div>
              </div>

              <div>
                <span className="block font-semibold text-surface-text-secondary mb-1">
                  Sanitized Metadata Details
                </span>
                <pre className="p-3 bg-surface-bg rounded border border-surface-border font-mono text-[11px] overflow-x-auto text-surface-text-primary">
                  {JSON.stringify(selectedAuditLog.details || {}, null, 2)}
                </pre>
              </div>
            </div>

            <div className="pt-3 border-t border-surface-border flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedAuditLog(null)}
                className="px-4 py-1.5 text-xs font-semibold rounded bg-surface-border hover:bg-surface-border/80 text-surface-text-primary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shared Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        description={confirmConfig.description}
        confirmText={confirmConfig.confirmText}
        variant={confirmConfig.variant || 'danger'}
      />
    </div>
  );
};
