
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api';
import { Notification } from '@/types/notification';

export function NotificationDropdown() {
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const fetchNotifications = async () => {
        try {
            const response = await api.notifications.getAll();
            if (response.success && response.data) {
                setNotifications(response.data.notifications);
                setUnreadCount(response.data.unreadCount);
            }
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Poll every minute
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMarkAsRead = async (id: string, link?: string) => {
        try {
            await api.notifications.markAsRead(id);
            setUnreadCount((prev) => Math.max(0, prev - 1));
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
            );

            if (link) {
                router.push(link);
                setIsOpen(false);
            }
        } catch (error) {
            console.error('Failed to mark as read', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            setIsLoading(true);
            await api.notifications.markAllAsRead();
            setUnreadCount(0);
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        } catch (error) {
            console.error('Failed to mark all as read', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return 'check_circle';
            case 'warning': return 'warning';
            case 'error': return 'error';
            default: return 'info';
        }
    };

    const getColor = (type: string) => {
        switch (type) {
            case 'success': return 'text-green-500 bg-green-50 dark:bg-green-900/20';
            case 'warning': return 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
            case 'error': return 'text-red-500 bg-red-50 dark:bg-red-900/20';
            default: return 'text-blue-500 bg-blue-50 dark:bg-blue-900/20';
        }
    };

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-gray-100 dark:text-text-secondary-dark dark:hover:text-text-primary-dark dark:hover:bg-gray-800 transition-colors relative"
                aria-label="Notifications"
            >
                <span className="material-symbols-outlined">notifications</span>
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse border-2 border-white dark:border-gray-900 box-content"></span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-border-light dark:border-border-dark z-50 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border-light dark:border-border-dark bg-gray-50/50 dark:bg-gray-700/50">
                        <h3 className="font-semibold text-text-primary dark:text-text-primary-dark">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllAsRead}
                                disabled={isLoading}
                                className="text-xs font-medium text-primary hover:text-primary-dark disabled:opacity-50"
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>

                    <div className="max-h-[400px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-text-muted">
                                <span className="material-symbols-outlined text-4xl mb-2 opacity-50">notifications_off</span>
                                <p>No notifications yet</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-border-light dark:divide-border-dark">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        onClick={() => handleMarkAsRead(notification.id, notification.link)}
                                        className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer flex gap-3 ${!notification.isRead ? 'bg-primary/5 dark:bg-primary/10' : ''
                                            }`}
                                    >
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getColor(notification.type)}`}>
                                            <span className="material-symbols-outlined text-lg">{getIcon(notification.type)}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-medium text-text-primary dark:text-text-primary-dark ${!notification.isRead ? 'font-semibold' : ''}`}>
                                                {notification.title}
                                            </p>
                                            <p className="text-sm text-text-secondary dark:text-text-secondary-dark mt-0.5 line-clamp-2">
                                                {notification.message}
                                            </p>
                                            <p className="text-xs text-text-muted mt-1.5">
                                                {new Date(notification.createdAt).toLocaleDateString()} • {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                        {!notification.isRead && (
                                            <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
