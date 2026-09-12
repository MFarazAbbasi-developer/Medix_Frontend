import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2,
  Search,
  RefreshCw,
  Plus,
  Edit2,
  FileText,
  DollarSign,
  X,
  CheckCircle2,
  AlertCircle,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Pagination } from '../components/ui/Pagination';
import {
  getSuppliers,
  createSupplier,
  updateSupplier,
  getSupplierLedger,
  Supplier,
  SupplierLedgerResponse,
  CreateSupplierPayload,
  UpdateSupplierPayload,
} from '../api';

export const SuppliersPage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalRecords, setTotalRecords] = useState<number>(0);

  // Feedback toast
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4500);
  };

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [ledgerSupplier, setLedgerSupplier] = useState<Supplier | null>(null);
  const [ledgerData, setLedgerData] = useState<SupplierLedgerResponse | null>(null);
  const [ledgerLoading, setLedgerLoading] = useState<boolean>(false);
  const [ledgerDateRange, setLedgerDateRange] = useState<{ startDate: string; endDate: string }>({
    startDate: '',
    endDate: '',
  });

  // Form State
  const [formData, setFormData] = useState<CreateSupplierPayload>({
    code: '',
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    ntn: '',
    strn: '',
    drugLicenseNo: '',
    creditDays: 30,
    creditLimit: 0,
    openingBalance: 0,
    isActive: true,
  });

  // Load suppliers list
  const loadSuppliers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getSuppliers({
        search: search.trim() || undefined,
        isActive: statusFilter === 'ALL' ? undefined : statusFilter === 'ACTIVE',
        page: currentPage,
        limit: 20,
      });
      setSuppliers(res?.items || []);
      setTotalRecords(res?.meta?.total || 0);
      setTotalPages(res?.meta?.totalPages || 1);
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || err.message || 'Failed to load suppliers');
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, currentPage]);

  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  // Handle Form Submit (Create / Edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      showFeedback('error', 'Supplier name and code are required');
      return;
    }

    try {
      if (editingSupplier) {
        const payload: UpdateSupplierPayload = {
          code: formData.code,
          name: formData.name,
          contactPerson: formData.contactPerson || undefined,
          phone: formData.phone || undefined,
          email: formData.email || undefined,
          address: formData.address || undefined,
          city: formData.city || undefined,
          ntn: formData.ntn || undefined,
          strn: formData.strn || undefined,
          drugLicenseNo: formData.drugLicenseNo || undefined,
          creditDays: Number(formData.creditDays) || 30,
          creditLimit: Number(formData.creditLimit) || 0,
          isActive: formData.isActive,
        };
        await updateSupplier(editingSupplier.id, payload);
        showFeedback('success', `Supplier "${formData.name}" updated successfully`);
      } else {
        await createSupplier(formData);
        showFeedback('success', `Supplier "${formData.name}" created successfully`);
      }
      setIsCreateModalOpen(false);
      setEditingSupplier(null);
      loadSuppliers();
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || err.message || 'Failed to save supplier');
    }
  };

  // Open Create Modal
  const openCreateModal = () => {
    setEditingSupplier(null);
    setFormData({
      code: `SUP-${String(suppliers.length + 1).padStart(3, '0')}`,
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      ntn: '',
      strn: '',
      drugLicenseNo: '',
      creditDays: 30,
      creditLimit: 0,
      openingBalance: 0,
      isActive: true,
    });
    setIsCreateModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (sup: Supplier) => {
    setEditingSupplier(sup);
    setFormData({
      code: sup.code,
      name: sup.name,
      contactPerson: sup.contactPerson || '',
      phone: sup.phone || '',
      email: sup.email || '',
      address: sup.address || '',
      city: sup.city || '',
      ntn: sup.ntn || '',
      strn: sup.strn || '',
      drugLicenseNo: sup.drugLicenseNo || '',
      creditDays: sup.creditDays || 30,
      creditLimit: Number(sup.creditLimit) || 0,
      isActive: sup.isActive,
    });
    setIsCreateModalOpen(true);
  };

  // Open Ledger Statement Modal
  const openLedgerModal = async (sup: Supplier) => {
    setLedgerSupplier(sup);
    setLedgerLoading(true);
    try {
      const res = await getSupplierLedger(sup.id, {
        startDate: ledgerDateRange.startDate || undefined,
        endDate: ledgerDateRange.endDate || undefined,
      });
      setLedgerData(res);
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || err.message || 'Failed to load supplier ledger');
    } finally {
      setLedgerLoading(false);
    }
  };

  // Filter Ledger by Date Range
  const handleLedgerDateFilter = async () => {
    if (!ledgerSupplier) return;
    setLedgerLoading(true);
    try {
      const res = await getSupplierLedger(ledgerSupplier.id, {
        startDate: ledgerDateRange.startDate || undefined,
        endDate: ledgerDateRange.endDate || undefined,
      });
      setLedgerData(res);
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || err.message || 'Failed to filter ledger');
    } finally {
      setLedgerLoading(false);
    }
  };

  // Summary Metrics
  const totalPayable = suppliers.reduce(
    (sum, s) => sum + Math.max(0, Number(s.currentBalance || 0)),
    0,
  );
  const activeCount = suppliers.filter((s) => s.isActive).length;

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border text-sm font-medium transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-rose-600" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-brand-600" />
            <h1 className="text-xl font-bold text-charcoal-900">Suppliers & Vendors</h1>
          </div>
          <p className="text-xs text-charcoal-500 mt-1">
            Manage pharmaceutical distributors, trade credit terms, licenses, and payable statements
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={loadSuppliers}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={openCreateModal}
            className="flex items-center gap-1.5 text-xs bg-brand-600 hover:bg-brand-700 text-white"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Supplier</span>
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-white border border-surface-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-charcoal-500">
                Total Suppliers
              </p>
              <p className="text-2xl font-bold text-charcoal-900 mt-1">
                {suppliers.length}
              </p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600">
              <Building2 className="h-5 w-5" />
            </div>
          </div>
          <p className="text-xs text-charcoal-500 mt-2">
            {activeCount} active distributors in network
          </p>
        </Card>

        <Card className="p-4 bg-white border border-surface-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-charcoal-500">
                Outstanding Payables
              </p>
              <p className="text-2xl font-bold text-rose-600 mt-1">
                PKR {totalPayable.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <p className="text-xs text-charcoal-500 mt-2">
            Total trade liabilities to pharmaceutical vendors
          </p>
        </Card>

        <Card className="p-4 bg-white border border-surface-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-charcoal-500">
                Compliance & Licensing
              </p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">
                {suppliers.filter((s) => s.drugLicenseNo || s.ntn).length}
              </p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>
          <p className="text-xs text-charcoal-500 mt-2">
            Verified Drug Sale License / NTN registered
          </p>
        </Card>
      </div>

      {/* Filters Bar */}
      <Card className="p-3 bg-white border border-surface-border flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-80 relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-charcoal-400" />
          <Input
            placeholder="Search by name, code, phone, NTN, city..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-8 text-xs h-9"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-charcoal-500 font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="h-9 px-3 text-xs border border-surface-border rounded bg-white text-charcoal-700 focus:outline-none focus:border-brand-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive Only</option>
          </select>
        </div>
      </Card>

      {/* Suppliers Table */}
      <Card className="overflow-hidden bg-white border border-surface-border shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-surface-muted/60 border-b border-surface-border text-charcoal-600 font-semibold">
                <th className="py-2.5 px-3">Code</th>
                <th className="py-2.5 px-3">Supplier Name</th>
                <th className="py-2.5 px-3">Contact & Phone</th>
                <th className="py-2.5 px-3">City</th>
                <th className="py-2.5 px-3 text-right">Credit Terms</th>
                <th className="py-2.5 px-3 text-right">Current Payable</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-charcoal-400">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-brand-600" />
                    Loading suppliers directory...
                  </td>
                </tr>
              ) : suppliers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-charcoal-500">
                    No suppliers found. Click "Add Supplier" to register one.
                  </td>
                </tr>
              ) : (
                suppliers.map((sup) => {
                  const balanceNum = Number(sup.currentBalance || 0);
                  return (
                    <tr key={sup.id} className="hover:bg-surface-muted/40 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-medium text-charcoal-900">
                        {sup.code}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-charcoal-900">{sup.name}</div>
                        {(sup.ntn || sup.drugLicenseNo) && (
                          <div className="text-[10px] text-charcoal-400 mt-0.5">
                            {sup.ntn ? `NTN: ${sup.ntn} ` : ''}
                            {sup.drugLicenseNo ? `| Lic: ${sup.drugLicenseNo}` : ''}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-charcoal-600">
                        <div>{sup.contactPerson || '-'}</div>
                        {sup.phone && (
                          <div className="text-[11px] text-charcoal-500 flex items-center gap-1 mt-0.5">
                            <Phone className="h-3 w-3" />
                            {sup.phone}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-charcoal-600">
                        {sup.city || '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="font-medium text-charcoal-800">
                          {sup.creditDays} days
                        </div>
                        {Number(sup.creditLimit) > 0 && (
                          <div className="text-[10px] text-charcoal-400">
                            Limit: PKR {Number(sup.creditLimit).toLocaleString()}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold">
                        <span
                          className={
                            balanceNum > 0
                              ? 'text-rose-600'
                              : balanceNum < 0
                              ? 'text-emerald-600'
                              : 'text-charcoal-600'
                          }
                        >
                          PKR {balanceNum.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <StatusBadge variant={sup.isActive ? 'success' : 'neutral'}>
                          {sup.isActive ? 'Active' : 'Disabled'}
                        </StatusBadge>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openLedgerModal(sup)}
                            title="View Sub-Ledger Statement"
                            className="p-1 text-brand-600 hover:bg-brand-50 rounded transition-colors"
                          >
                            <FileText className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => openEditModal(sup)}
                            title="Edit Supplier"
                            className="p-1 text-charcoal-600 hover:bg-surface-muted rounded transition-colors"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalRecords}
            pageSize={20}
            onPageChange={setCurrentPage}
            showPageSizeSelector={false}
          />
        )}
      </Card>

      {/* Add / Edit Supplier Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <Card className="w-full max-w-2xl bg-white border border-surface-border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-surface-border flex items-center justify-between bg-surface-muted/30">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-brand-600" />
                <h2 className="text-sm font-bold text-charcoal-900">
                  {editingSupplier ? `Edit Supplier: ${editingSupplier.name}` : 'Add New Supplier / Vendor'}
                </h2>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-charcoal-400 hover:text-charcoal-700 p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                    Supplier Code *
                  </label>
                  <Input
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g. SUP-001"
                    className="text-xs h-9"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                    Supplier Name *
                  </label>
                  <Input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Getz Pharma Distribution"
                    className="text-xs h-9"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                    Contact Person
                  </label>
                  <Input
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    placeholder="e.g. Muhammad Ali"
                    className="text-xs h-9"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                    Phone / Mobile
                  </label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g. 0300-1234567"
                    className="text-xs h-9"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="orders@supplier.com"
                    className="text-xs h-9"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                    City
                  </label>
                  <Input
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="e.g. Karachi"
                    className="text-xs h-9"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                    Physical Address
                  </label>
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Warehouse / Office address"
                    className="text-xs h-9"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                    National Tax Number (NTN)
                  </label>
                  <Input
                    value={formData.ntn}
                    onChange={(e) => setFormData({ ...formData, ntn: e.target.value })}
                    placeholder="e.g. 1234567-8"
                    className="text-xs h-9"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                    Drug Sale License No.
                  </label>
                  <Input
                    value={formData.drugLicenseNo}
                    onChange={(e) => setFormData({ ...formData, drugLicenseNo: e.target.value })}
                    placeholder="e.g. DSL-KHI-9921"
                    className="text-xs h-9"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                    Credit Period (Days)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.creditDays}
                    onChange={(e) => setFormData({ ...formData, creditDays: parseInt(e.target.value, 10) || 0 })}
                    className="text-xs h-9"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                    Credit Limit (PKR)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.creditLimit}
                    onChange={(e) => setFormData({ ...formData, creditLimit: parseFloat(e.target.value) || 0 })}
                    placeholder="0 for unlimited"
                    className="text-xs h-9"
                  />
                </div>

                {!editingSupplier && (
                  <div>
                    <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                      Initial Opening Balance (PKR)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.openingBalance}
                      onChange={(e) => setFormData({ ...formData, openingBalance: parseFloat(e.target.value) || 0 })}
                      placeholder="e.g. 50000"
                      className="text-xs h-9"
                    />
                    <p className="text-[10px] text-charcoal-400 mt-1">
                      Automatically posts an OPENING_BALANCE ledger entry
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-4">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded border-surface-border text-brand-600 focus:ring-brand-500 h-4 w-4"
                  />
                  <label htmlFor="isActive" className="text-xs font-medium text-charcoal-700">
                    Active Supplier
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-surface-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="bg-brand-600 hover:bg-brand-700 text-white"
                >
                  {editingSupplier ? 'Save Changes' : 'Create Supplier'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Supplier Ledger Statement Modal */}
      {ledgerSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <Card className="w-full max-w-4xl bg-white border border-surface-border shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-surface-border flex items-center justify-between bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <FileText className="h-5 w-5 text-brand-600" />
                <div>
                  <h2 className="text-sm font-bold text-charcoal-900">
                    Supplier Statement: {ledgerSupplier.name} ({ledgerSupplier.code})
                  </h2>
                  <p className="text-[11px] text-charcoal-500">
                    Chronological audit ledger of vendor invoices, receipts, and running balances
                  </p>
                </div>
              </div>
              <button
                onClick={() => setLedgerSupplier(null)}
                className="text-charcoal-400 hover:text-charcoal-700 p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Date Filter & Metrics */}
            <div className="p-4 border-b border-surface-border bg-surface-card flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={ledgerDateRange.startDate}
                  onChange={(e) => setLedgerDateRange({ ...ledgerDateRange, startDate: e.target.value })}
                  className="text-xs h-8 w-36"
                />
                <span className="text-xs text-charcoal-400">to</span>
                <Input
                  type="date"
                  value={ledgerDateRange.endDate}
                  onChange={(e) => setLedgerDateRange({ ...ledgerDateRange, endDate: e.target.value })}
                  className="text-xs h-8 w-36"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleLedgerDateFilter}
                  className="h-8 text-xs px-2.5"
                >
                  Filter
                </Button>
              </div>

              {ledgerData && (
                <div className="flex items-center gap-4 text-xs">
                  <div>
                    <span className="text-charcoal-400">Total Billed:</span>{' '}
                    <span className="font-semibold text-charcoal-900">
                      PKR {Number(ledgerData.summary.totalCredit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div>
                    <span className="text-charcoal-400">Total Paid:</span>{' '}
                    <span className="font-semibold text-emerald-600">
                      PKR {Number(ledgerData.summary.totalDebit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="bg-rose-50 px-2.5 py-1 rounded border border-rose-200">
                    <span className="text-rose-700 font-semibold">
                      Closing Payable: PKR {Number(ledgerData.summary.netBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Statement Table */}
            <div className="overflow-y-auto flex-1 p-4">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-surface-muted/60 border-b border-surface-border text-charcoal-600 font-semibold">
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">Reference #</th>
                    <th className="py-2 px-3">Type</th>
                    <th className="py-2 px-3 text-right">Debit (Paid)</th>
                    <th className="py-2 px-3 text-right">Credit (Billed)</th>
                    <th className="py-2 px-3 text-right">Running Balance</th>
                    <th className="py-2 px-3">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {ledgerLoading ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-charcoal-400">
                        <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-brand-600" />
                        Loading ledger statement...
                      </td>
                    </tr>
                  ) : !ledgerData || ledgerData.items.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-charcoal-500">
                        No financial ledger entries found for this supplier.
                      </td>
                    </tr>
                  ) : (
                    ledgerData.items.map((entry) => (
                      <tr key={entry.id} className="hover:bg-surface-muted/30">
                        <td className="py-2 px-3 text-charcoal-600">
                          {new Date(entry.transactionDate).toLocaleDateString()}
                        </td>
                        <td className="py-2 px-3 font-mono font-medium text-charcoal-900">
                          {entry.referenceNumber}
                        </td>
                        <td className="py-2 px-3">
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              entry.entryType === 'GRN_INVOICE'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : entry.entryType === 'OPENING_BALANCE'
                                ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            {entry.entryType}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right text-emerald-600 font-medium">
                          {Number(entry.debit) > 0
                            ? `PKR ${Number(entry.debit).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                            : '-'}
                        </td>
                        <td className="py-2 px-3 text-right text-rose-600 font-medium">
                          {Number(entry.credit) > 0
                            ? `PKR ${Number(entry.credit).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                            : '-'}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-charcoal-900">
                          PKR {Number(entry.runningBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2 px-3 text-charcoal-500 text-[11px]">
                          {entry.notes || '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-5 py-3 border-t border-surface-border bg-surface-muted/30 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLedgerSupplier(null)}
              >
                Close Statement
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
