import { useNotificationStore } from '../../store/useNotificationStore';
import { Toast } from './Toast';
import { createPortal } from 'react-dom';

export const NotificationContainer = () => {
    const { notifications, removeNotification } = useNotificationStore();

    return createPortal(
        <div className="fixed bottom-4 right-4 flex flex-col gap-2 w-full max-w-sm pointer-events-none p-4 md:p-0 items-center sm:items-end">
            {notifications.map((notification) => (
                <Toast
                    key={notification.id}
                    {...notification}
                    onDismiss={removeNotification}
                />
            ))}
        </div>,
        document.body
    );
};
