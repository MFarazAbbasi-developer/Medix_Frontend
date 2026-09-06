import React, { useState } from 'react';
import {
  Server,
  Minus,
  Square,
  X,
  RefreshCw,
  LogOut,
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { useAuthStore } from '../../store/authStore';
import { StatusBadge } from '../ui/StatusBadge';
import { ServerConfigModal } from '../ServerConfigModal';
import { useHealth } from '../../hooks/useHealth';

export const AppHeader: React.FC = () => {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const { backendStatus, apiBaseUrl, serverInfo } = useAppStore();
  const { user, logout } = useAuthStore();
  const { refetch, isFetching } = useHealth();

  const handleMinimize = () => {
    window.electronAPI?.minimizeWindow();
  };

  const handleMaximize = () => {
    window.electronAPI?.maximizeWindow();
  };

  const handleClose = () => {
    window.electronAPI?.closeWindow();
  };

  const handleLogout = async () => {
    await logout();
  };

  const getStatusBadge = () => {
    switch (backendStatus) {
      case 'connected':
        return (
          <StatusBadge variant="success">
            API Online {serverInfo?.databaseStatus === 'connected' ? '• DB Ready' : '• DB Degraded'}
          </StatusBadge>
        );
      case 'checking':
        return <StatusBadge variant="warning">Checking API...</StatusBadge>;
      case 'disconnected':
      default:
        return <StatusBadge variant="error">API Offline</StatusBadge>;
    }
  };

  const primaryRole = user?.roles?.[0] || 'User';

  return (
    <>
      <header className="h-10 w-full border-b border-surface-border bg-surface-card flex items-center justify-between px-3 select-none z-30">
        {/* Brand & System Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-brand-500 text-[11px] font-bold text-white shadow-sm">
              M
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xs font-bold tracking-tight text-charcoal-900">
                MEDIX
              </span>
              <span className="text-[10px] font-medium tracking-wide text-brand-500 uppercase">
                by FARMAX
              </span>
            </div>
          </div>
          <span className="text-surface-borderStrong text-xs">|</span>
          <span className="text-[11px] text-charcoal-500 font-medium hidden sm:inline">
            Pharma Distribution System
          </span>
        </div>

        {/* Server & Connectivity Status */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsConfigOpen(true)}
            title={`Active Server: ${apiBaseUrl}`}
            className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-charcoal-700 hover:bg-surface-muted border border-transparent hover:border-surface-border transition-colors"
          >
            <Server className="h-3.5 w-3.5 text-charcoal-500" />
            <span className="text-[11px] font-mono text-charcoal-600 hidden md:inline truncate max-w-[140px]">
              {apiBaseUrl.replace(/^https?:\/\//, '')}
            </span>
          </button>

          {getStatusBadge()}

          <button
            onClick={() => refetch()}
            disabled={isFetching}
            title="Refresh Server Connection"
            className="p-1 rounded text-charcoal-500 hover:text-charcoal-800 hover:bg-surface-muted transition-colors disabled:opacity-40"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* User Account & Desktop Controls */}
        <div className="flex items-center gap-2">
          {user && (
            <div className="flex items-center gap-2 border-l border-surface-border pl-2.5">
              <div className="flex items-center gap-1.5 text-xs text-charcoal-800">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-50 text-brand-700 text-[10px] font-bold border border-brand-200">
                  {user.displayName.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col text-left hidden lg:flex leading-none">
                  <span className="font-semibold text-xs text-charcoal-900 truncate max-w-[110px]">
                    {user.displayName}
                  </span>
                  <span className="text-[9px] text-charcoal-500 uppercase font-mono">
                    {primaryRole}
                  </span>
                </div>
              </div>

              <button
                onClick={handleLogout}
                title="Sign out of station"
                className="flex items-center gap-1 px-1.5 py-1 rounded text-xs text-charcoal-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200 border border-transparent transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="text-[11px] hidden sm:inline">Logout</span>
              </button>
            </div>
          )}

          {/* Desktop Window Controls (if inside Electron) */}
          {window.electronAPI && (
            <div className="flex items-center gap-1 -mr-1 border-l border-surface-border pl-1">
              <button
                onClick={handleMinimize}
                className="h-7 w-7 inline-flex items-center justify-center rounded text-charcoal-600 hover:bg-surface-muted hover:text-charcoal-900 transition-colors"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={handleMaximize}
                className="h-7 w-7 inline-flex items-center justify-center rounded text-charcoal-600 hover:bg-surface-muted hover:text-charcoal-900 transition-colors"
              >
                <Square className="h-3 w-3" />
              </button>
              <button
                onClick={handleClose}
                className="h-7 w-7 inline-flex items-center justify-center rounded text-charcoal-600 hover:bg-red-500 hover:text-white transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </header>

      <ServerConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
      />
    </>
  );
};
