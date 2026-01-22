
import prisma from '../prisma';

export interface CreateNotificationInput {
    userId: string;
    title: string;
    message: string;
    type?: 'info' | 'success' | 'warning' | 'error';
    link?: string;
}

export class NotificationService {
    /**
     * Create a new notification
     */
    async create(input: CreateNotificationInput) {
        return prisma.notification.create({
            data: {
                ...input,
                type: input.type || 'info',
            },
        });
    }

    /**
     * Get user notifications
     */
    async getUserNotifications(userId: string) {
        return prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Get unread count
     */
    async getUnreadCount(userId: string) {
        return prisma.notification.count({
            where: {
                userId,
                isRead: false,
            },
        });
    }

    /**
     * Mark notification as read
     */
    async markAsRead(id: string, userId: string) {
        const notification = await prisma.notification.findUnique({
            where: { id },
        });

        if (!notification || notification.userId !== userId) {
            throw new Error('Notification not found or unauthorized');
        }

        return prisma.notification.update({
            where: { id },
            data: { isRead: true },
        });
    }

    /**
     * Mark all notifications as read for a user
     */
    async markAllAsRead(userId: string) {
        return prisma.notification.updateMany({
            where: {
                userId,
                isRead: false,
            },
            data: { isRead: true },
        });
    }
}

export const notificationService = new NotificationService();
