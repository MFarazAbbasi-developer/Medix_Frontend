import React, { useState, useEffect } from 'react';
import {
  Server,
  Minus,
  Square,
  X,
  RefreshCw,
  LogOut,
  Search,
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

  // Keyboard shortcut Ctrl+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('global-command-search') as HTMLInputElement | null;
        searchInput?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
      <header className="h-12 w-full border-b border-surface-border bg-surface-card flex items-center justify-between px-3.5 select-none z-30 shrink-0">
        {/* Left: Brand & System Title */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded bg-brand-500 text-xs font-bold text-white shadow-xs">
              M
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-bold tracking-tight text-charcoal-900 font-sans">
                MEDIX
              </span>
              <span className="text-[10px] font-semibold tracking-wider text-brand-500 uppercase">
                by FARMAX
              </span>
            </div>
          </div>
          <span className="text-surface-borderStrong text-xs hidden sm:inline">|</span>
          <span className="text-[11px] text-charcoal-500 font-medium hidden lg:inline">
            Pharma Distribution System
          </span>
        </div>

        {/* Center: Global Quick Command & Search Entry */}
        <div className="flex-1 max-w-md mx-4 hidden md:block">
          <div className="relative flex items-center">
            <Search className="absolute left-2.5 h-3.5 w-3.5 text-charcoal-400 pointer-events-none" />
            <input
              id="global-command-search"
              type="text"
              readOnly
              placeholder="Quick search products, customers, invoices, batches..."
              onClick={() => {
                // Focus indicator or future command palette launch
              }}
              className="w-full h-7.5 pl-8 pr-16 rounded border border-surface-border bg-surface-muted/50 hover:bg-surface-muted text-xs text-charcoal-700 placeholder:text-charcoal-400 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:bg-white cursor-pointer transition-colors"
            />
            <div className="absolute right-2 flex items-center pointer-events-none">
              <kbd className="inline-flex items-center px-1.5 py-0.5 rounded border border-surface-borderStrong bg-surface-card text-[10px] font-mono font-semibold text-charcoal-500 shadow-2xs">
                Ctrl+K
              </kbd>
            </div>
          </div>
        </div>

        {/* Right: Server Status, User Account, Window Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Server & Connectivity Status */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsConfigOpen(true)}
              title={`Active Server: ${apiBaseUrl}`}
              className="flex items-center gap-1 px-1.5 py-1 rounded text-xs text-charcoal-700 hover:bg-surface-muted border border-transparent hover:border-surface-border transition-colors"
            >
              <Server className="h-3.5 w-3.5 text-charcoal-500" />
              <span className="text-[11px] font-mono text-charcoal-600 hidden xl:inline truncate max-w-[120px]">
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

          {/* User Account */}
          {user && (
            <div className="flex items-center gap-2 border-l border-surface-border pl-2.5">
              <div className="flex items-center gap-1.5 text-xs text-charcoal-800">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-50 text-brand-700 text-[11px] font-bold border border-brand-200">
                  {user.displayName.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col text-left hidden sm:flex leading-tight">
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
            <div className="flex items-center gap-1 -mr-1 border-l border-surface-border pl-1.5">
              <button
                onClick={handleMinimize}
                title="Minimize Window"
                className="h-7 w-7 inline-flex items-center justify-center rounded text-charcoal-600 hover:bg-surface-muted hover:text-charcoal-900 transition-colors"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={handleMaximize}
                title="Maximize Window"
                className="h-7 w-7 inline-flex items-center justify-center rounded text-charcoal-600 hover:bg-surface-muted hover:text-charcoal-900 transition-colors"
              >
                <Square className="h-3 w-3" />
              </button>
              <button
                onClick={handleClose}
                title="Close Application"
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
