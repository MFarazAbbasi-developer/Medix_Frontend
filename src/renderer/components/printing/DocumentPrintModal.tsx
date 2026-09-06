import React, { useState, useEffect } from 'react';
import {
  Printer,
  X,
  FileText,
  Receipt,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { PrintLayoutType } from './types';

export interface DocumentPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  defaultLayout?: PrintLayoutType;
  allowThermalToggle?: boolean;
  children: (layout: PrintLayoutType) => React.ReactNode;
}

export const DocumentPrintModal: React.FC<DocumentPrintModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  defaultLayout = 'A4',
  allowThermalToggle = true,
  children,
}) => {
  const [layout, setLayout] = useState<PrintLayoutType>(defaultLayout);
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLayout(defaultLayout);
    }
  }, [isOpen, defaultLayout]);

  // Global hotkeys for the print modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        window.print();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 print:p-0 print:bg-white print:static"
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`printable-modal-content w-full bg-surface-card border border-surface-border rounded-xl shadow-2xl flex flex-col overflow-hidden transition-all duration-200 print:border-none print:shadow-none print:rounded-none print:w-full print:h-auto print:max-w-none ${
          isFullScreen ? 'h-full max-w-none' : 'max-h-[92vh] max-w-5xl'
        }`}
      >
        {/* Modal Toolbar (Hidden during print) */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-surface-border bg-surface-muted/60 print:hidden select-none">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand-50 border border-brand-200 text-brand-700">
              <Printer className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-charcoal-900 tracking-tight">
                {title}
              </h3>
              {subtitle && (
                <p className="text-[11px] text-charcoal-500">{subtitle}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Format Switcher */}
            {allowThermalToggle && (
              <div className="flex items-center p-0.5 rounded-lg bg-surface-muted border border-surface-border">
                <button
                  type="button"
                  onClick={() => setLayout('A4')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                    layout === 'A4'
                      ? 'bg-surface-card text-brand-700 shadow-xs border border-surface-border'
                      : 'text-charcoal-600 hover:text-charcoal-900'
                  }`}
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>A4 Sheet</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLayout('THERMAL')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                    layout === 'THERMAL'
                      ? 'bg-surface-card text-brand-700 shadow-xs border border-surface-border'
                      : 'text-charcoal-600 hover:text-charcoal-900'
                  }`}
                >
                  <Receipt className="h-3.5 w-3.5" />
                  <span>80mm Thermal</span>
                </button>
              </div>
            )}

            {/* Print Action Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
              title="Print Document (Ctrl+P)"
            >
              <Printer className="h-4 w-4" />
              <span>Print (Ctrl+P)</span>
            </button>

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="p-1.5 rounded-md hover:bg-surface-borderStrong text-charcoal-500 hover:text-charcoal-800 transition-colors"
              title={isFullScreen ? 'Exit Full Screen' : 'Full Screen Preview'}
            >
              {isFullScreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-md hover:bg-red-50 text-charcoal-500 hover:text-red-700 transition-colors"
              title="Close (Esc)"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Document Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-charcoal-100/50 print:p-0 print:bg-white print:overflow-visible">
          <div className="printable-document-root flex justify-center">
            {children(layout)}
          </div>
        </div>
      </div>
    </div>
  );
};
