import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Layers,
  Package,
  Users,
  Building2,
  CreditCard,
  History,
  FileText,
  AlertTriangle,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import {
  importsApi,
  ImportType,
  ImportPreviewData,
  ImportJob,
} from '../api/imports.api';
import { useAuthStore } from '../store/authStore';

const IMPORT_TYPE_CONFIG: Record<
  ImportType,
  {
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    warning?: string;
  }
> = {
  PRODUCTS: {
    title: 'Products Master',
    description: 'Import SKUs, brand names, generic formulas, categories, manufacturers, and units',
    icon: Package,
    color: 'text-blue-600 bg-blue-50 border-blue-200',
  },
  CUSTOMERS: {
    title: 'Customers Directory',
    description: 'Import pharmacies, hospitals, clinics, credit days/limits, and drug licenses',
    icon: Users,
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  },
  SUPPLIERS: {
    title: 'Suppliers & Vendors',
    description: 'Import pharmaceutical manufacturers, distributor principals, and payment terms',
    icon: Building2,
    color: 'text-purple-600 bg-purple-50 border-purple-200',
  },
  OPENING_STOCK: {
    title: 'Opening Stock (Batch-Aware)',
    description: 'Bootstrap physical inventory with batch numbers, expiry dates, acquisition costs, and warehouses',
    icon: Layers,
    color: 'text-amber-600 bg-amber-50 border-amber-200',
    warning: 'Opening stock generates authoritative StockMovement ledger entries with acquisition unit costs.',
  },
  CUSTOMER_OPENING_BALANCES: {
    title: 'Customer Opening Balances',
    description: 'Import opening receivable balances as verified CustomerLedgerEntry financial records',
    icon: CreditCard,
    color: 'text-cyan-600 bg-cyan-50 border-cyan-200',
    warning: 'Positive amounts indicate outstanding money owed by customers to your organization.',
  },
  SUPPLIER_OPENING_BALANCES: {
    title: 'Supplier Opening Balances',
    description: 'Import opening payable balances as verified SupplierLedgerEntry financial records',
    icon: CreditCard,
    color: 'text-rose-600 bg-rose-50 border-rose-200',
    warning: 'Positive amounts indicate outstanding payable money owed by your organization to suppliers.',
  },
};

