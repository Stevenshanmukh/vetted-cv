'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Button, Input, Card } from '@/components/ui';

export default function LoginPage() {
  const { login, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);
    
    if (!result.success) {
      setError(result.error || 'Login failed');
    }
    
    setLoading(false);
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dark:bg-background-dark">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background dark:bg-background-dark">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary to-primary-dark items-center justify-center p-12">
        <div className="max-w-md text-white">
          <div className="flex items-center gap-3 mb-8">
            <span className="material-symbols-outlined text-4xl">description</span>
            <h1 className="text-3xl font-bold">Vetted CV</h1>
          </div>
          <h2 className="text-4xl font-bold mb-6">
            Land Your Dream Job with AI-Powered Resumes
          </h2>
          <p className="text-lg text-white/80 mb-8">
            Create ATS-optimized resumes that pass automated screening and impress recruiters. 
            Our intelligent platform analyzes job descriptions and tailors your resume for maximum impact.
          </p>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-success-light">check_circle</span>
              <span>ATS-optimized formatting</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-success-light">check_circle</span>
              <span>Keyword analysis & matching</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-success-light">check_circle</span>
              <span>Recruiter-tested strategies</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 justify-center mb-8">
            <span className="material-symbols-outlined text-3xl text-primary">description</span>
            <h1 className="text-2xl font-bold text-text-primary dark:text-text-primary-dark">Vetted CV</h1>
          </div>

          <Card className="p-8">
            <h2 className="text-2xl font-bold text-text-primary dark:text-text-primary-dark mb-2">
              Welcome back
            </h2>
            <p className="text-text-secondary dark:text-text-secondary-dark mb-6">
              Sign in to your account to continue
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />

              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />

              <Button
                type="submit"
                className="w-full"
                loading={loading}
                disabled={loading}
              >
                Sign In
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-text-secondary dark:text-text-secondary-dark">
                Don&apos;t have an account?{' '}
                <Link href="/register" className="text-primary hover:underline font-medium">
                  Sign up
                </Link>
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

