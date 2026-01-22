'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardTitle, Button } from '@/components/ui';
import { api } from '@/services/api';

export function OnboardingAISetup() {
    const router = useRouter();
    const [status, setStatus] = useState<{ configured: boolean; activeProvider: string | null } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkStatus();
    }, []);

    const checkStatus = async () => {
        try {
            const result = await api.ai.getStatus();
            if (result.success && result.data) {
                setStatus(result.data);
            }
        } catch (error) {
            console.error('Failed to check AI status', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading || (status?.configured)) {
        return null;
    }

    return (
        <Card className="bg-primary/5 border-primary/20 mb-6">
            <CardContent className="flex flex-col md:flex-row items-center justify-between p-6 gap-4">
                <div className="space-y-2">
                    <CardTitle className="text-xl flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">auto_awesome</span>
                        Power up with AI
                    </CardTitle>
                    <p className="text-sm text-text-secondary dark:text-text-secondary-dark max-w-xl">
                        To get personalized resume optimization and job matching, you need to configure an AI provider.
                        We support OpenAI, Anthropic, Gemini, and Local AI (Ollama).
                    </p>
                </div>
                <Button onClick={() => router.push('/settings')}>
                    Setup AI
                </Button>
            </CardContent>
        </Card>
    );
}
