import { useToolStore, hasToolSettings } from '../../store/useToolStore';
import { ToolSettings } from '../toolbar/ToolSettings';
import { cn } from '../../utils/cn';
import { createPortal } from 'react-dom';

export function MobileSettingsDrawer() {
    const { activeTool, isSettingsOpen, setSettingsOpen } = useToolStore();

    const hasSettings = hasToolSettings(activeTool);

    // Derived visibility: Must have settings AND be explicitly open
    const isVisible = hasSettings && isSettingsOpen;

    const handleClose = () => {
        setSettingsOpen(false);
    };

    if (!hasSettings) return null;

    return createPortal(
        <>
            {/* Backdrop */}
            <div
                className={cn(
                    "fixed inset-0 bg-black/10 transition-opacity duration-300 md:hidden",
                    isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={handleClose}
                aria-hidden="true"
            />

            {/* Drawer */}
            <div
                className={cn(
                    "fixed bottom-0 left-0 right-0 flex flex-col max-h-[85vh] transition-transform duration-300 ease-out md:hidden shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.1)]",
                    isVisible ? "translate-y-0" : "translate-y-full"
                )}
                role="dialog"
                aria-modal="true"
                aria-label="Tool settings"
            >
                <div className="rounded-t-2xl overflow-hidden bg-white dark:bg-slate-900 w-full h-full flex flex-col">
                    {/* Custom close handle for mobile feel */}
                    <button
                        type="button"
                        className="w-full flex justify-center pt-2 pb-1 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 cursor-pointer"
                        onClick={handleClose}
                        aria-label="Close settings"
                    >
                        <div className="w-12 h-1 bg-slate-200 dark:bg-slate-700 rounded-full" />
                    </button>
                    <ToolSettings activeTool={activeTool} onClose={handleClose} />
                </div>
            </div>
        </>,
        document.body
    );
}
