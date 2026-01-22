import prisma from '../prisma';
import { AIProvider, AICallOptions, AICallResult } from './ai/AIProvider';
import { openAIProvider } from './ai/OpenAIProvider';
import { anthropicProvider } from './ai/AnthropicProvider';
import { googleProvider } from './ai/GoogleProvider';
import { perplexityProvider } from './ai/PerplexityProvider';
import { encryptionService } from './EncryptionService';
import { PROVIDER_CONFIGS, SUPPORTED_PROVIDERS } from './ai/providerConfig';
import { NotFoundError } from '../middleware/errorHandler';

class AIProviderService {
    private providers: Map<string, AIProvider>;

    constructor() {
        this.providers = new Map();
        this.providers.set('openai', openAIProvider);
        this.providers.set('anthropic', anthropicProvider);
        this.providers.set('google', googleProvider);
        this.providers.set('perplexity', perplexityProvider);
    }

    /**
     * Get formatted list of supported providers
     */
    getAvailableProviders() {
        return SUPPORTED_PROVIDERS.map(id => PROVIDER_CONFIGS[id]);
    }

    /**
     * Get user's configured keys (masked)
     */
    async getUserProviders(userId: string) {
        const keys = await prisma.aIProviderKey.findMany({
            where: { userId },
            select: {
                provider: true,
                keyPrefix: true,
                isActive: true,
                isValid: true,
                lastUsedAt: true,
                createdAt: true,
            },
        });

        return keys;
    }

    /**
     * Check if user has any active provider
     */
    async hasActiveProvider(userId: string): Promise<boolean> {
        const activeKey = await prisma.aIProviderKey.findFirst({
            where: { userId, isActive: true, isValid: true },
        });
        return !!activeKey;
    }

    /**
     * Save and validate a new API key
     */
    async saveApiKey(userId: string, provider: string, apiKey: string): Promise<void> {
        if (!SUPPORTED_PROVIDERS.includes(provider)) {
            throw new Error(`Unsupported provider: ${provider}`);
        }

        // Validate format
        if (!encryptionService.validateKeyFormat(provider, apiKey)) {
            throw new Error(`Invalid API key format for ${provider}`);
        }

        // Validate with provider API
        const aiProvider = this.providers.get(provider);
        if (!aiProvider) {
            throw new Error(`Provider implementation not found for ${provider}`);
        }

        const isValid = await aiProvider.validateKey(apiKey);
        if (!isValid) {
            throw new Error(`Invalid API key. Authentication failed with ${provider}.`);
        }

        // Encrypt and save
        const encryptedKey = encryptionService.encrypt(apiKey);
        const keyPrefix = encryptionService.generateKeyPrefix(apiKey);

        // If this is the first valid key, make it active automatically
        const existingKeys = await prisma.aIProviderKey.count({
            where: { userId, isValid: true },
        });
        const shouldActivate = existingKeys === 0;

        await prisma.aIProviderKey.upsert({
            where: {
                userId_provider: { userId, provider }
            },
            update: {
                encryptedKey,
                keyPrefix,
                isValid: true,
                isActive: shouldActivate, // Only activate if it's the first key or was already active
            },
            create: {
                userId,
                provider,
                encryptedKey,
                keyPrefix,
                isValid: true,
                isActive: shouldActivate,
            },
        });

        // If we just activated this one, deactivate others to ensure only one is active
        if (shouldActivate) {
            await this.setActiveProvider(userId, provider);
        }
    }

    /**
     * Set the active provider for a user
     */
    async setActiveProvider(userId: string, provider: string): Promise<void> {
        // Verify key exists and is valid
        const key = await prisma.aIProviderKey.findUnique({
            where: { userId_provider: { userId, provider } },
        });

        if (!key) {
            throw new NotFoundError('Provider configuration');
        }

        if (!key.isValid) {
            throw new Error('Cannot activate an invalid API key');
        }

        // Deactivate all others
        await prisma.aIProviderKey.updateMany({
            where: { userId, provider: { not: provider } },
            data: { isActive: false },
        });

        // Activate target
        await prisma.aIProviderKey.update({
            where: { userId_provider: { userId, provider } },
            data: { isActive: true },
        });
    }

    /**
     * Delete a provider key
     */
    async deleteApiKey(userId: string, provider: string): Promise<void> {
        await prisma.aIProviderKey.delete({
            where: { userId_provider: { userId, provider } },
        });

        // If we deleted the active provider, try to activate another valid one
        const activeKey = await prisma.aIProviderKey.findFirst({
            where: { userId, isActive: true },
        });

        if (!activeKey) {
            const nextValid = await prisma.aIProviderKey.findFirst({
                where: { userId, isValid: true },
                orderBy: { updatedAt: 'desc' },
            });

            if (nextValid) {
                await this.setActiveProvider(userId, nextValid.provider);
            }
        }
    }

    /**
     * Get the active provider instance and key for a user
     */
    async getActiveProvider(userId: string): Promise<{ provider: AIProvider; apiKey: string }> {
        const activeConfig = await prisma.aIProviderKey.findFirst({
            where: { userId, isActive: true },
        });

        if (!activeConfig) {
            throw new Error('No active AI provider configured');
        }

        const provider = this.providers.get(activeConfig.provider);
        if (!provider) {
            throw new Error(`Provider implementation missing for ${activeConfig.provider}`);
        }

        const apiKey = encryptionService.decrypt(activeConfig.encryptedKey);

        // Update last used timestamp (async, don't wait)
        prisma.aIProviderKey.update({
            where: { id: activeConfig.id },
            data: { lastUsedAt: new Date() },
        }).catch(err => console.error('Failed to update lastUsedAt:', err));

        return { provider, apiKey };
    }

    /**
     * Make an AI call using the user's active provider
     */
    async call(userId: string, prompt: string, options: AICallOptions = {}): Promise<AICallResult> {
        const { provider, apiKey } = await this.getActiveProvider(userId);
        return provider.call(prompt, apiKey, options);
    }

    /**
     * Make an AI call expecting JSON using the user's active provider
     */
    async callJSON<T>(userId: string, prompt: string, options: AICallOptions = {}): Promise<T> {
        const { provider, apiKey } = await this.getActiveProvider(userId);
        return provider.callJSON<T>(prompt, apiKey, options);
    }

    /**
     * Test a specific key without saving (for validation endpoint)
     */
    async validateKey(provider: string, apiKey: string): Promise<boolean> {
        const aiProvider = this.providers.get(provider);
        if (!aiProvider) {
            throw new Error('Provider not found');
        }
        return aiProvider.validateKey(apiKey);
    }
}

export const aiProviderService = new AIProviderService();
