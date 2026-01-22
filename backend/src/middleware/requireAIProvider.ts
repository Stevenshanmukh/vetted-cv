import { Request, Response, NextFunction } from 'express';
import { aiProviderService } from '../services/AIProviderService';

export async function requireAIProvider(req: Request, res: Response, next: NextFunction) {
    try {
        if (!req.userId) {
            // Should be caught by requireAuth, but just in case
            res.status(401).json({
                success: false,
                error: {
                    code: 'NOT_AUTHENTICATED',
                    message: 'Authentication required.'
                }
            });
            return;
        }

        const hasActive = await aiProviderService.hasActiveProvider(req.userId);
        if (!hasActive) {
            res.status(403).json({
                success: false,
                error: {
                    code: 'AI_NOT_CONFIGURED',
                    message: 'AI features require an API key to be set up before use.'
                }
            });
            return;
        }
        next();
    } catch (error) {
        console.error('Error in requireAIProvider:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to verify AI provider status.'
            }
        });
    }
}
