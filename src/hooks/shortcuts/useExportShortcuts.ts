import { useEffect } from 'react';
import { isInputFocused } from '../../utils/keyboard';

export interface ExportCallbacks {
    onQuickSavePDF?: () => void;
    onMinimizePDF?: () => void;
    onScannerExport?: () => void;
}

export function useExportShortcuts(callbacks?: ExportCallbacks) {
    useEffect(() => {
        if (!callbacks) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (isInputFocused(e)) return;

            const isCmdOrCtrl = e.metaKey || e.ctrlKey;

            if (isCmdOrCtrl && e.key.toLowerCase() === 's') {
                e.preventDefault();

                if (e.shiftKey) {
                    // Cmd/Ctrl + Shift + S → Save PNG (Scan)
                    callbacks.onScannerExport?.();
                } else if (e.altKey) {
                    // Cmd/Ctrl + Alt + S → Minimize PDF
                    callbacks.onMinimizePDF?.();
                } else {
                    // Cmd/Ctrl + S → Quick Save PDF
                    callbacks.onQuickSavePDF?.();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [callbacks]);
}
