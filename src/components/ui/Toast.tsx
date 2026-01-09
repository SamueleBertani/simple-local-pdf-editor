import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { clsx } from 'clsx';
import type { NotificationType } from '../../store/useNotificationStore';

interface ToastProps {
    id: string;
    type: NotificationType;
    title: string;
    message?: string;
    onDismiss: (id: string) => void;
}

const icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info
};

const styles = {
    success: "bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200",
    error: "bg-red-50 dark:bg-red-900 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200",
    info: "bg-blue-50 dark:bg-blue-900 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200"
};

const iconStyles = {
    success: "text-green-500 dark:text-green-400",
    error: "text-red-500 dark:text-red-400",
    info: "text-blue-500 dark:text-blue-400"
};

export const Toast = ({ id, type, title, message, onDismiss }: ToastProps) => {
    const Icon = icons[type];

    return (
        <div
            className={clsx(
                "flex items-start gap-3 p-4 rounded-lg border shadow-lg transition-all animate-in slide-in-from-right-full duration-300 max-w-sm w-full pointer-events-auto",
                styles[type]
            )}
            role="alert"
        >
            <Icon className={clsx("w-5 h-5 mt-0.5 shrink-0", iconStyles[type])} />
            <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm leading-tight">{title}</h4>
                {message && <p className="text-sm mt-1 opacity-90 break-words">{message}</p>}
            </div>
            <button
                onClick={() => onDismiss(id)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors -mr-1 -mt-1 p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10"
                aria-label="Close notification"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
};
