import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/authMiddleware';
import { createBackup, listBackups, restoreBackup } from '../scripts/backup';
import { exportUserData } from '../scripts/export';

const router = Router();

/**
 * @swagger
 * /api/backup/create:
 *   post:
 *     summary: Create database backup
 *     tags: [Backup]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Backup created successfully
 */
router.post('/create', requireAuth, async (_req: Request, res: Response) => {
  try {
    const backupPath = createBackup();
    res.json({
      success: true,
      data: { backupPath },
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'BACKUP_ERROR',
        message: error.message,
      },
    });
  }
});

/**
 * @swagger
 * /api/backup/list:
 *   get:
 *     summary: List all backups
 *     tags: [Backup]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of backups
 */
router.get('/list', requireAuth, (_req: Request, res: Response) => {
  try {
    const backups = listBackups();
    res.json({
      success: true,
      data: { backups },
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'BACKUP_ERROR',
        message: error.message,
      },
    });
  }
});

/**
 * @swagger
 * /api/backup/export:
 *   post:
 *     summary: Export user data to JSON
 *     tags: [Backup]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Export created successfully
 */
router.post('/export', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const exportPath = await exportUserData(userId);
    res.json({
      success: true,
      data: { exportPath },
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'EXPORT_ERROR',
        message: error.message,
      },
    });
  }
});

export default router;

