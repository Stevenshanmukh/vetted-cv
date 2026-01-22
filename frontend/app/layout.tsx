import React from 'react';
import type { Metadata } from 'next';
import { ThemeProvider } from '@/context/ThemeContext';
import { ToastProvider } from '@/context/ToastContext';
import { AuthProvider } from '@/context/AuthContext';
import './globals.css';

export const metadata: Metadata = {
  title: 'Vetted CV - Resume Intelligence Platform',
  description: 'Create ATS-optimized, recruiter-approved resumes with evidence-based scoring and explanations.',
  keywords: ['resume', 'cv', 'ats', 'job search', 'career'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
