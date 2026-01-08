import { create } from 'zustand';
import { generateId } from '../utils/generateId';

export type NotificationType = 'success' | 'error' | 'info';

export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message?: string;
    duration?: number;
}

interface InternalNotification extends Notification {
    timeoutId?: ReturnType<typeof setTimeout>;
}

interface NotificationState {
    notifications: InternalNotification[];
    addNotification: (notification: Omit<Notification, 'id'>) => void;
    removeNotification: (id: string) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
    notifications: [],

    addNotification: (notification) => {
        const id = generateId();
        let timeoutId: ReturnType<typeof setTimeout> | undefined;

        if (notification.duration !== 0) {
            timeoutId = setTimeout(() => {
                get().removeNotification(id);
            }, notification.duration || 5000);
        }

        const newNotification: InternalNotification = { ...notification, id, timeoutId };

        set((state) => ({
            notifications: [...state.notifications, newNotification]
        }));
    },

    removeNotification: (id) => {
        const notification = get().notifications.find(n => n.id === id);
        if (notification?.timeoutId) {
            clearTimeout(notification.timeoutId);
        }

        set((state) => ({
            notifications: state.notifications.filter(n => n.id !== id)
        }));
    }
}));
