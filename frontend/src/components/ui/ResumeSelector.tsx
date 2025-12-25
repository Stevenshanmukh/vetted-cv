'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Resume } from '@/services/api';
import Link from 'next/link';

interface ResumeSelectorProps {
  label?: string;
  resumes: Resume[];
  value?: string; // resumeId
  onChange: (resumeId: string) => void;
  error?: string;
  required?: boolean;
  loading?: boolean;
  className?: string;
}

export function ResumeSelector({
  label,
  resumes,
  value,
  onChange,
  error,
  required,
  loading,
  className,
}: ResumeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedResume = resumes.find((r) => r.id === value);

  const filteredResumes = resumes.filter((resume) =>
    resume.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    resume.strategy.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (resumeId: string) => {
    onChange(resumeId);
    setIsOpen(false);
    setSearchQuery('');
  };

  const formatStrategy = (strategy: string) => {
    return strategy.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  // No resumes available
  if (!loading && resumes.length === 0) {
    return (
      <div className={className}>
        {label && (
          <label className="block text-sm font-medium text-text-primary dark:text-text-primary-dark mb-1">
            {label}
            {required && <span className="text-error ml-1">*</span>}
          </label>
        )}
        <div className="p-4 rounded-lg border border-warning/30 bg-warning/5">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-warning">warning</span>
            <div>
              <p className="text-sm font-medium text-text-primary dark:text-text-primary-dark">
                No resumes available
              </p>
              <p className="text-sm text-text-secondary dark:text-text-secondary-dark mt-1">
                Please generate a resume first before tracking applications.
              </p>
              <Link
                href="/job-analysis"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2"
              >
                <span className="material-symbols-outlined text-base">add</span>
                Generate a resume
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {label && (
        <label className="block text-sm font-medium text-text-primary dark:text-text-primary-dark mb-1">
          {label}
          {required && <span className="text-error ml-1">*</span>}
        </label>
      )}

      {/* Select trigger */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setTimeout(() => inputRef.current?.focus(), 100);
        }}
        disabled={loading}
        className={cn(
          'w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-left transition-colors',
          'bg-white dark:bg-gray-800',
          error
            ? 'border-error focus:ring-error/20'
            : 'border-border-light dark:border-border-dark focus:border-primary focus:ring-2 focus:ring-primary/20',
          'text-text-primary dark:text-text-primary-dark',
          loading && 'opacity-50 cursor-not-allowed'
        )}
      >
        <span className="material-symbols-outlined text-lg text-text-muted">description</span>
        {loading ? (
          <span className="text-text-muted">Loading resumes...</span>
        ) : selectedResume ? (
          <div className="flex-1 flex items-center justify-between">
            <span>{selectedResume.title}</span>
            <span className="text-xs text-text-muted">v{selectedResume.version}</span>
          </div>
        ) : (
          <span className="text-text-muted">Select a resume</span>
        )}
        <span className="material-symbols-outlined text-lg text-text-muted ml-auto">
          {isOpen ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {error && <p className="mt-1 text-sm text-error">{error}</p>}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-border-light dark:border-border-dark overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-border-light dark:border-border-dark">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-lg">
                search
              </span>
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search resumes..."
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border-light dark:border-border-dark bg-gray-50 dark:bg-gray-900 text-text-primary dark:text-text-primary-dark focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Options */}
          <div className="max-h-64 overflow-y-auto">
            {filteredResumes.length === 0 ? (
              <div className="p-4 text-center text-text-muted text-sm">
                No resumes found
              </div>
            ) : (
              filteredResumes.map((resume) => (
                <button
                  key={resume.id}
                  type="button"
                  onClick={() => handleSelect(resume.id)}
                  className={cn(
                    'w-full px-3 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors',
                    value === resume.id && 'bg-primary/5'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-text-primary dark:text-text-primary-dark truncate">
                          {resume.title}
                        </span>
                        {value === resume.id && (
                          <span className="material-symbols-outlined text-primary text-base">check</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-text-muted">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary/10 text-primary">
                          {formatStrategy(resume.strategy)}
                        </span>
                        <span>v{resume.version}</span>
                        <span>{formatDate(resume.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

