'use client';

import { useTheme } from '@/context/ThemeContext';

interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {
  const { resolvedTheme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="sticky top-0 z-40 bg-surface-light/80 dark:bg-surface-dark/80 backdrop-blur-sm border-b border-border-light dark:border-border-dark">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Mobile menu button */}
        <button className="lg:hidden p-2 -ml-2 text-text-secondary hover:text-text-primary dark:text-text-secondary-dark dark:hover:text-text-primary-dark">
          <span className="material-symbols-outlined">menu</span>
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
          <button className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-gray-100 dark:text-text-secondary-dark dark:hover:text-text-primary-dark dark:hover:bg-gray-800 transition-colors relative">
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full"></span>
          </button>

          {/* User avatar */}
          <button className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-medium text-primary">AJ</span>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}

