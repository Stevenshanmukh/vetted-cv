'use client';

import { useState } from 'react';
import { Loader2, Trash2, Key } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardTitle } from '@/components/ui/Card';
import { APIKeyInput } from './APIKeyInput';
import { toast } from 'sonner';
import { api } from '@/services/api';

interface AIProviderConfig {
    id: string;
    name: string;
    description: string;
    model: string;
    docsUrl: string;
    keyPlaceholder: string;
    keyPrefix: string | null;
    isActive: boolean;
    isValid: boolean;
    isConfigured: boolean;
}

interface AIProviderCardProps {
    config: AIProviderConfig;
    onRefresh: () => void;
}

export function AIProviderCard({ config, onRefresh }: AIProviderCardProps) {
    const [apiKey, setApiKey] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSave = async () => {
        if (!apiKey) return;

        setIsLoading(true);
        try {
            // Validate first
            const validation = await api.ai.validateKey(config.id, apiKey);
            if (!validation.data?.isValid) {
                toast.error(`Invalid API key for ${config.name}`);
                setIsLoading(false);
                return;
            }

            await api.ai.saveKey(config.id, apiKey);
            toast.success(`${config.name} configured successfully`);
            setApiKey('');
            setIsEditing(false);
            onRefresh();
        } catch (error) {
            toast.error('Failed to save API key');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to remove this API key?')) return;

        setIsLoading(true);
        try {
            await api.ai.deleteKey(config.id);
            toast.success('API key removed');
            onRefresh();
        } catch (error) {
            toast.error('Failed to remove API key');
        } finally {
            setIsLoading(false);
        }
    };

    const handleActivate = async () => {
        if (config.isActive) return;

        setIsLoading(true);
        try {
            await api.ai.activateProvider(config.id);
            toast.success(`${config.name} is now active`);
            onRefresh();
        } catch (error) {
            toast.error('Failed to activate provider');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className={config.isActive ? "border-primary/50 shadow-md" : ""}>
            <CardContent className="pt-6 space-y-4">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            {config.name}
                            {config.isActive && <Badge variant="primary">Active</Badge>}
                            {!config.isActive && config.isConfigured && <Badge variant="default">Configured</Badge>}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">{config.description}</p>
                    </div>
                </div>

                <div className="text-sm text-muted-foreground">
                    Model: <span className="font-medium text-foreground">{config.model}</span>
                </div>

                {config.isConfigured && !isEditing ? (
                    <div className="flex items-center justify-between p-3 bg-muted rounded-md bg-gray-50 dark:bg-gray-800">
                        <div className="flex items-center gap-2 font-mono text-sm text-gray-600 dark:text-gray-300">
                            <Key className="h-4 w-4 text-muted-foreground" />
                            {config.keyPrefix || '••••••••'}
                        </div>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>Edit</Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 text-destructive hover:text-destructive" onClick={handleDelete}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <div className="flex gap-2">
                            <APIKeyInput
                                value={apiKey}
                                onChange={setApiKey}
                                placeholder={config.keyPlaceholder}
                                className="flex-1"
                                disabled={isLoading}
                            />
                            <Button onClick={handleSave} disabled={!apiKey || isLoading}>
                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                            </Button>
                        </div>
                        {isEditing && (
                            <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} className="w-full">
                                Cancel
                            </Button>
                        )}
                        <p className="text-xs text-muted-foreground">
                            Get your key from <a href={config.docsUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">here</a>
                        </p>
                    </div>
                )}

                {config.isConfigured && !config.isActive && (
                    <div className="pt-2">
                        <Button
                            variant="secondary"
                            className="w-full"
                            onClick={handleActivate}
                            disabled={isLoading}
                        >
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Set as Active
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
