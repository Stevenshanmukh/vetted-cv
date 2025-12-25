import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/AuthService';

// Extend Express Request to include user info
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      profileId?: string;
    }
  }
}

/**
 * Authentication middleware
 * Verifies JWT token from cookie and attaches user info to request
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token = req.cookies?.token;

  if (!token) {
    res.status(401).json({
      success: false,
      error: {
        code: 'NOT_AUTHENTICATED',
        message: 'Authentication required. Please login.',
      },
    });
    return;
  }

  try {
    const user = await authService.verifyToken(token);

    if (!user) {
      res.clearCookie('token', { path: '/' });
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired token. Please login again.',
        },
      });
      return;
    }

    // Get user's profile ID
    const profileId = await authService.getProfileId(user.id);

    if (!profileId) {
      res.status(500).json({
        success: false,
        error: {
          code: 'PROFILE_NOT_FOUND',
          message: 'User profile not found. Please contact support.',
        },
      });
      return;
    }

    // Attach user info to request
    req.userId = user.id;
    req.profileId = profileId;

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: 'Authentication failed. Please login again.',
      },
    });
  }
}

/**
 * Optional auth middleware
 * Attaches user info if token exists, but doesn't require it
 */
export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const token = req.cookies?.token;

  if (token) {
    try {
      const user = await authService.verifyToken(token);
      if (user) {
        req.userId = user.id;
        const profileId = await authService.getProfileId(user.id);
        if (profileId) {
          req.profileId = profileId;
        }
      }
    } catch {
      // Ignore auth errors for optional auth
    }
  }

  next();
}

