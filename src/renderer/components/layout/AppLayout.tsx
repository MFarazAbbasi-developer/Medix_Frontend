import React from 'react';
import { Outlet } from 'react-router-dom';
import { AppHeader } from './AppHeader';
import { AppSidebar } from './AppSidebar';
import { CommandPalette } from '../ui/CommandPalette';

export const AppLayout: React.FC = () => {
  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-surface-base">
      <AppHeader />
      <div className="flex flex-1 overflow-hidden">
        <AppSidebar />
        <main className="flex-1 overflow-y-auto p-3 md:p-4 lg:p-5 w-full">
          <Outlet />
        </main>
      </div>
      <CommandPalette />
    </div>
  );
};
