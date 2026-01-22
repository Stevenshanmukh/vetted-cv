/**
 * Provider Configuration
 * Metadata for all supported AI providers
 */

export interface ProviderConfig {
    id: string;
    name: string;
    icon: string;
    keyPattern: RegExp;
    keyPlaceholder: string;
    docsUrl: string;
    model: string;
    description: string;
}

export const PROVIDER_CONFIGS: Record<string, ProviderConfig> = {
    openai: {
        id: 'openai',
        name: 'OpenAI',
        icon: 'smart_toy',
        keyPattern: /^sk-[a-zA-Z0-9\-_]{20,}$/,
        keyPlaceholder: 'sk-...',
        docsUrl: 'https://platform.openai.com/api-keys',
        model: 'gpt-4o-mini',
        description: 'GPT-4o Mini - Fast and cost-effective',
    },
    anthropic: {
        id: 'anthropic',
        name: 'Claude (Anthropic)',
        icon: 'psychology',
        keyPattern: /^sk-ant-[a-zA-Z0-9\-_]{20,}$/,
        keyPlaceholder: 'sk-ant-...',
        docsUrl: 'https://console.anthropic.com/settings/keys',
        model: 'claude-3-haiku-20240307',
        description: 'Claude 3 Haiku - Fast and efficient',
    },
    google: {
        id: 'google',
        name: 'Gemini (Google)',
        icon: 'auto_awesome',
        keyPattern: /^AI[a-zA-Z0-9\-_]{20,}$/,
        keyPlaceholder: 'AI...',
        docsUrl: 'https://aistudio.google.com/app/apikey',
        model: 'gemini-1.5-flash',
        description: 'Gemini 1.5 Flash - Google AI',
    },
    perplexity: {
        id: 'perplexity',
        name: 'Perplexity',
        icon: 'explore',
        keyPattern: /^.{20,}$/,
        keyPlaceholder: 'pplx-...',
        docsUrl: 'https://perplexity.ai/settings/api',
        model: 'sonar',
        description: 'Llama 3.1 Sonar - With web search',
    },
};

export const SUPPORTED_PROVIDERS = Object.keys(PROVIDER_CONFIGS);
