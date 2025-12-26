'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, Button, Input } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import { api } from '@/services/api';

export default function SettingsPage() {
  const { user } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const { showToast } = useToast();
  
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [profileStats, setProfileStats] = useState<{
    percent: number;
    missing: string[];
  } | null>(null);

  useEffect(() => {
    loadProfileStats();
  }, []);

  const loadProfileStats = async () => {
    const result = await api.profile.getCompleteness();
    if (result.success && result.data) {
      setProfileStats(result.data);
    }
  };

  const handleClearProfile = async () => {
    setClearing(true);
    try {
      const result = await api.profile.clear();
      if (result.success) {
        showToast('success', 'Profile cleared successfully');
        setShowClearConfirm(false);
        await loadProfileStats();
      } else {
        showToast('error', result.error?.message || 'Failed to clear profile');
      }
    } catch (error) {
      showToast('error', 'Something went wrong');
    } finally {
      setClearing(false);
    }
  };

  return (
    <MainLayout title="Settings">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle icon="person">Account Information</CardTitle>
          </CardHeader>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Name</label>
                <p className="text-text-primary dark:text-text-primary-dark font-medium">
                  {user?.name || 'Not set'}
                </p>
              </div>
              <div>
                <label className="label">Email</label>
                <p className="text-text-primary dark:text-text-primary-dark font-medium">
                  {user?.email || 'Not set'}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle icon="palette">Appearance</CardTitle>
          </CardHeader>
          <div className="p-6 space-y-4">
            <div>
              <label className="label mb-2 block">Theme</label>
              <div className="flex gap-3">
                <button
                  onClick={() => setTheme('light')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                    resolvedTheme === 'light'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border-light dark:border-border-dark hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <span className="material-symbols-outlined">light_mode</span>
                  Light
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                    resolvedTheme === 'dark'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border-light dark:border-border-dark hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <span className="material-symbols-outlined">dark_mode</span>
                  Dark
                </button>
                <button
                  onClick={() => setTheme('system')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors border-border-light dark:border-border-dark hover:bg-gray-50 dark:hover:bg-gray-800`}
                >
                  <span className="material-symbols-outlined">computer</span>
                  System
                </button>
              </div>
            </div>
          </div>
        </Card>

        {/* Profile Data */}
        <Card>
          <CardHeader>
            <CardTitle icon="folder_data">Profile Data</CardTitle>
          </CardHeader>
          <div className="p-6 space-y-4">
            {profileStats && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-text-secondary dark:text-text-secondary-dark">
                    Profile Completeness
                  </span>
                  <span className="text-sm font-medium text-primary">
                    {profileStats.percent}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${profileStats.percent}%` }}
                  />
                </div>
                {profileStats.missing.length > 0 && (
                  <p className="text-xs text-text-muted mt-2">
                    Missing: {profileStats.missing.join(', ')}
                  </p>
                )}
              </div>
            )}

            <div className="border-t border-border-light dark:border-border-dark pt-4">
              <h4 className="font-medium text-text-primary dark:text-text-primary-dark mb-2">
                Clear Profile Data
              </h4>
              <p className="text-sm text-text-secondary dark:text-text-secondary-dark mb-4">
                This will delete all your profile information including personal info, 
                experiences, education, skills, projects, certifications, and achievements. 
                This action cannot be undone.
              </p>

              {!showClearConfirm ? (
                <Button
                  variant="secondary"
                  icon="delete_sweep"
                  onClick={() => setShowClearConfirm(true)}
                  className="text-warning border-warning hover:bg-warning/10"
                >
                  Clear All Profile Data
                </Button>
              ) : (
                <div className="bg-warning/10 border border-warning rounded-lg p-4">
                  <p className="text-sm text-warning font-medium mb-3">
                    Are you sure you want to delete all your profile data?
                  </p>
                  <div className="flex gap-3">
                    <Button
                      variant="primary"
                      onClick={handleClearProfile}
                      disabled={clearing}
                      className="bg-warning hover:bg-warning/80"
                    >
                      {clearing ? 'Clearing...' : 'Yes, Clear Everything'}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => setShowClearConfirm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* About */}
        <Card>
          <CardHeader>
            <CardTitle icon="info">About</CardTitle>
          </CardHeader>
          <div className="p-6 space-y-2">
            <div className="flex justify-between">
              <span className="text-text-secondary dark:text-text-secondary-dark">Version</span>
              <span className="text-text-primary dark:text-text-primary-dark font-medium">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary dark:text-text-secondary-dark">Build</span>
              <span className="text-text-primary dark:text-text-primary-dark font-medium">MVP</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary dark:text-text-secondary-dark">Developer</span>
              <span className="text-text-primary dark:text-text-primary-dark font-medium">Steven Shanmukh</span>
            </div>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}

