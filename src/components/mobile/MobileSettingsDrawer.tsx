import { useToolStore, hasToolSettings } from '../../store/useToolStore';
import { ToolSettings } from '../toolbar/ToolSettings';
import { clsx } from 'clsx';

export function MobileSettingsDrawer() {
    const { activeTool, isSettingsOpen, setSettingsOpen } = useToolStore();

    const hasSettings = hasToolSettings(activeTool);

    // Derived visibility: Must have settings AND be explicitly open
    const isVisible = hasSettings && isSettingsOpen;

    const handleClose = () => {
        setSettingsOpen(false);
    };

    if (!hasSettings) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className={clsx(
                    "fixed inset-0 bg-black/10 z-40 transition-opacity duration-300 md:hidden",
                    isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={handleClose}
            />

            {/* Drawer */}
            <div
                className={clsx(
                    "fixed bottom-0 left-0 right-0 z-50 flex flex-col max-h-[50vh] transition-transform duration-300 ease-out md:hidden shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.1)]",
                    isVisible ? "translate-y-0" : "translate-y-full"
                )}
            >
                <div className="rounded-t-2xl overflow-hidden bg-white dark:bg-slate-900 w-full h-full flex flex-col">
                    {/* Custom close handle for mobile feel */}
                    <div className="w-full flex justify-center pt-2 pb-1 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800" onClick={handleClose}>
                        <div className="w-12 h-1 bg-slate-200 dark:bg-slate-700 rounded-full" />
                    </div>
                    <ToolSettings activeTool={activeTool} onClose={handleClose} />
                </div>
            </div>
        </>
    );
}
