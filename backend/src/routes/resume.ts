import { Router, Request, Response, NextFunction } from 'express';
import { resumeGeneratorService } from '../services/ResumeGeneratorService';
import { atsScorerService } from '../services/ATSScorerService';
import { validateRequest } from '../middleware/validateRequest';
import { NotFoundError } from '../middleware/errorHandler';
import { z } from 'zod';

const router = Router();

// Validation schemas
const generateInputSchema = z.object({
  jobDescriptionId: z.string().min(1),
  strategy: z.enum([
    'max_ats',
    'recruiter_readability',
    'career_switch',
    'promotion_internal',
    'stretch_role',
  ]),
});

const scoreInputSchema = z.object({
  resumeId: z.string().min(1),
});

/**
 * Helper to parse score JSON fields
 */
function parseScoreJsonFields(score: {
  breakdown: string;
  missingKeywords: string;
  recommendations: string;
  [key: string]: unknown;
}) {
  return {
    ...score,
    breakdown: JSON.parse(score.breakdown),
    missingKeywords: JSON.parse(score.missingKeywords),
    recommendations: JSON.parse(score.recommendations),
  };
}

/**
 * @swagger
 * /api/resume/generate:
 *   post:
 *     summary: Generate ATS-optimized resume
 *     tags: [Resume]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - jobDescriptionId
 *               - strategy
 *             properties:
 *               jobDescriptionId:
 *                 type: string
 *               strategy:
 *                 type: string
 *                 enum: [max_ats, recruiter_readability, career_switch, promotion_internal, stretch_role]
 *     responses:
 *       201:
 *         description: Resume generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Resume'
 */
router.post(
  '/generate',
  validateRequest(generateInputSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profileId = req.profileId!;
      const { jobDescriptionId, strategy } = req.body;
      const resume = await resumeGeneratorService.generateResume(profileId, jobDescriptionId, strategy);
      
      res.status(201).json({
        success: true,
        data: resume,
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/resume/score:
 *   post:
 *     summary: Score resume for ATS and recruiter compatibility
 *     tags: [Resume]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - resumeId
 *             properties:
 *               resumeId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Resume scored successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/ResumeScore'
 */
router.post(
  '/score',
  validateRequest(scoreInputSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profileId = req.profileId!;
      const { resumeId } = req.body;
      
      // Verify ownership
      const resume = await resumeGeneratorService.getResume(resumeId, profileId);
      if (!resume) {
        throw new NotFoundError('Resume');
      }

      const score = await atsScorerService.scoreResume(resumeId);
      
      res.json({
        success: true,
        data: parseScoreJsonFields(score),
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/resume/history
 * Get resume history
 */
router.get('/history', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profileId = req.profileId!;
    const resumes = await resumeGeneratorService.getResumeHistory(profileId);
    
    // Parse JSON fields in scores for each resume
    const resumesWithParsedScores = resumes.map((resume) => ({
      ...resume,
      scores: (resume as { scores?: { breakdown: string; missingKeywords: string; recommendations: string }[] }).scores?.map(parseScoreJsonFields) || [],
    }));

    res.json({
      success: true,
      data: resumesWithParsedScores,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/resume/:id
 * Get resume by ID
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profileId = req.profileId!;
    const resume = await resumeGeneratorService.getResume(req.params.id, profileId);
    
    if (!resume) {
      throw new NotFoundError('Resume');
    }

    // Parse JSON fields in scores
    const resumeWithParsedScores = {
      ...resume,
      scores: (resume as { scores?: { breakdown: string; missingKeywords: string; recommendations: string }[] }).scores?.map(parseScoreJsonFields) || [],
    };

    res.json({
      success: true,
      data: resumeWithParsedScores,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/resume/:id
 * Delete a resume
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profileId = req.profileId!;
    await resumeGeneratorService.deleteResume(req.params.id, profileId);
    
    res.json({
      success: true,
      data: null,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/resume/:id/download
 * Download resume as LaTeX file
 */
router.get('/:id/download', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profileId = req.profileId!;
    const resume = await resumeGeneratorService.getResume(req.params.id, profileId);
    
    if (!resume) {
      throw new NotFoundError('Resume');
    }

    const filename = `${resume.title.replace(/[^a-zA-Z0-9]/g, '_')}.tex`;
    
    res.setHeader('Content-Type', 'application/x-latex');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(resume.latexContent);
  } catch (error) {
    next(error);
  }
});

export default router;
