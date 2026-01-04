import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { initializeSettings } from '@/stores/settingsStore';
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
  const [settingsLoaded, setSettingsLoaded] = React.useState(false);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Load settings from Google Sheets after authentication
  useEffect(() => {
    if (isAuthenticated && !settingsLoaded) {
      const loadSettings = async () => {
        try {
          await initializeSettings();
          console.log('✅ Settings loaded from Google Sheets');
        } catch (error) {
          console.error('Failed to load settings:', error);
        } finally {
          setSettingsLoaded(true);
        }
      };
      
      // Wait a bit for GAPI to be ready
      setTimeout(loadSettings, 500);
    }
  }, [isAuthenticated, settingsLoaded]);

  if (isInitializing || (isAuthenticated && !settingsLoaded)) {
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
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </React.Suspense>
  );
}

export default App;
