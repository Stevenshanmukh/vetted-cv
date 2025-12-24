import { Router, Request, Response, NextFunction } from 'express';
import { profileService } from '../services/ProfileService';
import { validateRequest } from '../middleware/validateRequest';
import { z } from 'zod';

const router = Router();

// Validation schemas
const profileInputSchema = z.object({
  personalInfo: z.object({
    firstName: z.string().min(1).max(100),
    lastName: z.string().min(1).max(100),
    email: z.string().email(),
    phone: z.string().optional().nullable(),
    location: z.string().optional().nullable(),
    linkedIn: z.string().optional().nullable(),
    website: z.string().optional().nullable(),
  }).optional(),
  summary: z.string().optional(),
  skills: z.array(z.object({
    categoryName: z.string(),
    skills: z.array(z.string()),
  })).optional(),
  experiences: z.array(z.object({
    title: z.string(),
    company: z.string(),
    location: z.string().optional().nullable(),
    startDate: z.string().or(z.date()),
    endDate: z.string().or(z.date()).optional().nullable(),
    isCurrent: z.boolean().default(false),
    description: z.string(),
    order: z.number().optional(),
  })).optional(),
  projects: z.array(z.object({
    name: z.string(),
    description: z.string(),
    url: z.string().optional().nullable(),
    technologies: z.string().optional().nullable(),
    order: z.number().optional(),
  })).optional(),
  educations: z.array(z.object({
    institution: z.string(),
    degree: z.string(),
    field: z.string().optional().nullable(),
    startDate: z.string().or(z.date()),
    endDate: z.string().or(z.date()).optional().nullable(),
    gpa: z.string().optional().nullable(),
    order: z.number().optional(),
  })).optional(),
  certifications: z.array(z.object({
    name: z.string(),
    issuer: z.string(),
    issueDate: z.string().or(z.date()),
    expiryDate: z.string().or(z.date()).optional().nullable(),
    credentialId: z.string().optional().nullable(),
    credentialUrl: z.string().optional().nullable(),
  })).optional(),
  achievements: z.array(z.object({
    title: z.string(),
    description: z.string(),
    date: z.string().or(z.date()).optional().nullable(),
  })).optional(),
});

/**
 * GET /api/profile
 * Get the user profile
 */
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await profileService.getProfile();
    res.json({
      success: true,
      data: profile,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/profile/save
 * Save profile data
 */
router.post(
  '/save',
  validateRequest(profileInputSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profile = await profileService.saveProfile(req.body);
      res.status(201).json({
        success: true,
        data: profile,
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/profile/completeness
 * Get profile completeness
 */
router.get('/completeness', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await profileService.calculateCompleteness();
    res.json({
      success: true,
      data: result,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

export default router;

