import { Router, Request, Response, NextFunction } from 'express';
import { profileService } from '../services/ProfileService';
import { validateRequest } from '../middleware/validateRequest';
import { NotFoundError } from '../middleware/errorHandler';
import { z } from 'zod';

const router = Router();

// Validation schemas - Allow partial updates
const profileInputSchema = z.object({
  personalInfo: z.object({
    firstName: z.string().max(100).optional(),
    lastName: z.string().max(100).optional(),
    email: z.string().email().optional(),
    phone: z.string().optional().nullable(),
    location: z.string().optional().nullable(),
    linkedIn: z.string().optional().nullable(),
    website: z.string().optional().nullable(),
  }).optional(),
  summary: z.string().optional().nullable(),
  skills: z.array(z.object({
    categoryName: z.string(),
    skills: z.array(z.string()),
  })).optional(),
  experiences: z.array(z.object({
    title: z.string().min(1),
    company: z.string().min(1),
    location: z.string().optional().nullable(),
    startDate: z.string().or(z.date()),
    endDate: z.string().or(z.date()).optional().nullable(),
    isCurrent: z.boolean().default(false),
    description: z.string().min(1),
    order: z.number().optional(),
  })).optional(),
  projects: z.array(z.object({
    name: z.string().min(1),
    description: z.string().min(1),
    url: z.string().optional().nullable(),
    technologies: z.string().optional().nullable(),
    order: z.number().optional(),
  })).optional(),
  educations: z.array(z.object({
    institution: z.string().min(1),
    degree: z.string().min(1),
    field: z.string().optional().nullable(),
    startDate: z.string().or(z.date()),
    endDate: z.string().or(z.date()).optional().nullable(),
    gpa: z.string().optional().nullable(),
    order: z.number().optional(),
  })).optional(),
  certifications: z.array(z.object({
    name: z.string().min(1),
    issuer: z.string().min(1),
    issueDate: z.string().or(z.date()),
    expiryDate: z.string().or(z.date()).optional().nullable(),
    credentialId: z.string().optional().nullable(),
    credentialUrl: z.string().optional().nullable(),
  })).optional(),
  achievements: z.array(z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    date: z.string().or(z.date()).optional().nullable(),
  })).optional(),
});

/**
 * @swagger
 * /api/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [Profile]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Profile'
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profileId = req.profileId!;
    const profile = await profileService.getProfile(profileId);
    
    if (!profile) {
      throw new NotFoundError('Profile');
    }

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
 * @swagger
 * /api/profile/save:
 *   post:
 *     summary: Save or update profile data
 *     tags: [Profile]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               personalInfo:
 *                 $ref: '#/components/schemas/PersonalInfo'
 *               summary:
 *                 type: string
 *               skills:
 *                 type: array
 *               experiences:
 *                 type: array
 *     responses:
 *       201:
 *         description: Profile saved successfully
 */
router.post(
  '/save',
  validateRequest(profileInputSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profileId = req.profileId!;
      
      // Log request data in development
      if (process.env.NODE_ENV === 'development') {
        console.log('📥 Saving profile:', JSON.stringify(req.body, null, 2));
      }
      
      const profile = await profileService.saveProfile(profileId, req.body);
      
      res.status(201).json({
        success: true,
        data: profile,
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error: any) {
      // Log error details in development
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Profile save error:', error);
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack,
        });
      }
      next(error);
    }
  }
);

/**
 * GET /api/profile/completeness
 * Get profile completeness
 */
router.get('/completeness', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profileId = req.profileId!;
    const result = await profileService.calculateCompleteness(profileId);
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
