import { useNotificationStore } from '../../store/useNotificationStore';
import { Toast } from './Toast';

export const NotificationContainer = () => {
    const { notifications, removeNotification } = useNotificationStore();

    return (
        <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm pointer-events-none p-4 md:p-0 items-center sm:items-end">
            {notifications.map((notification) => (
                <Toast
                    key={notification.id}
                    {...notification}
                    onDismiss={removeNotification}
                />
            ))}
        </div>
    );
};
