import { Router, Request, Response, NextFunction } from 'express';
import { applicationService } from '../services/ApplicationService';
import { validateRequest } from '../middleware/validateRequest';
import { z } from 'zod';

const router = Router();

// Validation schemas
const applicationInputSchema = z.object({
  jobTitle: z.string().min(2).max(100),
  company: z.string().min(2).max(100),
  location: z.string().max(100).optional(),
  jobDescriptionId: z.string().optional(),
  resumeId: z.string().optional(),
  status: z.enum(['applied', 'interview', 'offer', 'rejected', 'withdrawn']).default('applied'),
  appliedDate: z.string().optional(),
  salary: z.string().max(50).optional(),
  notes: z.string().max(2000).optional(),
  applicationUrl: z.string().optional(),
});

const updateApplicationSchema = applicationInputSchema.partial();

/**
 * GET /api/applications
 * Get all applications
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = req.query.status as string | undefined;
    const applications = await applicationService.getApplications(status);
    
    res.json({
      success: true,
      data: applications,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/applications/stats
 * Get application statistics
 */
router.get('/stats', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await applicationService.getStats();
    
    res.json({
      success: true,
      data: stats,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/applications
 * Create a new application
 */
router.post(
  '/',
  validateRequest(applicationInputSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const application = await applicationService.createApplication(req.body);
      
      res.status(201).json({
        success: true,
        data: application,
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/applications/:id
 * Update an application
 */
router.put(
  '/:id',
  validateRequest(updateApplicationSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const application = await applicationService.updateApplication(req.params.id, req.body);
      
      res.json({
        success: true,
        data: application,
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/applications/:id
 * Delete an application
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await applicationService.deleteApplication(req.params.id);
    
    res.json({
      success: true,
      data: null,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

export default router;

