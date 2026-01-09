import { useEffect } from 'react';
import { isInputFocused } from '../../utils/keyboard';

export interface ExportCallbacks {
    onExportPDF?: () => void;
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
                } else {
                    // Cmd/Ctrl + S → Save PDF
                    callbacks.onExportPDF?.();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [callbacks]);
}
