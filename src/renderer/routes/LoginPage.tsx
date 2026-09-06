import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock, AlertCircle, Server } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useAppStore } from '../store/appStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ServerConfigModal } from '../components/ServerConfigModal';

const loginSchema = z.object({
  username: z
    .string()
    .min(1, 'Username is required')
    .max(100, 'Username too long'),
  password: z
    .string()
    .min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  const { login, authStatus, loginError } = useAuthStore();
  const { apiBaseUrl } = useAppStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  // Redirect to original page or dashboard if already authenticated
  useEffect(() => {
    if (authStatus === 'authenticated') {
      const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [authStatus, navigate, location]);

  const onSubmit = async (data: LoginFormValues) => {
    const success = await login(data.username, data.password);
    if (success) {
      const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  };

  return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-surface-base px-4 py-12 select-none">
      <div className="w-full max-w-sm space-y-5">
        {/* Brand & System Identity */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-brand-500 text-base font-bold text-white shadow-sm mb-1">
            M
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <h1 className="text-lg font-bold tracking-tight text-charcoal-900">
              MEDIX
            </h1>
            <span className="text-xs font-semibold tracking-wider text-brand-500 uppercase">
              by FARMAX
            </span>
          </div>
          <p className="text-xs text-charcoal-500 font-medium">
            Commercial Pharmaceutical Distribution System
          </p>
        </div>

        {/* Login Surface Card */}
        <div className="rounded border border-surface-border bg-surface-card p-6 shadow-sm">
          <div className="border-b border-surface-border pb-3 mb-4">
            <h2 className="text-xs font-bold text-charcoal-800 uppercase tracking-wider">
              Station Authentication
            </h2>
            <p className="text-[11px] text-charcoal-500 mt-0.5">
              Enter your credentials to access the station
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Error Banner */}
            {loginError && (
              <div className="flex items-start gap-2 rounded border border-status-error-border bg-status-error-bg p-2.5 text-xs text-status-error-text">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span className="leading-tight">{loginError}</span>
              </div>
            )}

            {/* Username Input */}
            <div className="space-y-1">
              <label
                htmlFor="username"
                className="block text-xs font-semibold text-charcoal-700"
              >
                Username
              </label>
              <div className="relative">
                <Input
                  id="username"
                  autoFocus
                  autoComplete="username"
                  placeholder="e.g. admin"
                  error={errors.username?.message}
                  {...register('username')}
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1">
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-charcoal-700"
              >
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  error={errors.password?.message}
                  {...register('password')}
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full justify-center"
                isLoading={isSubmitting || authStatus === 'checking'}
              >
                <Lock className="h-3.5 w-3.5 mr-1.5" />
                Sign In to Station
              </Button>
            </div>
          </form>
        </div>

        {/* Server Endpoint Status & LAN Switch */}
        <div className="flex items-center justify-between text-[11px] text-charcoal-500 px-1">
          <div className="flex items-center gap-1.5 truncate max-w-[200px]">
            <Server className="h-3 w-3 shrink-0" />
            <span className="truncate font-mono">{apiBaseUrl}</span>
          </div>
          <button
            type="button"
            onClick={() => setIsConfigModalOpen(true)}
            className="text-brand-600 hover:text-brand-700 font-medium underline"
          >
            Change Server
          </button>
        </div>
      </div>

      <ServerConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
      />
    </div>
  );
};
