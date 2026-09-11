import React, { useState, useEffect } from 'react';
import { AlertTriangle, AlertCircle, HelpCircle } from 'lucide-react';
import { Modal, ModalSize } from './Modal';
import { Button } from './Button';
import { Input } from './Input';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => void | Promise<void>;
  title: string;
  description?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'primary' | 'danger' | 'warning';
  size?: ModalSize;
  isLoading?: boolean;
  requiresReason?: boolean;
  reasonLabel?: string;
  reasonPlaceholder?: string;
  reasonRequiredMessage?: string;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  size = 'sm',
  isLoading = false,
  requiresReason = false,
  reasonLabel = 'Reason / Remarks',
  reasonPlaceholder = 'Enter required justification...',
  reasonRequiredMessage = 'Please provide a valid reason to proceed.',
}) => {
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setReason('');
      setReasonError('');
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    if (requiresReason && !reason.trim()) {
      setReasonError(reasonRequiredMessage);
      return;
    }
    setReasonError('');
    await onConfirm(reason.trim() || undefined);
  };

  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />;
      case 'primary':
      default:
        return <HelpCircle className="h-5 w-5 text-brand-600 shrink-0 mt-0.5" />;
    }
  };

  const getButtonVariant = (): 'primary' | 'danger' | 'secondary' => {
    if (variant === 'danger') return 'danger';
    return 'primary';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size={size}
      showCloseButton={!isLoading}
      closeOnClickOutside={!isLoading}
      closeOnEscape={!isLoading}
      title={title}
      footer={
        <>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={getButtonVariant()}
            size="sm"
            onClick={handleConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          {getIcon()}
          <div className="flex-1 space-y-1">
            {typeof description === 'string' ? (
              <p className="text-xs text-charcoal-700 leading-relaxed">
                {description}
              </p>
            ) : (
              description
            )}
          </div>
        </div>

        {requiresReason && (
          <div className="pt-2">
            <Input
              label={reasonLabel}
              placeholder={reasonPlaceholder}
              value={reason}
              error={reasonError}
              onChange={(e) => {
                setReason(e.target.value);
                if (reasonError) setReasonError('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleConfirm();
                }
              }}
              autoFocus
            />
          </div>
        )}
      </div>
    </Modal>
  );
};
