import express, { Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/authMiddleware';
import { aiProviderService } from '../services/AIProviderService';
import { validateRequest } from '../middleware/validation';
import { z } from 'zod';

const router = express.Router();

/**
 * GET /api/ai/providers
 * List supported providers and user's configured keys (masked)
 */
router.get('/providers', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.userId!;
        const available = aiProviderService.getAvailableProviders();
        const userKeys = await aiProviderService.getUserProviders(userId);

        // Merge available configs with user's keys
        const result = available.map(config => {
            const userKey = userKeys.find(k => k.provider === config.id);
            return {
                ...config,
                isConfigured: !!userKey,
                isActive: userKey?.isActive || false,
                isValid: userKey?.isValid || false,
                keyPrefix: userKey?.keyPrefix || null,
                lastUsedAt: userKey?.lastUsedAt || null,
            };
        });

        res.json({
            success: true,
            data: result,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/ai/providers/:provider/key
 * Save a new API key
 */
router.post(
    '/providers/:provider/key',
    requireAuth,
    validateRequest({
        body: z.object({
            apiKey: z.string().min(10).max(200),
        }),
    }),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.userId!;
            const { provider } = req.params;
            const { apiKey } = req.body;

            await aiProviderService.saveApiKey(userId, provider, apiKey);

            res.status(201).json({
                success: true,
                message: `API key for ${provider} saved successfully`,
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * DELETE /api/ai/providers/:provider/key
 * Remove an API key
 */
router.delete('/providers/:provider/key', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.userId!;
        const { provider } = req.params;

        await aiProviderService.deleteApiKey(userId, provider);

        res.json({
            success: true,
            message: `API key for ${provider} removed`,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/ai/providers/:provider/activate
 * Set a provider as active
 */
router.post('/providers/:provider/activate', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.userId!;
        const { provider } = req.params;

        await aiProviderService.setActiveProvider(userId, provider);

        res.json({
            success: true,
            message: `${provider} is now your active AI provider`,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/ai/providers/:provider/validate
 * Test a key without saving
 */
router.post(
    '/providers/:provider/validate',
    requireAuth,
    validateRequest({
        body: z.object({
            apiKey: z.string().min(10).max(200),
        }),
    }),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { provider } = req.params;
            const { apiKey } = req.body;

            const isValid = await aiProviderService.validateKey(provider, apiKey);

            res.json({
                success: true,
                data: { isValid },
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/ai/status
 * Check if the user has a valid active AI provider
 */
router.get('/status', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.userId!;
        const hasActive = await aiProviderService.hasActiveProvider(userId);

        // Also get which one is active if any
        let activeProvider = null;
        if (hasActive) {
            try {
                const { provider } = await aiProviderService.getActiveProvider(userId);
                activeProvider = provider.name;
            } catch (e) {
                // Ignore error if getActiveProvider fails (e.g. race condition)
            }
        }

        res.json({
            success: true,
            data: {
                configured: hasActive,
                activeProvider,
            },
        });
    } catch (error) {
        next(error);
    }
});

export default router;
