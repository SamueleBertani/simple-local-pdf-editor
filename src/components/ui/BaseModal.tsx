import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../utils/cn';
import { Z_INDEX } from '../../constants/zIndex';

interface BaseModalProps {
    /** Whether the modal is open */
    isOpen: boolean;
    /** Callback when the modal should close */
    onClose: () => void;
    /** Modal title */
    title: string;
    /** Optional subtitle */
    subtitle?: string;
    /** Modal content */
    children: ReactNode;
    /** Whether closing is disabled (e.g., during processing) */
    disableClose?: boolean;
    /** Optional max width class (default: max-w-md) */
    maxWidth?: string;
    /** Optional aria label id */
    ariaLabelId?: string;
    /** Use custom layout (skips default wrapper styling) */
    customLayout?: boolean;
}

/**
 * Base modal component with common functionality:
 * - Backdrop with blur
 * - Escape key to close
 * - Focus trap
 * - Animations
 * - Accessibility attributes
 */
export function BaseModal({
    isOpen,
    onClose,
    title,
    subtitle,
    children,
    disableClose = false,
    maxWidth = 'max-w-md',
    ariaLabelId = 'modal-title',
    customLayout = false
}: BaseModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);

    // Handle Escape key to close modal
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !disableClose) {
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, disableClose, onClose]);

    // Focus trap
    useEffect(() => {
        if (!isOpen || !modalRef.current) return;

        const modal = modalRef.current;
        const focusableElements = modal.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [tabindex]:not([tabindex="-1"]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])'
        );

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        // Focus first element
        firstElement?.focus();

        const handleTabKey = (e: KeyboardEvent) => {
            if (e.key !== 'Tab') return;

            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement?.focus();
                }
            } else {
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement?.focus();
                }
            }
        };

        modal.addEventListener('keydown', handleTabKey);
        return () => modal.removeEventListener('keydown', handleTabKey);
    }, [isOpen]);

    if (!isOpen) return null;

    // Custom layout mode - only provides backdrop and accessibility
    if (customLayout) {
        return createPortal(
            <div
                className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                style={{ zIndex: Z_INDEX.MODAL.BACKDROP }}
                role="dialog"
                aria-modal="true"
                aria-labelledby={ariaLabelId}
            >
                <div
                    ref={modalRef}
                    className={cn(
                        "bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-h-[90vh] flex overflow-hidden animate-in fade-in zoom-in-95 duration-200",
                        maxWidth
                    )}
                >
                    {children}
                </div>
            </div>,
            document.body
        );
    }

    return createPortal(
        <div
            className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            style={{ zIndex: Z_INDEX.MODAL.BACKDROP }}
            role="dialog"
            aria-modal="true"
            aria-labelledby={ariaLabelId}
        >
            <div
                ref={modalRef}
                className={cn(
                    "bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full mx-4 p-6 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto",
                    maxWidth
                )}
            >
                <div className="mb-6">
                    <h2 id={ariaLabelId} className="text-xl font-bold text-slate-800 dark:text-slate-100">
                        {title}
                    </h2>
                    {subtitle && (
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            {subtitle}
                        </p>
                    )}
                </div>
                {children}
            </div>
        </div>,
        document.body
    );
}

interface ModalActionsProps {
    children: ReactNode;
}

/**
 * Container for modal action buttons
 */
export function ModalActions({ children }: ModalActionsProps) {
    return (
        <div className="flex flex-col gap-3">
            {children}
        </div>
    );
}

interface ModalCancelButtonProps {
    onClick: () => void;
    disabled?: boolean;
    children?: ReactNode;
}

/**
 * Standard cancel button for modals
 */
export function ModalCancelButton({ onClick, disabled = false, children = 'Cancel' }: ModalCancelButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className="w-full py-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
            {children}
        </button>
    );
}
