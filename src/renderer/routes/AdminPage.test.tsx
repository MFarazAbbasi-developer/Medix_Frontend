import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminPage } from './AdminPage';
import { adminApi, auditApi } from '../api';

vi.mock('../api', () => ({
  adminApi: {
    listUsers: vi.fn(),
    getUserById: vi.fn(),
    createUser: vi.fn(),
    updateUser: vi.fn(),
    setUserStatus: vi.fn(),
    resetPassword: vi.fn(),
    listRoles: vi.fn(),
    getPermissionsMatrix: vi.fn(),
    getRoleById: vi.fn(),
    createRole: vi.fn(),
    updateRole: vi.fn(),
    deleteRole: vi.fn(),
    listBackups: vi.fn(),
    validateBackup: vi.fn(),
    createBackup: vi.fn(),
    restoreBackup: vi.fn(),
    exportDataset: vi.fn(),
    getSystemInfo: vi.fn(),
  },
  auditApi: {
    getLogs: vi.fn(),
  },
}));

describe('AdminPage Component', () => {
  const mockUser = {
    id: 'user-1',
    username: 'admin',
    displayName: 'System Admin',
    isActive: true,
    lastLoginAt: '2026-09-01T10:00:00Z',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    roles: [{ id: 'role-1', name: 'ADMIN', description: 'Administrator' }],
    permissions: ['users.view', 'users.manage', 'backup.restore'],
  };

  const mockRole = {
    id: 'role-1',
    name: 'ADMIN',
    description: 'System Administrator with full access',
    isSystem: true,
    usersCount: 1,
    permissionsCount: 20,
    permissions: ['users.view', 'users.manage'],
  };

  const mockPermissionGroup = {
    module: 'User Management',
    permissions: [
      { code: 'users.view', description: 'View user accounts' },
      { code: 'users.manage', description: 'Manage users' },
    ],
  };

  const mockBackup = {
    id: 'backup-1',
    filename: 'medix_backup_farmax_2026-09-06.dump',
    filePath: 'C:/backups/medix_backup_farmax_2026-09-06.dump',
    sizeBytes: 5242880,
    createdAt: '2026-09-06T12:00:00Z',
    createdBy: 'admin',
    status: 'SUCCESS' as const,
    checksum: 'a1b2c3d4e5f6',
  };

  const mockSystemInfo = {
    application: {
      name: 'Medix by FARMAX',
      version: '1.0.0-phase8.admin-reliability',
      environment: 'development',
      nodeVersion: 'v20.10.0',
      platform: 'win32',
      arch: 'x64',
    },
    server: {
      uptimeSeconds: 3600,
      serverTime: '2026-09-06T21:00:00Z',
      memoryUsageMb: { heapUsed: 80, heapTotal: 120, rss: 160 },
    },
    database: {
      status: 'CONNECTED',
      engine: 'PostgreSQL',
      stats: {
        usersCount: 5,
        rolesCount: 3,
        productsCount: 100,
        batchesCount: 250,
        customersCount: 40,
        suppliersCount: 20,
        invoicesCount: 500,
        auditLogsCount: 1200,
      },
    },
    deployment: {
      organization: {
        id: 'org-1',
        name: 'FARMAX Healthcare Distribution',
        legalName: 'FARMAX Pharmaceuticals Ltd.',
        drugLicense: 'DL-PK-2026-001',
        ntn: '1234567-8',
        strn: '12-34-5678-001-99',
      },
      branches: [
        {
          id: 'br-1',
          name: 'Main Head Office Branch',
          code: 'HO',
          isHeadOffice: true,
          isActive: true,
        },
      ],
    },
  };

  const mockAuditLog = {
    id: 'audit-1',
    action: 'CREATE_USER',
    entity: 'USER',
    entityId: 'user-2',
    createdAt: '2026-09-06T15:00:00Z',
    details: { username: 'cashier1', role: 'CASHIER' },
    ipAddress: '127.0.0.1',
    userAgent: 'Mozilla/5.0',
    user: { id: 'user-1', username: 'admin', displayName: 'System Admin' },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (adminApi.listUsers as any).mockResolvedValue({
      items: [mockUser],
      meta: { page: 1, limit: 50, total: 1, totalPages: 1 },
    });
    (adminApi.getUserById as any).mockResolvedValue(mockUser);
    (adminApi.listRoles as any).mockResolvedValue([mockRole]);
    (adminApi.getPermissionsMatrix as any).mockResolvedValue({
      groups: [mockPermissionGroup],
      roles: [mockRole],
    });
    (adminApi.listBackups as any).mockResolvedValue({
      backupDirectory: 'C:/backups',
      items: [mockBackup],
      total: 1,
    });
    (adminApi.getSystemInfo as any).mockResolvedValue(mockSystemInfo);
    (auditApi.getLogs as any).mockResolvedValue({
      items: [mockAuditLog],
      meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
    });
  });

  it('renders User Management tab by default with user list', async () => {
    render(<AdminPage />);

    expect(screen.getByText('System Administration & Reliability')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('admin')).toBeInTheDocument();
      expect(screen.getByText('System Admin')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
    });
  });

  it('opens and submits Create User modal', async () => {
    (adminApi.createUser as any).mockResolvedValue({
      id: 'user-2',
      username: 'pharmacist1',
      displayName: 'Pharmacist One',
      isActive: true,
      roles: [],
    });

    render(<AdminPage />);

    const newBtn = screen.getByText('New User Account');
    fireEvent.click(newBtn);

    expect(screen.getByPlaceholderText('e.g. jdoe')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('e.g. jdoe'), {
      target: { value: 'pharmacist1' },
    });
    fireEvent.change(screen.getByPlaceholderText('e.g. John Doe'), {
      target: { value: 'Pharmacist One' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'SecurePass123' },
    });

    const submitBtn = screen.getByRole('button', { name: 'Create User' });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(adminApi.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          username: 'pharmacist1',
          displayName: 'Pharmacist One',
          password: 'SecurePass123',
        }),
      );
    });
  });

  it('navigates to Roles & Permissions tab and displays role cards', async () => {
    render(<AdminPage />);

    const rolesTabBtn = screen.getByRole('button', { name: /Roles & Permissions/i });
    fireEvent.click(rolesTabBtn);

    await waitFor(() => {
      expect(screen.getByText('Configured Roles & Permission Assignments')).toBeInTheDocument();
      expect(screen.getByText('SYSTEM')).toBeInTheDocument();
    });
  });

  it('navigates to Database Backup & Restore tab and creates backup', async () => {
    (adminApi.createBackup as any).mockResolvedValue({
      id: 'backup-2',
      filename: 'medix_backup_manual.dump',
      filePath: 'C:/backups/medix_backup_manual.dump',
      sizeBytes: 1048576,
      createdAt: new Date().toISOString(),
      createdBy: 'admin',
      status: 'SUCCESS',
    });

    render(<AdminPage />);

    const backupTabBtn = screen.getByRole('button', { name: /Database Backup & Restore/i });
    fireEvent.click(backupTabBtn);

    await waitFor(() => {
      expect(screen.getByText('Local PostgreSQL Database Snapshot')).toBeInTheDocument();
      expect(screen.getByText('medix_backup_farmax_2026-09-06.dump')).toBeInTheDocument();
    });

    const createBackupBtn = screen.getByText('Create Backup Now');
    fireEvent.click(createBackupBtn);

    await waitFor(() => {
      expect(adminApi.createBackup).toHaveBeenCalled();
    });
  });

  it('triggers destructive restore workflow with CONFIRM_RESTORE safeguard', async () => {
    (adminApi.restoreBackup as any).mockResolvedValue({
      success: true,
      message: 'Restored successfully',
      restoredFile: 'medix_backup_farmax_2026-09-06.dump',
      safetyBackup: 'medix_pre_restore_safety.dump',
    });

    render(<AdminPage />);

    const backupTabBtn = screen.getByRole('button', { name: /Database Backup & Restore/i });
    fireEvent.click(backupTabBtn);

    await waitFor(() => {
      expect(screen.getByText('medix_backup_farmax_2026-09-06.dump')).toBeInTheDocument();
    });

    const restoreBtn = screen.getByRole('button', { name: 'Restore' });
    fireEvent.click(restoreBtn);

    expect(
      screen.getByText('Destructive Database Restore Warning'),
    ).toBeInTheDocument();

    const confirmInput = screen.getByPlaceholderText('CONFIRM_RESTORE');
    const submitRestoreBtn = screen.getByRole('button', {
      name: 'Confirm Destructive Restore',
    });

    // Disabled initially
    expect(submitRestoreBtn).toBeDisabled();

    // Enter required token
    fireEvent.change(confirmInput, { target: { value: 'CONFIRM_RESTORE' } });
    expect(submitRestoreBtn).not.toBeDisabled();

    fireEvent.click(submitRestoreBtn);

    await waitFor(() => {
      expect(adminApi.restoreBackup).toHaveBeenCalledWith(
        'medix_backup_farmax_2026-09-06.dump',
        'CONFIRM_RESTORE',
      );
    });
  });

  it('navigates to Data Export tab and exports dataset', async () => {
    (adminApi.exportDataset as any).mockResolvedValue('SKU,Name\nMED-001,Panadol');

    render(<AdminPage />);

    const exportTabBtn = screen.getByRole('button', { name: /Data Export/i });
    fireEvent.click(exportTabBtn);

    await waitFor(() => {
      expect(screen.getByText('Controlled Business Data Export (CSV)')).toBeInTheDocument();
    });

    const downloadBtn = screen.getByText('Download CSV Dataset');
    fireEvent.click(downloadBtn);

    await waitFor(() => {
      expect(adminApi.exportDataset).toHaveBeenCalledWith(
        expect.objectContaining({
          dataset: 'products',
        }),
      );
    });
  });

  it('navigates to Audit Trail tab and displays logs', async () => {
    render(<AdminPage />);

    const auditTabBtn = screen.getByRole('button', { name: /Audit Trail/i });
    fireEvent.click(auditTabBtn);

    await waitFor(() => {
      expect(screen.getByText('CREATE_USER')).toBeInTheDocument();
      expect(screen.getByText('user-2')).toBeInTheDocument();
    });
  });

  it('navigates to System Information tab and displays telemetry', async () => {
    render(<AdminPage />);

    const systemTabBtn = screen.getByRole('button', {
      name: /System Information & LAN/i,
    });
    fireEvent.click(systemTabBtn);

    await waitFor(() => {
      expect(screen.getByText('Application Runtime')).toBeInTheDocument();
      expect(screen.getByText('1.0.0-phase8.admin-reliability')).toBeInTheDocument();
      expect(screen.getByText('PostgreSQL')).toBeInTheDocument();
      expect(screen.getByText('FARMAX Healthcare Distribution')).toBeInTheDocument();
    });
  });
});
