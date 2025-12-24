import { Router, Request, Response, NextFunction } from 'express';
import { jobAnalysisService } from '../services/JobAnalysisService';
import { matchService } from '../services/MatchService';
import { validateRequest } from '../middleware/validateRequest';
import { NotFoundError } from '../middleware/errorHandler';
import { z } from 'zod';

const router = Router();

// Validation schemas
const jobInputSchema = z.object({
  title: z.string().min(2).max(100),
  company: z.string().min(2).max(100),
  descriptionText: z.string().min(100).max(10000),
});

const matchInputSchema = z.object({
  jobDescriptionId: z.string().min(1),
});

/**
 * POST /api/job/analyze
 * Analyze a job description
 */
router.post(
  '/analyze',
  validateRequest(jobInputSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { title, company, descriptionText } = req.body;
      const result = await jobAnalysisService.analyzeJob(title, company, descriptionText);
      
      // Parse JSON fields for response
      const analysis = result.analysis;
      res.status(201).json({
        success: true,
        data: {
          ...result,
          analysis: {
            ...analysis,
            requiredSkills: JSON.parse(analysis.requiredSkills),
            preferredSkills: JSON.parse(analysis.preferredSkills),
            responsibilities: JSON.parse(analysis.responsibilities),
            atsKeywords: JSON.parse(analysis.atsKeywords),
          },
        },
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/job/match
 * Match profile to job description
 */
router.post(
  '/match',
  validateRequest(matchInputSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { jobDescriptionId } = req.body;
      const result = await matchService.matchProfileToJob(jobDescriptionId);
      
      res.json({
        success: true,
        data: result,
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/job/:id
 * Get job description by ID
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const job = await jobAnalysisService.getJobDescription(req.params.id);
    
    if (!job) {
      throw new NotFoundError('Job description');
    }

    // Parse JSON fields
    const data = {
      ...job,
      analysis: job.analysis ? {
        ...job.analysis,
        requiredSkills: JSON.parse(job.analysis.requiredSkills),
        preferredSkills: JSON.parse(job.analysis.preferredSkills),
        responsibilities: JSON.parse(job.analysis.responsibilities),
        atsKeywords: JSON.parse(job.analysis.atsKeywords),
      } : null,
    };

    res.json({
      success: true,
      data,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/job/history
 * Get job analysis history
 */
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const jobs = await jobAnalysisService.getJobHistory();
    res.json({
      success: true,
      data: jobs,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

export default router;

