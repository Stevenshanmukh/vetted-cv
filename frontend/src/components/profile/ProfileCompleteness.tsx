import React from 'react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/Progress';
import { Badge } from '@/components/ui/Badge';

interface ProfileCompletenessProps {
    percent: number;
    missing?: string[];
    className?: string;
    variant?: 'compact' | 'full';
}

export function ProfileCompleteness({
    percent,
    missing = [],
    className,
    variant = 'full',
}: ProfileCompletenessProps) {
    const getStatusColor = (p: number) => {
        if (p >= 80) return 'text-success';
        if (p >= 50) return 'text-warning';
        return 'text-error';
    };

    const getStatusText = (p: number) => {
        if (p >= 80) return 'Ready to Apply';
        if (p >= 50) return 'Getting There';
        return 'Needs Work';
    };

    const getStatusBadge = (p: number) => {
        if (p >= 80) return <Badge variant="success">Great</Badge>;
        if (p >= 50) return <Badge variant="warning">Good</Badge>;
        return <Badge variant="error">Low</Badge>;
    };

    return (
        <div className={cn('space-y-3', className)}>
            {variant === 'full' && (
                <div className="flex items-end justify-between">
                    <div>
                        <span className={cn('text-4xl font-bold transition-colors', getStatusColor(percent))}>
                            {percent}%
                        </span>
                        <span className="text-sm text-text-muted ml-2">Complete</span>
                    </div>
                    <div className="flex flex-col items-end">
                        {getStatusBadge(percent)}
                        <span className="text-xs text-text-muted mt-1">{getStatusText(percent)}</span>
                    </div>
                </div>
            )}

            {variant === 'compact' && (
                <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">Profile Completeness</span>
                    <span className={cn('font-bold', getStatusColor(percent))}>{percent}%</span>
                </div>
            )}

            <Progress value={percent} colorByScore className="h-2.5" />

            {missing.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 text-sm">
                    <p className="font-medium text-text-secondary dark:text-text-secondary-dark mb-1">
                        Recommended Actions:
                    </p>
                    <ul className="space-y-1">
                        {missing.slice(0, 3).map((item, i) => (
                            <li key={i} className="flex items-center gap-2 text-text-muted">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                                {item}
                            </li>
                        ))}
                        {missing.length > 3 && (
                            <li className="text-xs text-text-muted pl-3.5">
                                + {missing.length - 3} more
                            </li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}