export const ImportsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const userPermissions = user?.permissions || [];
  const canManageImports = userPermissions.includes('imports.manage') || user?.roles?.includes('ADMIN');

  const [activeTab, setActiveTab] = useState<'workspace' | 'history'>('workspace');
  const [selectedType, setSelectedType] = useState<ImportType>('PRODUCTS');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Active validation preview state
  const [activeJob, setActiveJob] = useState<ImportJob | null>(null);
  const [previewData, setPreviewData] = useState<ImportPreviewData | null>(null);
  const [previewTab, setPreviewTab] = useState<'data' | 'errors'>('data');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Import History Query
  const { data: historyData, isLoading: historyLoading, refetch: refetchHistory } = useQuery({
    queryKey: ['import-jobs'],
    queryFn: () => importsApi.findAll({ limit: 50 }),
  });

  // Upload Mutation
  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) throw new Error('Please select a spreadsheet file to upload.');
      setErrorMessage(null);
      setSuccessMessage(null);
      return importsApi.upload(selectedFile, selectedType);
    },
    onSuccess: (data) => {
      setActiveJob(data.job);
      setPreviewData(data.preview);
      if (data.preview.invalidRows > 0) {
        setPreviewTab('errors');
      } else {
        setPreviewTab('data');
      }
      queryClient.invalidateQueries({ queryKey: ['import-jobs'] });
    },
    onError: (err: Error) => {
      setErrorMessage(err.message || 'Failed to parse and validate upload file.');
    },
  });

  // Confirm Mutation
  const confirmMutation = useMutation({
    mutationFn: async () => {
      if (!activeJob) throw new Error('No active import job to confirm.');
      return importsApi.confirm(activeJob.id);
    },
    onSuccess: (job) => {
      setShowConfirmModal(false);
      setSuccessMessage(
        `Import successfully completed! Created/committed ${job.importedRows} records into the system.`,
      );
      setActiveJob(null);
      setPreviewData(null);
      setSelectedFile(null);
      queryClient.invalidateQueries({ queryKey: ['import-jobs'] });
    },
    onError: (err: Error) => {
      setShowConfirmModal(false);
      setErrorMessage(err.message || 'Import execution failed and rolled back.');
    },
  });

  // Cancel Mutation
  const cancelMutation = useMutation({
    mutationFn: async () => {
      if (!activeJob) return;
      return importsApi.cancel(activeJob.id);
    },
    onSuccess: () => {
      setActiveJob(null);
      setPreviewData(null);
      setSelectedFile(null);
      setErrorMessage(null);
      queryClient.invalidateQueries({ queryKey: ['import-jobs'] });
    },
  });

  // Download Template Handler
  const handleDownloadTemplate = async (type: ImportType) => {
    try {
      const blob = await importsApi.downloadTemplate(type);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `medix_${type.toLowerCase()}_template.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      setErrorMessage('Failed to download import template.');
    }
  };

  // Download Errors CSV
  const handleDownloadErrors = async (jobId: string) => {
    try {
      const blob = await importsApi.downloadErrorsCsv(jobId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `import_errors_${jobId.slice(0, 8)}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      setErrorMessage('Failed to export errors CSV.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setActiveJob(null);
      setPreviewData(null);
      setErrorMessage(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
      setActiveJob(null);
      setPreviewData(null);
      setErrorMessage(null);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-4">
        <div>
          <h1 className="text-xl font-bold text-charcoal-900 tracking-tight flex items-center gap-2">
            <UploadCloud className="h-6 w-6 text-brand-600" />
            Data Import & Migration Center
          </h1>
          <p className="text-xs text-charcoal-500 mt-1">
            Standardized data migration engine for master records, batch inventory, and financial balances
          </p>
        </div>

        {/* Workspace vs History Tabs */}
        <div className="flex items-center gap-2 bg-surface-muted p-1 rounded-lg border border-surface-border">
          <button
            onClick={() => setActiveTab('workspace')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === 'workspace'
                ? 'bg-surface-card text-brand-700 shadow-sm border border-surface-border'
                : 'text-charcoal-600 hover:text-charcoal-900'
            }`}
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            New Import
          </button>
          <button
            onClick={() => {
              setActiveTab('history');
              refetchHistory();
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-surface-card text-brand-700 shadow-sm border border-surface-border'
                : 'text-charcoal-600 hover:text-charcoal-900'
            }`}
          >
            <History className="h-3.5 w-3.5" />
            Import History
          </button>
        </div>
      </div>

      {/* Error & Success Banners */}
      {errorMessage && (
        <div className="p-3.5 rounded-lg border border-status-error-border bg-status-error-bg text-status-error-text text-xs flex items-start gap-2 shadow-sm">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold">Import Error: </span>
            {errorMessage}
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-status-error-text/70 hover:text-status-error-text"
          >
            ×
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 rounded-lg border border-status-success-border bg-status-success-bg text-status-success-text text-xs flex items-start gap-2 shadow-xs">
          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-status-success-dot" />
          <div className="flex-1 font-medium">
            <span className="font-semibold">Success: </span>
            {successMessage}
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-status-success-text/70 hover:text-status-success-text"
          >
            ×
          </button>
        </div>
      )}

      {/* TAB 1: WORKSPACE */}
      {activeTab === 'workspace' && (
        <div className="space-y-6">
          {/* STEP 1: SELECT IMPORT TYPE */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-charcoal-500">
                Step 1: Select Import Domain
              </h2>
              <button
                onClick={() => handleDownloadTemplate(selectedType)}
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1.5 transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                Download {IMPORT_TYPE_CONFIG[selectedType].title} Template
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(Object.keys(IMPORT_TYPE_CONFIG) as ImportType[]).map((type) => {
                const cfg = IMPORT_TYPE_CONFIG[type];
                const Icon = cfg.icon;
                const isSelected = selectedType === type;

                return (
                  <div
                    key={type}
                    onClick={() => {
                      setSelectedType(type);
                      setSelectedFile(null);
                      setActiveJob(null);
                      setPreviewData(null);
                    }}
                    className={`cursor-pointer rounded-lg border p-4 transition-all ${
                      isSelected
                        ? 'border-brand-500 bg-brand-50/40 shadow-sm ring-1 ring-brand-500'
                        : 'border-surface-border bg-surface-card hover:border-charcoal-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-md border shrink-0 ${cfg.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-bold text-charcoal-900 truncate">
                            {cfg.title}
                          </h3>
                          {isSelected && (
                            <CheckCircle2 className="h-3.5 w-3.5 text-brand-600 shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-charcoal-500 mt-1 leading-snug line-clamp-2">
                          {cfg.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* STEP 2: UPLOAD SPREADSHEET */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-charcoal-500">
              Step 2: Upload CSV or Excel Spreadsheet (.xlsx / .csv)
            </h2>

            <div
              onDragEnter={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragActive(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragActive(false);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors bg-surface-card ${
                dragActive
                  ? 'border-brand-500 bg-brand-50/50'
                  : 'border-surface-border hover:border-charcoal-400'
              }`}
            >
              <FileSpreadsheet className="h-10 w-10 text-charcoal-400 mx-auto mb-2" />
              <div className="text-xs font-semibold text-charcoal-800">
                {selectedFile ? (
                  <span className="text-brand-700 font-bold">{selectedFile.name}</span>
                ) : (
                  'Drag and drop your spreadsheet here, or click to browse'
                )}
              </div>
              <p className="text-[11px] text-charcoal-500 mt-1">
                Supports CSV and XLSX formats up to 25MB (max 10,000 rows)
              </p>

              <div className="mt-4 flex items-center justify-center gap-3">
                <label className="cursor-pointer px-3.5 py-1.5 rounded-md bg-surface-muted hover:bg-surface-borderStrong text-charcoal-700 text-xs font-semibold border border-surface-border transition-colors">
                  Browse Files
                  <input
                    type="file"
                    accept=".csv, .xlsx, .xls"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>

                {selectedFile && canManageImports && (
                  <button
                    onClick={() => uploadMutation.mutate()}
                    disabled={uploadMutation.isPending}
                    className="px-4 py-1.5 rounded-md bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
                  >
                    {uploadMutation.isPending ? (
                      <>
                        <RefreshCw className="h-3 w-3 animate-spin" />
                        Validating Data...
                      </>
                    ) : (
                      <>
                        <ArrowRight className="h-3.5 w-3.5" />
                        Parse & Validate File
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* STEP 3: PREVIEW & VALIDATION RESULTS */}
          {previewData && (
            <div className="space-y-4 rounded-xl border border-surface-border bg-surface-card p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-border pb-3">
                <div>
                  <h3 className="text-sm font-bold text-charcoal-900 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-brand-600" />
                    Validation Preview: {activeJob?.originalFilename}
                  </h3>
                  <p className="text-[11px] text-charcoal-500 mt-0.5">
                    Previewing {previewData.totalRows} parsed rows for {IMPORT_TYPE_CONFIG[selectedType].title}
                  </p>
                </div>

                {/* Metrics Badges */}
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded bg-surface-muted text-charcoal-700 font-mono text-xs font-semibold border border-surface-border">
                    Total: {previewData.totalRows}
                  </span>
                  <span className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 font-mono text-xs font-semibold border border-emerald-200">
                    Valid: {previewData.validRows}
                  </span>
                  <span className={`px-2.5 py-1 rounded font-mono text-xs font-semibold border ${
                    previewData.invalidRows > 0
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-surface-muted text-charcoal-500 border-surface-border'
                  }`}>
                    Errors: {previewData.invalidRows}
                  </span>
                </div>
              </div>

              {/* Notice / Warning for financial & inventory setups */}
              {IMPORT_TYPE_CONFIG[selectedType].warning && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                  <div>
                    <span className="font-bold">Important Financial/Inventory Notice: </span>
                    {IMPORT_TYPE_CONFIG[selectedType].warning}
                  </div>
                </div>
              )}

              {/* Subtabs: Data Sample vs Error Log */}
              <div className="flex items-center gap-3 border-b border-surface-border pb-2">
                <button
                  onClick={() => setPreviewTab('data')}
                  className={`text-xs font-bold pb-1 transition-colors border-b-2 ${
                    previewTab === 'data'
                      ? 'border-brand-600 text-brand-700'
                      : 'border-transparent text-charcoal-500 hover:text-charcoal-800'
                  }`}
                >
                  Parsed Data Preview ({previewData.previewRows.length} rows sample)
                </button>
                <button
                  onClick={() => setPreviewTab('errors')}
                  className={`text-xs font-bold pb-1 transition-colors border-b-2 flex items-center gap-1.5 ${
                    previewTab === 'errors'
                      ? 'border-brand-600 text-brand-700'
                      : 'border-transparent text-charcoal-500 hover:text-charcoal-800'
                  }`}
                >
                  Detected Issues
                  {previewData.errors.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-600 text-white font-mono">
                      {previewData.errors.length}
                    </span>
                  )}
                </button>

                {previewData.errors.length > 0 && activeJob && (
                  <button
                    onClick={() => handleDownloadErrors(activeJob.id)}
                    className="ml-auto text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
                  >
                    <Download className="h-3 w-3" />
                    Export Error Report CSV
                  </button>
                )}
              </div>

              {/* PREVIEW TAB: DATA */}
              {previewTab === 'data' && (
                <div className="overflow-x-auto border border-surface-border rounded-lg max-h-80 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-surface-muted text-charcoal-700 font-semibold sticky top-0 border-b border-surface-border">
                      <tr>
                        <th className="p-2 w-12 text-center">Row</th>
                        <th className="p-2 w-16 text-center">Status</th>
                        {previewData.previewRows.length > 0 &&
                          Object.keys(previewData.previewRows[0])
                            .filter((k) => !k.startsWith('_'))
                            .map((k) => (
                              <th key={k} className="p-2 font-mono uppercase text-[10px] text-charcoal-600">
                                {k}
                              </th>
                            ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border bg-surface-card">
                      {previewData.previewRows.map((row, idx) => (
                        <tr key={idx} className={row._valid ? 'hover:bg-surface-muted/50' : 'bg-rose-50/50'}>
                          <td className="p-2 text-center font-mono text-charcoal-500">{row._row}</td>
                          <td className="p-2 text-center">
                            {row._valid ? (
                              <span title="Valid row">
                                <CheckCircle2 className="h-4 w-4 text-emerald-600 mx-auto" />
                              </span>
                            ) : (
                              <span title={row._errors?.join(' | ')}>
                                <XCircle className="h-4 w-4 text-rose-600 mx-auto" />
                              </span>
                            )}
                          </td>
                          {Object.keys(row)
                            .filter((k) => !k.startsWith('_'))
                            .map((k) => (
                              <td key={k} className="p-2 text-charcoal-800 truncate max-w-[200px]">
                                {row[k] !== null && row[k] !== undefined ? String(row[k]) : '—'}
                              </td>
                            ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* PREVIEW TAB: ERRORS */}
              {previewTab === 'errors' && (
                <div className="space-y-2">
                  {previewData.errors.length === 0 ? (
                    <div className="p-6 text-center text-xs text-emerald-700 bg-emerald-50 rounded-lg border border-emerald-200">
                      <CheckCircle2 className="h-6 w-6 mx-auto mb-1 text-emerald-600" />
                      Zero blocking validation errors detected. All rows are valid and ready for confirmation.
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-surface-border rounded-lg max-h-80 overflow-y-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-surface-muted text-charcoal-700 font-semibold sticky top-0 border-b border-surface-border">
                          <tr>
                            <th className="p-2 w-16 text-center">Row #</th>
                            <th className="p-2 w-32">Field / Column</th>
                            <th className="p-2 w-44">Error Code</th>
                            <th className="p-2">Message</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-border bg-surface-card">
                          {previewData.errors.map((err, idx) => (
                            <tr key={idx} className="hover:bg-surface-muted/50">
                              <td className="p-2 text-center font-mono font-bold text-rose-700">{err.row}</td>
                              <td className="p-2 font-mono text-charcoal-800 font-semibold">{err.field}</td>
                              <td className="p-2 font-mono text-[11px] text-rose-700 font-semibold">{err.code}</td>
                              <td className="p-2 text-charcoal-800">{err.message}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* EXECUTION ACTION BAR */}
              <div className="flex items-center justify-between pt-3 border-t border-surface-border">
                <button
                  onClick={() => cancelMutation.mutate()}
                  disabled={cancelMutation.isPending}
                  className="px-3.5 py-1.5 rounded-md text-charcoal-600 hover:text-charcoal-900 text-xs font-semibold hover:bg-surface-muted transition-colors flex items-center gap-1.5"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Discard & Start Over
                </button>

                {previewData.invalidRows === 0 && previewData.validRows > 0 && canManageImports && (
                  <button
                    onClick={() => setShowConfirmModal(true)}
                    disabled={confirmMutation.isPending}
                    className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-colors flex items-center gap-2"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Confirm & Execute Import ({previewData.validRows} records)
                  </button>
                )}

                {previewData.invalidRows > 0 && (
                  <div className="text-xs text-rose-700 font-semibold flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4" />
                    Cannot confirm import with {previewData.invalidRows} blocking error(s). Please fix the spreadsheet and re-upload.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: IMPORT HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-charcoal-500">
              Durable Import History & Audit Log
            </h2>
            <button
              onClick={() => refetchHistory()}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${historyLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-surface-border bg-surface-card shadow-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-surface-muted text-charcoal-700 font-semibold border-b border-surface-border">
                <tr>
                  <th className="p-3">Import Type</th>
                  <th className="p-3">Filename</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Total Rows</th>
                  <th className="p-3 text-center">Imported</th>
                  <th className="p-3 text-center">Failed</th>
                  <th className="p-3">Created Date</th>
                  <th className="p-3">User</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {historyLoading ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-charcoal-500 text-xs">
                      Loading import history...
                    </td>
                  </tr>
                ) : !historyData?.items || historyData.items.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-charcoal-500 text-xs">
                      No import jobs recorded yet.
                    </td>
                  </tr>
                ) : (
                  historyData.items.map((job) => (
                    <tr key={job.id} className="hover:bg-surface-muted/50">
                      <td className="p-3 font-semibold text-charcoal-900">
                        {IMPORT_TYPE_CONFIG[job.type]?.title || job.type}
                      </td>
                      <td className="p-3 text-charcoal-700 font-mono text-[11px]">
                        {job.originalFilename}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            job.status === 'COMPLETED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : job.status === 'READY'
                              ? 'bg-blue-100 text-blue-800'
                              : job.status === 'FAILED'
                              ? 'bg-rose-100 text-rose-800'
                              : job.status === 'IMPORTING'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-charcoal-100 text-charcoal-700'
                          }`}
                        >
                          {job.status === 'COMPLETED' && <CheckCircle2 className="h-3 w-3" />}
                          {job.status === 'FAILED' && <XCircle className="h-3 w-3" />}
                          {job.status === 'IMPORTING' && <RefreshCw className="h-3 w-3 animate-spin" />}
                          {job.status === 'READY' && <Clock className="h-3 w-3" />}
                          {job.status}
                        </span>
                      </td>
                      <td className="p-3 text-center font-mono">{job.totalRows}</td>
                      <td className="p-3 text-center font-mono text-emerald-700 font-bold">{job.importedRows}</td>
                      <td className="p-3 text-center font-mono text-rose-700">{job.failedRows}</td>
                      <td className="p-3 text-charcoal-500 text-[11px]">
                        {new Date(job.createdAt).toLocaleString()}
                      </td>
                      <td className="p-3 text-charcoal-700 text-[11px]">
                        {job.createdByUser?.displayName || job.createdByUser?.username || '—'}
                      </td>
                      <td className="p-3 text-right">
                        {job.failedRows > 0 && (
                          <button
                            onClick={() => handleDownloadErrors(job.id)}
                            className="text-brand-600 hover:text-brand-700 font-semibold text-[11px] underline"
                          >
                            Errors CSV
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL */}
      {showConfirmModal && activeJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl bg-surface-card border border-surface-border p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <AlertTriangle className="h-6 w-6" />
              <h3 className="text-base font-bold text-charcoal-900">
                Confirm {IMPORT_TYPE_CONFIG[activeJob.type]?.title} Import
              </h3>
            </div>

            <p className="text-xs text-charcoal-600 leading-relaxed">
              You are about to import <strong className="text-charcoal-900">{activeJob.validRows} records</strong> from file <code className="bg-surface-muted px-1.5 py-0.5 rounded text-charcoal-800">{activeJob.originalFilename}</code>.
            </p>

            <div className="p-3 rounded-lg bg-surface-muted text-xs text-charcoal-700 border border-surface-border space-y-1">
              <div className="font-semibold text-charcoal-900">Transactional Safety Guarantee:</div>
              <div>• All records will be validated and executed inside a single database transaction.</div>
              <div>• If any database constraint fails, the entire import will roll back automatically.</div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={confirmMutation.isPending}
                className="px-4 py-1.5 rounded-md text-charcoal-600 hover:text-charcoal-900 text-xs font-semibold border border-surface-border hover:bg-surface-muted"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmMutation.mutate()}
                disabled={confirmMutation.isPending}
                className="px-4 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5"
              >
                {confirmMutation.isPending ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    Executing Import...
                  </>
                ) : (
                  'Yes, Execute Import'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
