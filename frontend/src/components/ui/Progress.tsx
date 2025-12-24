'use client';

import * as ProgressPrimitive from '@radix-ui/react-progress';
import { cn, getScoreBgColor } from '@/lib/utils';

export interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  colorByScore?: boolean;
}

export function Progress({
  value,
  max = 100,
  className,
  showLabel = false,
  size = 'md',
  colorByScore = false,
}: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const sizes = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  return (
    <div className={cn('w-full', className)}>
      <ProgressPrimitive.Root
        className={cn(
          'relative overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700',
          sizes[size]
        )}
      >
        <ProgressPrimitive.Indicator
          className={cn(
            'h-full transition-all duration-300 ease-out rounded-full',
            colorByScore ? getScoreBgColor(value) : 'bg-primary'
          )}
          style={{ width: `${percentage}%` }}
        />
      </ProgressPrimitive.Root>
      {showLabel && (
        <div className="flex justify-between mt-1 text-sm text-text-secondary dark:text-text-secondary-dark">
          <span>{value}</span>
          <span>{max}</span>
        </div>
      )}
    </div>
  );
}

