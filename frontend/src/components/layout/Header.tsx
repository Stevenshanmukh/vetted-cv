'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useSidebar } from '@/context/SidebarContext';
import { useToast } from '@/context/ToastContext';
import { api } from '@/services/api';
import { NotificationDropdown } from '../common/NotificationDropdown';

interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const { toggleSidebar, isCollapsed } = useSidebar();
  const { showToast } = useToast();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  const handleLogout = async () => {
    setShowUserMenu(false);
    await logout();
  };

  const handleClearProfile = async () => {
    setClearing(true);
    try {
      const result = await api.profile.clear();
      if (result.success) {
        showToast('success', 'Profile cleared successfully');
        setShowClearConfirm(false);
        setShowUserMenu(false);
        // Refresh the page to show empty profile
        window.location.reload();
      } else {
        showToast('error', result.error?.message || 'Failed to clear profile');
      }
    } catch (error) {
      showToast('error', 'Something went wrong');
    } finally {
      setClearing(false);
    }
  };

  const handleSettings = () => {
    setShowUserMenu(false);
    router.push('/settings');
  };

  // Get user initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-40 bg-surface-light/80 dark:bg-surface-dark/80 backdrop-blur-sm border-b border-border-light dark:border-border-dark">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Sidebar toggle button */}
        <button
          onClick={toggleSidebar}
          className="p-2 -ml-2 text-text-secondary hover:text-text-primary dark:text-text-secondary-dark dark:hover:text-text-primary-dark rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Toggle sidebar"
        >
          <span className="material-symbols-outlined">
            {isCollapsed ? 'menu' : 'menu_open'}
          </span>
        </button>

        {/* Page title */}
        {title && (
          <h1 className="text-xl font-semibold text-text-primary dark:text-text-primary-dark hidden lg:block">
            {title}
          </h1>
        )}

        {/* Right side actions */}
        <div className="flex items-center gap-3 ml-auto">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-gray-100 dark:text-text-secondary-dark dark:hover:text-text-primary-dark dark:hover:bg-gray-800 transition-colors"
            aria-label="Toggle theme"
          >
            <span className="material-symbols-outlined">
              {resolvedTheme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
          </button>


          {/* Notifications */}
          <NotificationDropdown />

          {/* User menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-medium text-primary">
                  {user ? (user.name ? getInitials(user.name) : user.email.charAt(0).toUpperCase()) : '?'}
                </span>
              </div>
              <span className="hidden md:block text-sm font-medium text-text-primary dark:text-text-primary-dark">
                {user?.name || user?.email}
              </span>
              <span className="material-symbols-outlined text-text-muted hidden md:block">
                {showUserMenu ? 'expand_less' : 'expand_more'}
              </span>
            </button>

            {/* Dropdown menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-border-light dark:border-border-dark py-1 z-50">
                <div className="px-4 py-3 border-b border-border-light dark:border-border-dark">
                  <p className="text-sm font-medium text-text-primary dark:text-text-primary-dark">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-xs text-text-muted truncate">
                    {user?.email}
                  </p>
                </div>

                {/* Settings */}
                <button
                  onClick={handleSettings}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-text-primary dark:text-text-primary-dark hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">settings</span>
                  Settings
                </button>

                {/* Clear Profile */}
                {!showClearConfirm ? (
                  <button
                    onClick={() => setShowClearConfirm(true)}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-warning hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">delete_sweep</span>
                    Clear Profile Data
                  </button>
                ) : (
                  <div className="px-4 py-2 bg-warning/10">
                    <p className="text-xs text-warning mb-2">Delete all profile data?</p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleClearProfile}
                        disabled={clearing}
                        className="flex-1 px-2 py-1 text-xs bg-warning text-white rounded hover:bg-warning/80 disabled:opacity-50"
                      >
                        {clearing ? 'Clearing...' : 'Yes, Clear'}
                      </button>
                      <button
                        onClick={() => setShowClearConfirm(false)}
                        className="flex-1 px-2 py-1 text-xs bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 dark:hover:bg-gray-500"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <div className="border-t border-border-light dark:border-border-dark my-1"></div>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-error hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">logout</span>
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
