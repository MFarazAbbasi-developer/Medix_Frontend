import React from 'react';
import {
  Database,
  Server,
  Monitor,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { useHealth } from '../hooks/useHealth';
import { useAppStore } from '../store/appStore';
import { Card } from '../components/ui/Card';
import { StatusBadge } from '../components/ui/StatusBadge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/Table';

export const DashboardPage: React.FC = () => {
  const { data: health, isLoading } = useHealth();
  const { apiBaseUrl, backendStatus } = useAppStore();

  const isLocalhost =
    apiBaseUrl.includes('localhost') || apiBaseUrl.includes('127.0.0.1');

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-border pb-3">
        <div>
          <h1 className="text-base font-bold text-charcoal-900 tracking-tight">
            System Overview & Foundation Status
          </h1>
          <p className="text-xs text-charcoal-500 mt-0.5">
            Operational status for local-first pharmaceutical distribution station
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge
            variant={
              backendStatus === 'connected'
                ? 'success'
                : backendStatus === 'checking'
                  ? 'warning'
                  : 'error'
            }
          >
            {backendStatus === 'connected'
              ? 'Station Active'
              : backendStatus === 'checking'
                ? 'Connecting...'
                : 'Connection Failed'}
          </StatusBadge>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Backend REST API */}
        <Card className="p-3.5">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold text-charcoal-500 uppercase tracking-wider">
                NestJS REST API
              </p>
              <p className="text-sm font-bold text-charcoal-900">
                {isLoading
                  ? 'Checking...'
                  : health?.status === 'ok'
                    ? 'Operational (v1)'
                    : 'Unreachable'}
              </p>
            </div>
            <div
              className={`p-2 rounded ${
                health?.status === 'ok'
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'bg-red-50 text-red-600'
              }`}
            >
              <Server className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-surface-border flex items-center justify-between text-[11px] text-charcoal-500">
            <span>Route</span>
            <span className="font-mono text-charcoal-700">/api/v1/health</span>
          </div>
        </Card>

        {/* PostgreSQL Database */}
        <Card className="p-3.5">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold text-charcoal-500 uppercase tracking-wider">
                PostgreSQL Database
              </p>
              <p className="text-sm font-bold text-charcoal-900">
                {isLoading
                  ? 'Checking...'
                  : health?.database.status === 'connected'
                    ? 'Connected (Prisma)'
                    : 'Disconnected'}
              </p>
            </div>
            <div
              className={`p-2 rounded ${
                health?.database.status === 'connected'
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'bg-amber-50 text-amber-600'
              }`}
            >
              <Database className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-surface-border flex items-center justify-between text-[11px] text-charcoal-500">
            <span>Provider</span>
            <span className="font-mono text-charcoal-700">Prisma ORM</span>
          </div>
        </Card>

        {/* Deployment Mode */}
        <Card className="p-3.5">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold text-charcoal-500 uppercase tracking-wider">
                Deployment Mode
              </p>
              <p className="text-sm font-bold text-charcoal-900">
                {isLocalhost ? 'Single-PC / Server' : 'Multi-PC / LAN Client'}
              </p>
            </div>
            <div className="p-2 rounded bg-blue-50 text-blue-600">
              <Monitor className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-surface-border flex items-center justify-between text-[11px] text-charcoal-500">
            <span>Host Mode</span>
            <span className="font-mono text-charcoal-700">
              {isLocalhost ? 'Localhost' : 'Remote LAN'}
            </span>
          </div>
        </Card>

        {/* Security & IPC */}
        <Card className="p-3.5">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold text-charcoal-500 uppercase tracking-wider">
                Electron Sandbox
              </p>
              <p className="text-sm font-bold text-charcoal-900">
                Isolated Context
              </p>
            </div>
            <div className="p-2 rounded bg-emerald-50 text-emerald-600">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-surface-border flex items-center justify-between text-[11px] text-charcoal-500">
            <span>Node Integration</span>
            <span className="font-semibold text-emerald-700">Disabled (Secure)</span>
          </div>
        </Card>
      </div>

      {/* System Diagnostics Table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-charcoal-800 uppercase tracking-wider">
            Station & Server Diagnostics
          </h2>
          <span className="text-[11px] text-charcoal-500">
            Auto-refreshed every 15s
          </span>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-1/3">Component</TableHead>
              <TableHead>Current Value / Target</TableHead>
              <TableHead className="w-28 text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium text-charcoal-900">
                Backend API Endpoint
              </TableCell>
              <TableCell className="font-mono text-xs">{apiBaseUrl}</TableCell>
              <TableCell className="text-right">
                <StatusBadge
                  variant={backendStatus === 'connected' ? 'success' : 'error'}
                >
                  {backendStatus === 'connected' ? 'Active' : 'Offline'}
                </StatusBadge>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium text-charcoal-900">
                PostgreSQL Database Connection
              </TableCell>
              <TableCell className="text-xs text-charcoal-700">
                {health?.database.status === 'connected'
                  ? 'PostgreSQL ready via Prisma Client'
                  : 'Database ping returned disconnected or pending init'}
              </TableCell>
              <TableCell className="text-right">
                <StatusBadge
                  variant={
                    health?.database.status === 'connected'
                      ? 'success'
                      : 'warning'
                  }
                >
                  {health?.database.status === 'connected'
                    ? 'Connected'
                    : 'Pending'}
                </StatusBadge>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium text-charcoal-900">
                Server Uptime
              </TableCell>
              <TableCell className="font-mono text-xs">
                {health?.uptimeSeconds !== undefined
                  ? `${Math.floor(health.uptimeSeconds / 60)}m ${health.uptimeSeconds % 60}s`
                  : 'N/A'}
              </TableCell>
              <TableCell className="text-right">
                <StatusBadge variant="info">Recorded</StatusBadge>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium text-charcoal-900">
                Backend Environment
              </TableCell>
              <TableCell className="font-mono text-xs">
                {health?.environment || 'development'}
              </TableCell>
              <TableCell className="text-right">
                <StatusBadge variant="neutral">
                  {health?.environment || 'development'}
                </StatusBadge>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium text-charcoal-900">
                Application Architecture
              </TableCell>
              <TableCell className="text-xs text-charcoal-700">
                Electron/React → HTTP REST → NestJS → Prisma → PostgreSQL
              </TableCell>
              <TableCell className="text-right">
                <StatusBadge variant="success">Verified</StatusBadge>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {/* Note regarding upcoming business modules */}
      <div className="rounded border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-900 space-y-1">
        <p className="font-bold flex items-center gap-1.5">
          <AlertCircle className="h-4 w-4 text-amber-700" />
          Foundation Mode Active
        </p>
        <p className="leading-relaxed">
          Production foundation setup is in place. Business modules (Products,
          Inventory, Sales, Purchasing, Customers, Suppliers, Reports) will be
          built systematically in upcoming phases.
        </p>
      </div>
    </div>
  );
};
