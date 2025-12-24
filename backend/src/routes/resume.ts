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
 * POST /api/resume/generate
 * Generate a new resume
 */
router.post(
  '/generate',
  validateRequest(generateInputSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { jobDescriptionId, strategy } = req.body;
      const resume = await resumeGeneratorService.generateResume(jobDescriptionId, strategy);
      
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
 * POST /api/resume/score
 * Score a resume
 */
router.post(
  '/score',
  validateRequest(scoreInputSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { resumeId } = req.body;
      const score = await atsScorerService.scoreResume(resumeId);
      
      // Parse JSON fields
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
router.get('/history', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const resumes = await resumeGeneratorService.getResumeHistory();
    
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
 * GET /api/resume/:id
 * Get resume by ID
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const resume = await resumeGeneratorService.getResume(req.params.id);
    
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
    await resumeGeneratorService.deleteResume(req.params.id);
    
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
    const resume = await resumeGeneratorService.getResume(req.params.id);
    
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

