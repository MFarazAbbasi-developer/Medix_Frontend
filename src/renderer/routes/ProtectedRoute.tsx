import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export const ProtectedRoute: React.FC = () => {
  const { authStatus, user } = useAuthStore();
  const location = useLocation();

  if (authStatus === 'checking') {
    return (
      <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-surface-base select-none">
        <div className="flex flex-col items-center gap-3">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded bg-brand-500 text-sm font-bold text-white shadow-sm">
            M
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-charcoal-600">
            <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
            <span>Verifying station session...</span>
          </div>
        </div>
      </div>
    );
  }

  if (authStatus === 'unauthenticated' || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};
