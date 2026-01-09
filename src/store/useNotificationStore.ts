import { create } from 'zustand';
import { generateId } from '../utils/generateId';

/** Supported notification types */
export type NotificationType = 'success' | 'error' | 'info';

/**
 * Public notification data structure.
 */
export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message?: string;
    /** Auto-dismiss duration in ms (0 = persistent) */
    duration?: number;
}

/**
 * Internal notification structure with timeout tracking.
 */
interface InternalNotification extends Notification {
    timeoutId?: ReturnType<typeof setTimeout>;
}

/**
 * State interface for notification management.
 */
interface NotificationState {
    /** Active notifications list */
    notifications: InternalNotification[];
    /** Adds a new notification with auto-generated ID and optional auto-dismiss */
    addNotification: (notification: Omit<Notification, 'id'>) => void;
    /** Removes a notification by ID and clears its timeout */
    removeNotification: (id: string) => void;
}

/**
 * Zustand store for managing toast notifications.
 * Handles notification lifecycle including auto-dismissal timers.
 */
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
