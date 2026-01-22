
import { Request, Response, NextFunction } from 'express';
import { notificationService } from '../services/NotificationService';

export const getNotifications = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user!.id;
        const notifications = await notificationService.getUserNotifications(userId);
        const unreadCount = await notificationService.getUnreadCount(userId);

        res.json({
            success: true,
            data: {
                notifications,
                unreadCount,
            },
        });
    } catch (error) {
        next(error);
    }
};

export const markAsRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user!.id;
        const { id } = req.params;

        await notificationService.markAsRead(id, userId);

        res.json({
            success: true,
            data: null,
        });
    } catch (error) {
        next(error);
    }
};

export const markAllAsRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user!.id;

        await notificationService.markAllAsRead(userId);

        res.json({
            success: true,
            data: null,
        });
    } catch (error) {
        next(error);
    }
};
