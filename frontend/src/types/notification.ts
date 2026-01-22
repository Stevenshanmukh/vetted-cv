
export interface Notification {
    id: string;
    userId: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    isRead: boolean;
    link?: string;
    createdAt: string;
}

export interface NotificationState {
    notifications: Notification[];
    unreadCount: number;
    isOpen: boolean;
}
