'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';

const steps = [
  {
    title: 'Welcome to Vetted CV',
    description: 'The intelligent resume platform that helps you land your dream job.',
    icon: 'waving_hand',
  },
  {
    title: 'Build Your Profile',
    description: 'Create a comprehensive profile with your experience, skills, and achievements.',
    icon: 'person',
  },
  {
    title: 'Analyze Job Descriptions',
    description: 'Our AI extracts key requirements and keywords from any job posting.',
    icon: 'work',
  },
  {
    title: 'Generate Tailored Resumes',
    description: 'Create ATS-optimized resumes tailored to each specific role.',
    icon: 'description',
  },
  {
    title: 'Get Instant Feedback',
    description: 'Receive ATS and recruiter scores with actionable recommendations.',
    icon: 'analytics',
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      router.push('/profile');
    }
  };

  const handleSkip = () => {
    router.push('/dashboard');
  };

  const step = steps[currentStep];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background-light to-gray-100 dark:from-background-dark dark:to-gray-900 flex items-center justify-center p-6">
      <div className="max-w-lg w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-white text-3xl">description</span>
          </div>
          <h1 className="text-2xl font-bold text-text-primary dark:text-text-primary-dark">
            Vetted CV
          </h1>
        </div>

        {/* Card */}
        <div className="bg-surface-light dark:bg-surface-dark rounded-2xl shadow-lg p-8">
          {/* Progress Dots */}
          <div className="flex justify-center gap-2 mb-8">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentStep(i)}
                className={cn(
                  'w-2 h-2 rounded-full transition-all',
                  i === currentStep
                    ? 'w-8 bg-primary'
                    : i < currentStep
                    ? 'bg-primary/50'
                    : 'bg-gray-300 dark:bg-gray-600'
                )}
              />
            ))}
          </div>

          {/* Content */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-primary text-4xl">
                {step.icon}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-text-primary dark:text-text-primary-dark mb-3">
              {step.title}
            </h2>
            <p className="text-text-secondary dark:text-text-secondary-dark">
              {step.description}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <Button variant="ghost" onClick={handleSkip} className="flex-1">
              Skip
            </Button>
            <Button onClick={handleNext} className="flex-1" icon={currentStep === steps.length - 1 ? 'check' : 'arrow_forward'}>
              {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
            </Button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-text-muted mt-6">
          Resume Intelligence Platform
        </p>
      </div>
    </div>
  );
}

