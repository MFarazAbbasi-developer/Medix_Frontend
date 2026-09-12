import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2,
  MapPin,
  Hash,
  Sliders,
  History,
  Save,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw,
  Server,
  ShieldCheck,
  Edit2,
  X,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Pagination } from '../components/ui/Pagination';
import { toast } from '../components/ui/Toast';
import { useAppStore } from '../store/appStore';
import { useHealth } from '../hooks/useHealth';
import {
  organizationApi,
  Organization,
  Branch,
  numberingApi,
  NumberingSeries,
  settingsApi,
  auditApi,
  AuditLogItem,
} from '../api';

type TabKey = 'profile' | 'branches' | 'numbering' | 'general' | 'audit';

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('profile');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // --- 1. Business Profile State ---
  const [orgData, setOrgData] = useState<Partial<Organization>>({});
  const [isSavingOrg, setIsSavingOrg] = useState(false);

  // --- 2. Branches State ---
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Partial<Branch> | null>(null);
  const [isSavingBranch, setIsSavingBranch] = useState(false);

  // --- 3. Numbering Series State ---
  const [seriesList, setSeriesList] = useState<NumberingSeries[]>([]);
  const [editingSeries, setEditingSeries] = useState<NumberingSeries | null>(null);
  const [isSavingSeries, setIsSavingSeries] = useState(false);

  // --- 4. General Settings State ---
  const [settingsMap, setSettingsMap] = useState<Record<string, string>>({
    currency: 'PKR',
    currencySymbol: 'Rs.',
    dateFormat: 'YYYY-MM-DD',
    timeZone: 'Asia/Karachi',
    defaultTaxRate: '0',
    invoiceFooterNote: '',
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Server & LAN URL
  const { apiBaseUrl, setApiBaseUrl } = useAppStore();
  const { refetch: testHealth, isFetching: isTestingHealth } = useHealth();
  const [urlInput, setUrlInput] = useState(apiBaseUrl);

  // --- 5. Audit Trail State ---
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditPage, setAuditPage] = useState(1);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    if (type === 'error') {
      toast.error(message);
    } else {
      toast.success(message);
    }
    setTimeout(() => setFeedback(null), 4000);
  };

  // Load Organization
  const loadOrganization = useCallback(async () => {
    try {
      setLoading(true);
      const data = await organizationApi.getOrganization();
      setOrgData(data);
    } catch {
      // Handled silently or set empty
    } finally {
      setLoading(false);
    }
  }, []);

  // Load Branches
  const loadBranches = useCallback(async () => {
    try {
      const data = await organizationApi.getBranches();
      setBranches(data);
    } catch {
      // Ignored
    }
  }, []);

  // Load Numbering Series
  const loadNumbering = useCallback(async () => {
    try {
      const data = await numberingApi.getSeriesList();
      setSeriesList(data);
    } catch {
      // Ignored
    }
  }, []);

  // Load General Settings
  const loadSettings = useCallback(async () => {
    try {
      const data = await settingsApi.getSettings();
      if (data.map) {
        setSettingsMap((prev) => ({ ...prev, ...data.map }));
      }
    } catch {
      // Ignored
    }
  }, []);

  // Load Audit Trail
  const loadAudit = useCallback(async (page = 1) => {
    try {
      setIsLoadingAudit(true);
      const data = await auditApi.getLogs({ page, limit: 15 });
      setAuditLogs(data.items);
      setAuditTotal(data.meta.total);
      setAuditPage(page);
    } catch {
      // Ignored
    } finally {
      setIsLoadingAudit(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'profile') loadOrganization();
    if (activeTab === 'branches') loadBranches();
    if (activeTab === 'numbering') loadNumbering();
    if (activeTab === 'general') loadSettings();
    if (activeTab === 'audit') loadAudit(1);
  }, [activeTab, loadOrganization, loadBranches, loadNumbering, loadSettings, loadAudit]);

  // Handler: Save Organization
  const handleSaveOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingOrg(true);
      const updated = await organizationApi.updateOrganization({
        name: orgData.name,
        legalName: orgData.legalName,
        address: orgData.address,
        city: orgData.city,
        state: orgData.state,
        country: orgData.country,
        postalCode: orgData.postalCode,
        phone: orgData.phone,
        email: orgData.email,
        website: orgData.website,
        ntn: orgData.ntn,
        strn: orgData.strn,
        drugSaleLicenseNo: orgData.drugSaleLicenseNo,
        logoUrl: orgData.logoUrl,
      });
      setOrgData(updated);
      showFeedback('success', 'Business Profile updated successfully');
    } catch (err: unknown) {
      showFeedback('error', (err as Error)?.message || 'Failed to update business profile');
    } finally {
      setIsSavingOrg(false);
    }
  };

  // Handler: Save Branch
  const handleSaveBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBranch?.name || !editingBranch?.code) {
      showFeedback('error', 'Branch name and code are required');
      return;
    }

    try {
      setIsSavingBranch(true);
      if (editingBranch.id) {
        await organizationApi.updateBranch(editingBranch.id, {
          name: editingBranch.name,
          code: editingBranch.code,
          city: editingBranch.city,
          address: editingBranch.address,
          phone: editingBranch.phone,
          email: editingBranch.email,
          isActive: editingBranch.isActive,
          isHeadOffice: editingBranch.isHeadOffice,
        });
        showFeedback('success', `Branch "${editingBranch.name}" updated`);
      } else {
        await organizationApi.createBranch({
          name: editingBranch.name,
          code: editingBranch.code,
          city: editingBranch.city,
          address: editingBranch.address,
          phone: editingBranch.phone,
          email: editingBranch.email,
          isActive: editingBranch.isActive ?? true,
          isHeadOffice: editingBranch.isHeadOffice ?? false,
        });
        showFeedback('success', `Branch "${editingBranch.name}" created`);
      }
      setIsBranchModalOpen(false);
      setEditingBranch(null);
      loadBranches();
    } catch (err: unknown) {
      showFeedback('error', (err as Error)?.message || 'Failed to save branch');
    } finally {
      setIsSavingBranch(false);
    }
  };

  // Handler: Save Series
  const handleSaveSeries = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSeries) return;

    try {
      setIsSavingSeries(true);
      await numberingApi.updateSeries(editingSeries.id, {
        prefix: editingSeries.prefix,
        suffix: editingSeries.suffix || undefined,
        padding: editingSeries.padding,
        nextNumber: editingSeries.nextNumber,
        isActive: editingSeries.isActive,
      });
      showFeedback('success', `Series "${editingSeries.documentType}" updated`);
      setEditingSeries(null);
      loadNumbering();
    } catch (err: unknown) {
      showFeedback('error', (err as Error)?.message || 'Failed to update numbering series');
    } finally {
      setIsSavingSeries(false);
    }
  };

  // Handler: Save General Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingSettings(true);
      const settingsPayload = Object.entries(settingsMap).map(([key, value]) => ({
        key,
        value,
      }));
      await settingsApi.updateSettings({ settings: settingsPayload });
      showFeedback('success', 'System settings saved successfully');
    } catch (err: unknown) {
      showFeedback('error', (err as Error)?.message || 'Failed to save settings');
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Handler: Save API Connection URL
  const handleSaveApiUrl = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      new URL(urlInput);
      setApiBaseUrl(urlInput);
      showFeedback('success', 'Backend connection URL updated');
    } catch {
      showFeedback('error', 'Please enter a valid URL (e.g., http://localhost:3000/api/v1)');
    }
  };

  return (
    <div className="space-y-4">
      {/* Page Title & Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-surface-border pb-3 gap-3">
        <div>
          <h1 className="text-base font-bold text-charcoal-900 tracking-tight">
            System & Master Data Configuration
          </h1>
          <p className="text-xs text-charcoal-500 mt-0.5">
            Configure organization identity, branches, transaction series, and station parameters
          </p>
        </div>

        {/* Status Toast */}
        {feedback && (
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs border ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="h-3.5 w-3.5 shrink-0 text-rose-600" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}
      </div>

      {/* Tabs Menu */}
      <div className="flex items-center gap-1 border-b border-surface-border">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'profile'
              ? 'border-brand-500 text-brand-500'
              : 'border-transparent text-charcoal-600 hover:text-charcoal-900'
          }`}
        >
          <Building2 className="h-3.5 w-3.5" />
          <span>Business Profile</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('branches')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'branches'
              ? 'border-brand-500 text-brand-500'
              : 'border-transparent text-charcoal-600 hover:text-charcoal-900'
          }`}
        >
          <MapPin className="h-3.5 w-3.5" />
          <span>Branches</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('numbering')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'numbering'
              ? 'border-brand-500 text-brand-500'
              : 'border-transparent text-charcoal-600 hover:text-charcoal-900'
          }`}
        >
          <Hash className="h-3.5 w-3.5" />
          <span>Numbering Series</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'general'
              ? 'border-brand-500 text-brand-500'
              : 'border-transparent text-charcoal-600 hover:text-charcoal-900'
          }`}
        >
          <Sliders className="h-3.5 w-3.5" />
          <span>General Settings</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'audit'
              ? 'border-brand-500 text-brand-500'
              : 'border-transparent text-charcoal-600 hover:text-charcoal-900'
          }`}
        >
          <History className="h-3.5 w-3.5" />
          <span>Audit Trail</span>
        </button>
      </div>

      {/* TAB 1: BUSINESS PROFILE */}
      {activeTab === 'profile' && (
        <Card
          header={
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-brand-500" />
                <span>Pharmaceutical Business Identity & Tax Registration</span>
              </div>
              <Button
                variant="outline"
                size="xs"
                onClick={loadOrganization}
                disabled={loading}
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Reload
              </Button>
            </div>
          }
        >
          <form onSubmit={handleSaveOrg} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Operating / Trading Name *"
                value={orgData.name || ''}
                onChange={(e) => setOrgData({ ...orgData, name: e.target.value })}
                required
              />
              <Input
                label="Legal Registered Name"
                value={orgData.legalName || ''}
                onChange={(e) => setOrgData({ ...orgData, legalName: e.target.value })}
                helperText="Appears on formal legal invoices & receipts"
              />
            </div>

            {/* Pakistan Compliance Fields */}
            <div className="p-3 bg-surface-muted border border-surface-border rounded space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-charcoal-800">
                <ShieldCheck className="h-3.5 w-3.5 text-brand-500" />
                <span>Pakistani Regulatory & Tax Registrations</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input
                  label="National Tax Number (NTN)"
                  value={orgData.ntn || ''}
                  onChange={(e) => setOrgData({ ...orgData, ntn: e.target.value })}
                  placeholder="e.g. 7100234-5"
                />
                <Input
                  label="Sales Tax Reg. (STRN)"
                  value={orgData.strn || ''}
                  onChange={(e) => setOrgData({ ...orgData, strn: e.target.value })}
                  placeholder="e.g. 17-00-7100-234-11"
                />
                <Input
                  label="Drug Sale License (DSL) #"
                  value={orgData.drugSaleLicenseNo || ''}
                  onChange={(e) =>
                    setOrgData({ ...orgData, drugSaleLicenseNo: e.target.value })
                  }
                  placeholder="e.g. DSL-KHI-2026-894"
                />
              </div>
            </div>

            {/* Address & Contact Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="City"
                value={orgData.city || ''}
                onChange={(e) => setOrgData({ ...orgData, city: e.target.value })}
              />
              <Input
                label="State / Province"
                value={orgData.state || ''}
                onChange={(e) => setOrgData({ ...orgData, state: e.target.value })}
              />
              <Input
                label="Country"
                value={orgData.country || 'Pakistan'}
                onChange={(e) => setOrgData({ ...orgData, country: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Phone Number"
                value={orgData.phone || ''}
                onChange={(e) => setOrgData({ ...orgData, phone: e.target.value })}
              />
              <Input
                label="Email Address"
                type="email"
                value={orgData.email || ''}
                onChange={(e) => setOrgData({ ...orgData, email: e.target.value })}
              />
              <Input
                label="Website URL"
                value={orgData.website || ''}
                onChange={(e) => setOrgData({ ...orgData, website: e.target.value })}
              />
            </div>

            <Input
              label="Physical Address / Distribution Facility"
              value={orgData.address || ''}
              onChange={(e) => setOrgData({ ...orgData, address: e.target.value })}
            />

            <div className="flex justify-end pt-2 border-t border-surface-border">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={isSavingOrg}
              >
                <Save className="h-3.5 w-3.5 mr-1.5" />
                {isSavingOrg ? 'Saving Profile...' : 'Save Business Profile'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* TAB 2: BRANCHES */}
      {activeTab === 'branches' && (
        <div className="space-y-4">
          <Card
            header={
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-brand-500" />
                  <span>Distribution Branches & Warehouses</span>
                </div>
                <Button
                  variant="primary"
                  size="xs"
                  onClick={() => {
                    setEditingBranch({
                      name: '',
                      code: '',
                      city: '',
                      isActive: true,
                      isHeadOffice: false,
                    });
                    setIsBranchModalOpen(true);
                  }}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Branch
                </Button>
              </div>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-surface-border text-charcoal-500 bg-surface-muted">
                    <th className="py-2 px-3 font-semibold">Code</th>
                    <th className="py-2 px-3 font-semibold">Branch Name</th>
                    <th className="py-2 px-3 font-semibold">City</th>
                    <th className="py-2 px-3 font-semibold">Phone</th>
                    <th className="py-2 px-3 font-semibold">Type</th>
                    <th className="py-2 px-3 font-semibold">Status</th>
                    <th className="py-2 px-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {branches.map((branch) => (
                    <tr key={branch.id} className="hover:bg-surface-muted/50">
                      <td className="py-2.5 px-3 font-mono font-bold text-charcoal-900">
                        {branch.code}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-charcoal-800">
                        {branch.name}
                      </td>
                      <td className="py-2.5 px-3 text-charcoal-600">{branch.city || '—'}</td>
                      <td className="py-2.5 px-3 text-charcoal-600">{branch.phone || '—'}</td>
                      <td className="py-2.5 px-3">
                        {branch.isHeadOffice ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-brand-50 text-brand-600 border border-brand-200">
                            Head Office
                          </span>
                        ) : (
                          <span className="text-charcoal-500 text-[11px]">Regional</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <StatusBadge variant={branch.isActive ? 'success' : 'neutral'}>
                          {branch.isActive ? 'Active' : 'Inactive'}
                        </StatusBadge>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => {
                            setEditingBranch(branch);
                            setIsBranchModalOpen(true);
                          }}
                        >
                          <Edit2 className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {branches.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-charcoal-400">
                        No branches configured.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Branch Edit Modal */}
          {isBranchModalOpen && editingBranch && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
              <div className="bg-surface-card border border-surface-border rounded-lg shadow-xl w-full max-w-md p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-surface-border pb-2">
                  <h3 className="font-bold text-sm text-charcoal-900">
                    {editingBranch.id ? 'Edit Branch' : 'Add New Branch'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setIsBranchModalOpen(false);
                      setEditingBranch(null);
                    }}
                    className="text-charcoal-400 hover:text-charcoal-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveBranch} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Branch Code *"
                      value={editingBranch.code || ''}
                      onChange={(e) =>
                        setEditingBranch({ ...editingBranch, code: e.target.value })
                      }
                      placeholder="e.g. HO or BR02"
                      required
                    />
                    <Input
                      label="Branch Name *"
                      value={editingBranch.name || ''}
                      onChange={(e) =>
                        setEditingBranch({ ...editingBranch, name: e.target.value })
                      }
                      placeholder="e.g. Lahore Warehouse"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="City"
                      value={editingBranch.city || ''}
                      onChange={(e) =>
                        setEditingBranch({ ...editingBranch, city: e.target.value })
                      }
                    />
                    <Input
                      label="Phone"
                      value={editingBranch.phone || ''}
                      onChange={(e) =>
                        setEditingBranch({ ...editingBranch, phone: e.target.value })
                      }
                    />
                  </div>

                  <Input
                    label="Address"
                    value={editingBranch.address || ''}
                    onChange={(e) =>
                      setEditingBranch({ ...editingBranch, address: e.target.value })
                    }
                  />

                  <div className="flex items-center gap-4 pt-1">
                    <label className="flex items-center gap-2 text-xs text-charcoal-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingBranch.isHeadOffice || false}
                        onChange={(e) =>
                          setEditingBranch({
                            ...editingBranch,
                            isHeadOffice: e.target.checked,
                          })
                        }
                        className="rounded border-charcoal-300 text-brand-500 focus:ring-brand-500"
                      />
                      <span>Head Office Branch</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs text-charcoal-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingBranch.isActive ?? true}
                        onChange={(e) =>
                          setEditingBranch({
                            ...editingBranch,
                            isActive: e.target.checked,
                          })
                        }
                        className="rounded border-charcoal-300 text-brand-500 focus:ring-brand-500"
                      />
                      <span>Active</span>
                    </label>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-surface-border">
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      onClick={() => {
                        setIsBranchModalOpen(false);
                        setEditingBranch(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      size="xs"
                      disabled={isSavingBranch}
                    >
                      {isSavingBranch ? 'Saving...' : 'Save Branch'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: NUMBERING SERIES */}
      {activeTab === 'numbering' && (
        <div className="space-y-4">
          <Card
            header={
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-brand-500" />
                  <span>Sequential Document Numbering Series</span>
                </div>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={loadNumbering}
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Reload
                </Button>
              </div>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-surface-border text-charcoal-500 bg-surface-muted">
                    <th className="py-2 px-3 font-semibold">Document Type</th>
                    <th className="py-2 px-3 font-semibold">Prefix</th>
                    <th className="py-2 px-3 font-semibold">Next Sequence</th>
                    <th className="py-2 px-3 font-semibold">Padding</th>
                    <th className="py-2 px-3 font-semibold">Live Preview</th>
                    <th className="py-2 px-3 font-semibold">Status</th>
                    <th className="py-2 px-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {seriesList.map((series) => {
                    const previewPadded = String(series.nextNumber).padStart(
                      series.padding,
                      '0',
                    );
                    const previewStr = `${series.prefix}${previewPadded}${
                      series.suffix || ''
                    }`;

                    return (
                      <tr key={series.id} className="hover:bg-surface-muted/50">
                        <td className="py-2.5 px-3 font-semibold text-charcoal-900">
                          {series.documentType.replace(/_/g, ' ')}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-charcoal-700">
                          {series.prefix}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-medium text-charcoal-800">
                          {series.nextNumber}
                        </td>
                        <td className="py-2.5 px-3 text-charcoal-600">{series.padding} digits</td>
                        <td className="py-2.5 px-3">
                          <span className="font-mono text-xs px-2 py-0.5 rounded bg-surface-muted border border-surface-border text-brand-600 font-bold">
                            {previewStr}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <StatusBadge variant={series.isActive ? 'success' : 'neutral'}>
                            {series.isActive ? 'Active' : 'Inactive'}
                          </StatusBadge>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => setEditingSeries(series)}
                          >
                            <Edit2 className="h-3 w-3 mr-1" />
                            Configure
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Edit Series Modal */}
          {editingSeries && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
              <div className="bg-surface-card border border-surface-border rounded-lg shadow-xl w-full max-w-md p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-surface-border pb-2">
                  <h3 className="font-bold text-sm text-charcoal-900">
                    Configure Series: {editingSeries.documentType.replace(/_/g, ' ')}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setEditingSeries(null)}
                    className="text-charcoal-400 hover:text-charcoal-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveSeries} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Prefix *"
                      value={editingSeries.prefix}
                      onChange={(e) =>
                        setEditingSeries({ ...editingSeries, prefix: e.target.value })
                      }
                      required
                    />
                    <Input
                      label="Suffix (Optional)"
                      value={editingSeries.suffix || ''}
                      onChange={(e) =>
                        setEditingSeries({ ...editingSeries, suffix: e.target.value })
                      }
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Next Number *"
                      type="number"
                      min={1}
                      value={editingSeries.nextNumber}
                      onChange={(e) =>
                        setEditingSeries({
                          ...editingSeries,
                          nextNumber: parseInt(e.target.value, 10) || 1,
                        })
                      }
                      required
                    />
                    <Input
                      label="Padding Digits *"
                      type="number"
                      min={1}
                      max={10}
                      value={editingSeries.padding}
                      onChange={(e) =>
                        setEditingSeries({
                          ...editingSeries,
                          padding: parseInt(e.target.value, 10) || 5,
                        })
                      }
                      required
                    />
                  </div>

                  <div className="p-2.5 rounded bg-surface-muted text-xs flex justify-between items-center">
                    <span className="text-charcoal-600">Sample Generated Number:</span>
                    <span className="font-mono font-bold text-brand-600">
                      {editingSeries.prefix}
                      {String(editingSeries.nextNumber).padStart(editingSeries.padding, '0')}
                      {editingSeries.suffix || ''}
                    </span>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-surface-border">
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      onClick={() => setEditingSeries(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      size="xs"
                      disabled={isSavingSeries}
                    >
                      {isSavingSeries ? 'Saving...' : 'Save Configuration'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: GENERAL SETTINGS */}
      {activeTab === 'general' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card
            header={
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-brand-500" />
                <span>Financial & Regional Defaults</span>
              </div>
            }
          >
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Currency Code"
                  value={settingsMap.currency || 'PKR'}
                  onChange={(e) =>
                    setSettingsMap({ ...settingsMap, currency: e.target.value })
                  }
                  helperText="Default: PKR"
                />
                <Input
                  label="Currency Symbol"
                  value={settingsMap.currencySymbol || 'Rs.'}
                  onChange={(e) =>
                    setSettingsMap({ ...settingsMap, currencySymbol: e.target.value })
                  }
                  helperText="e.g. Rs."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Date Display Format"
                  value={settingsMap.dateFormat || 'YYYY-MM-DD'}
                  onChange={(e) =>
                    setSettingsMap({ ...settingsMap, dateFormat: e.target.value })
                  }
                  helperText="e.g. YYYY-MM-DD"
                />
                <Input
                  label="Default Sales Tax %"
                  value={settingsMap.defaultTaxRate || '0'}
                  onChange={(e) =>
                    setSettingsMap({ ...settingsMap, defaultTaxRate: e.target.value })
                  }
                  helperText="0% for standard exempt medicine"
                />
              </div>

              <Input
                label="Invoice Legal Disclaimer / Footer Note"
                value={settingsMap.invoiceFooterNote || ''}
                onChange={(e) =>
                  setSettingsMap({
                    ...settingsMap,
                    invoiceFooterNote: e.target.value,
                  })
                }
                helperText="Printed on bottom of customer sales invoices"
              />

              <div className="flex justify-end pt-2 border-t border-surface-border">
                <Button
                  type="submit"
                  variant="primary"
                  size="xs"
                  disabled={isSavingSettings}
                >
                  <Save className="h-3.5 w-3.5 mr-1" />
                  {isSavingSettings ? 'Saving...' : 'Save General Settings'}
                </Button>
              </div>
            </form>
          </Card>

          {/* Station Backend Connection */}
          <Card
            header={
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-brand-500" />
                <span>LAN Desktop Station Endpoint</span>
              </div>
            }
          >
            <form onSubmit={handleSaveApiUrl} className="space-y-4">
              <p className="text-xs text-charcoal-600">
                Configure the HTTP REST API endpoint for this desktop client station.
              </p>

              <Input
                label="Backend API Base URL"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                helperText="Default: http://localhost:3000/api/v1"
              />

              <div className="flex items-center justify-between pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => {
                    setUrlInput('http://localhost:3000/api/v1');
                    setApiBaseUrl('http://localhost:3000/api/v1');
                  }}
                >
                  Reset Default
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="xs"
                    disabled={isTestingHealth}
                    onClick={() => testHealth()}
                  >
                    <RefreshCw
                      className={`h-3 w-3 mr-1 ${
                        isTestingHealth ? 'animate-spin' : ''
                      }`}
                    />
                    Test Connection
                  </Button>
                  <Button type="submit" variant="primary" size="xs">
                    <Save className="h-3 w-3 mr-1" />
                    Save URL
                  </Button>
                </div>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* TAB 5: AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <Card
          header={
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-brand-500" />
                <span>System Security & Operational Audit Trail</span>
              </div>
              <Button
                variant="outline"
                size="xs"
                onClick={() => loadAudit(auditPage)}
                disabled={isLoadingAudit}
              >
                <RefreshCw
                  className={`h-3 w-3 mr-1 ${
                    isLoadingAudit ? 'animate-spin' : ''
                  }`}
                />
                Refresh
              </Button>
            </div>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-surface-border text-charcoal-500 bg-surface-muted">
                  <th className="py-2 px-3 font-semibold">Timestamp</th>
                  <th className="py-2 px-3 font-semibold">User</th>
                  <th className="py-2 px-3 font-semibold">Action</th>
                  <th className="py-2 px-3 font-semibold">Entity</th>
                  <th className="py-2 px-3 font-semibold">Details</th>
                  <th className="py-2 px-3 font-semibold">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-surface-muted/50">
                    <td className="py-2 px-3 text-charcoal-600 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-2 px-3 font-medium text-charcoal-900">
                      {log.user?.displayName || log.user?.username || 'System'}
                    </td>
                    <td className="py-2 px-3">
                      <span className="font-mono font-semibold text-[11px] text-brand-600">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-medium text-charcoal-700">
                      {log.entity}
                    </td>
                    <td className="py-2 px-3 font-mono text-[11px] text-charcoal-600 max-w-xs truncate">
                      {log.details ? JSON.stringify(log.details) : '—'}
                    </td>
                    <td className="py-2 px-3 text-charcoal-500">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                  </tr>
                ))}
                {auditLogs.length === 0 && !isLoadingAudit && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-charcoal-400">
                      No audit records logged yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {auditTotal > 15 && (
            <Pagination
              currentPage={auditPage}
              totalPages={Math.ceil(auditTotal / 15)}
              totalItems={auditTotal}
              pageSize={15}
              onPageChange={loadAudit}
              showPageSizeSelector={false}
            />
          )}
        </Card>
      )}
    </div>
  );
};
