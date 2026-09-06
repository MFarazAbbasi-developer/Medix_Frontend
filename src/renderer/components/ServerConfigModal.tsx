import React, { useState } from 'react';
import { Server, Check, X } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

interface ServerConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ServerConfigModal: React.FC<ServerConfigModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { apiBaseUrl, setApiBaseUrl } = useAppStore();
  const [urlInput, setUrlInput] = useState(apiBaseUrl);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Basic URL format validation
      new URL(urlInput);
      setApiBaseUrl(urlInput);
      onClose();
    } catch {
      setError('Please enter a valid HTTP/HTTPS URL (e.g., http://192.168.1.100:3000/api/v1)');
    }
  };

  const handleResetDefault = () => {
    const defaultUrl = 'http://localhost:3000/api/v1';
    setUrlInput(defaultUrl);
    setApiBaseUrl(defaultUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded bg-surface-card border border-surface-border shadow-lg">
        <div className="flex items-center justify-between border-b border-surface-border px-4 py-3 bg-surface-muted/50">
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4 text-brand-500" />
            <h2 className="text-xs font-semibold text-charcoal-800">
              Server & Network Configuration
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-charcoal-400 hover:text-charcoal-700 p-0.5 rounded"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-4 space-y-4">
          <p className="text-xs text-charcoal-600 leading-relaxed">
            Medix connects to a central NestJS server. For single-PC deployment, use localhost. For multi-PC/LAN deployment, enter the central server PC's LAN IP address.
          </p>

          <Input
            label="Backend REST API URL"
            value={urlInput}
            onChange={(e) => {
              setUrlInput(e.target.value);
              setError(null);
            }}
            placeholder="http://192.168.1.50:3000/api/v1"
            error={error || undefined}
            helperText="Default: http://localhost:3000/api/v1"
          />

          <div className="flex items-center justify-between pt-2">
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={handleResetDefault}
            >
              Reset to Localhost
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" size="xs" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="xs">
                <Check className="h-3.5 w-3.5 mr-1" />
                Save & Connect
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
