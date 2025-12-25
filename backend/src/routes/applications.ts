import { Router, Request, Response, NextFunction } from 'express';
import { applicationService } from '../services/ApplicationService';
import { validateRequest } from '../middleware/validateRequest';
import { z } from 'zod';

const router = Router();

// Validation schemas
const applicationInputSchema = z.object({
  company: z.string().min(2).max(100),
  jobTitle: z.string().min(2).max(100),
  location: z.string().max(100).optional(),
  appliedDate: z.string().min(1, 'Applied date is required'),
  resumeId: z.string().min(1, 'Resume is required'),
  jobDescriptionId: z.string().optional(),
  status: z.enum(['applied', 'interview', 'offer', 'rejected', 'withdrawn']).default('applied'),
  salary: z.string().max(50).optional(),
  notes: z.string().max(2000).optional(),
});

const updateApplicationSchema = applicationInputSchema.partial();

/**
 * GET /api/applications
 * Get all applications
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profileId = req.profileId!;
    const status = req.query.status as string | undefined;
    
    // Log for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log(`📥 GET /api/applications - profileId: ${profileId}, status: ${status || 'all'}`);
    }
    
    const applications = await applicationService.getApplications(profileId, status);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ Returning ${applications.length} applications`);
    }
    
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
router.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profileId = req.profileId!;
    const stats = await applicationService.getStats(profileId);
    
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
      const profileId = req.profileId!;
      const application = await applicationService.createApplication(profileId, req.body);
      
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
      const profileId = req.profileId!;
      const application = await applicationService.updateApplication(req.params.id, profileId, req.body);
      
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
    const profileId = req.profileId!;
    await applicationService.deleteApplication(req.params.id, profileId);
    
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
