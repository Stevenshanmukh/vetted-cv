'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/context/SidebarContext';

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { href: '/profile', label: 'Profile Builder', icon: 'person' },
  { href: '/job-analysis', label: 'Job Analysis', icon: 'work' },
  { href: '/resumes', label: 'Resume Library', icon: 'description' },
  { href: '/applications', label: 'Applications', icon: 'assignment' },
  { href: '/resume-history', label: 'Resume History', icon: 'history' },
];

const secondaryItems: NavItem[] = [
  { href: '/help', label: 'Help & Support', icon: 'help' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed } = useSidebar();

  return (
    <aside className={cn(
      "hidden lg:flex lg:flex-col bg-surface-light dark:bg-surface-dark border-r border-border-light dark:border-border-dark transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Logo */}
      <div className={cn("p-6", isCollapsed && "p-4")}>
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-white">description</span>
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="text-xl font-bold text-text-primary dark:text-text-primary-dark">
                Vetted CV
              </h1>
              <p className="text-xs text-text-muted">Resume Intelligence</p>
            </div>
          )}
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-4 py-2">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn('nav-link', isActive && 'nav-link-active', isCollapsed && 'justify-center')}
                  title={isCollapsed ? item.label : undefined}
                >
                  <span className="material-symbols-outlined">{item.icon}</span>
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Secondary Navigation */}
      <div className="px-4 py-4 border-t border-border-light dark:border-border-dark">
        <ul className="space-y-1">
          {secondaryItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn('nav-link', isActive && 'nav-link-active', isCollapsed && 'justify-center')}
                  title={isCollapsed ? item.label : undefined}
                >
                  <span className="material-symbols-outlined">{item.icon}</span>
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}

