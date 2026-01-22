import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

interface ValidationSchema {
    body?: AnyZodObject;
    query?: AnyZodObject;
    params?: AnyZodObject;
}

/**
 * Validate request against Zod schema
 */
export const validateRequest = (schema: ValidationSchema) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (schema.body) {
                req.body = await schema.body.parseAsync(req.body);
            }

            if (schema.query) {
                req.query = await schema.query.parseAsync(req.query);
            }

            if (schema.params) {
                req.params = await schema.params.parseAsync(req.params);
            }

            next();
        } catch (error) {
            if (error instanceof ZodError) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Validation failed',
                        details: error.errors.reduce((acc, curr) => {
                            const key = curr.path.join('.');
                            if (!acc[key]) acc[key] = [];
                            acc[key].push(curr.message);
                            return acc;
                        }, {} as Record<string, string[]>),
                    },
                });
            }
            next(error);
        }
    };
};
