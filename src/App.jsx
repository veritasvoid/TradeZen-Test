import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { AppShell } from '@/components/layout/AppShell';
import { Loading } from '@/components/shared/Loading';

// Lazy load pages
const SignIn = React.lazy(() => import('@/pages/SignIn'));
const Dashboard = React.lazy(() => import('@/pages/Dashboard'));
const MonthView = React.lazy(() => import('@/pages/MonthView'));
const TagsView = React.lazy(() => import('@/pages/TagsView'));
const SettingsView = React.lazy(() => import('@/pages/SettingsView'));

function App() {
  const { isAuthenticated, isInitializing, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loading type="spinner" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <React.Suspense fallback={<Loading type="spinner" />}>
        <SignIn />
      </React.Suspense>
    );
  }

  return (
    <React.Suspense fallback={<Loading type="spinner" />}>
      <Routes>
        <Route path="/" element={<AppShell />}>
          <Route index element={<Dashboard />} />
          <Route path="month" element={<MonthView />} />
          <Route path="month/:year/:month" element={<MonthView />} />
          <Route path="tags" element={<TagsView />} />
          <Route path="settings" element={<SettingsView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </React.Suspense>
  );
}

export default App;
