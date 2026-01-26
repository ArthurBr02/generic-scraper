import { defineStore } from 'pinia';

interface ToastNotification {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title?: string;
    message: string;
    duration?: number;
    closable?: boolean;
}

interface NotificationState {
    notifications: ToastNotification[];
}

export const useNotificationStore = defineStore('notification', {
    state: (): NotificationState => ({
        notifications: []
    }),

    actions: {
        addNotification(notification: Omit<ToastNotification, 'id'>): string {
            const id = Math.random().toString(36).substr(2, 9);
            this.notifications.push({
                id,
                duration: 3000,
                closable: true,
                ...notification
            });
            return id;
        },

        removeNotification(id: string): void {
            const index = this.notifications.findIndex(n => n.id === id);
            if (index !== -1) {
                this.notifications.splice(index, 1);
            }
        },

        success(message: string, title?: string, duration = 3000): string {
            return this.addNotification({
                type: 'success',
                title,
                message,
                duration
            });
        },

        error(message: string, title?: string, duration = 5000): string {
            return this.addNotification({
                type: 'error',
                title,
                message,
                duration
            });
        },

        warning(message: string, title?: string, duration = 4000): string {
            return this.addNotification({
                type: 'warning',
                title,
                message,
                duration
            });
        },

        info(message: string, title?: string, duration = 3000): string {
            return this.addNotification({
                type: 'info',
                title,
                message,
                duration
            });
        },

        clear(): void {
            this.notifications = [];
        },

        // Alias pour compatibilité
        showNotification(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', title?: string): string {
            return this.addNotification({
                type,
                title,
                message
            });
        }
    }
});
