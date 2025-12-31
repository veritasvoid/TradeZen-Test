import React from 'react';
import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';

export const AppShell = () => {
  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Outlet />
      <BottomNav />
    </div>
  );
};
