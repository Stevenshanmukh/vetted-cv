import React, { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { AlertCircle, Key } from 'lucide-react';
import Link from 'next/link';

interface AIConfigCheckProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

export const AIConfigCheck: React.FC<AIConfigCheckProps> = ({ children, fallback }) => {
    const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkStatus();
    }, []);

    const checkStatus = async () => {
        try {
            const response = await api.ai.getStatus();
            if (response && response.success && response.data) {
                setIsConfigured(response.data.configured);
            } else {
                setIsConfigured(false);
            }
        } catch (e) {
            console.error('Failed to check AI status', e);
            // If network fails, we probably shouldn't block access unless we are sure, 
            // but strictly speaking safe default is block or show error.
            // For now assume false to be safe (Require AI).
            setIsConfigured(false);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!isConfigured) {
        if (fallback) return <>{fallback}</>;

        return (
            <div className="w-full max-w-2xl mx-auto p-4">
                <Card className="p-8 border-amber-200 bg-amber-50 shadow-sm">
                    <div className="flex flex-col items-center text-center gap-6">
                        <div className="bg-amber-100 p-4 rounded-full">
                            <Key className="w-10 h-10 text-amber-600" />
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-xl font-bold text-amber-900">AI Provider Required</h3>
                            <p className="text-amber-700 max-w-md mx-auto">
                                This feature requires an active AI provider (OpenAI, Anthropic, or Gemini) to function.
                                Please configure your API key in settings to continue.
                            </p>
                        </div>

                        <Link href="/settings">
                            <Button size="lg" className="gap-2 bg-amber-600 hover:bg-amber-700 text-white border-none">
                                Configure AI Settings
                            </Button>
                        </Link>
                    </div>
                </Card>
            </div>
        );
    }

    return <>{children}</>;
};
