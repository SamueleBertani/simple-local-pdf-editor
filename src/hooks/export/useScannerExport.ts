import { useState, useCallback } from 'react';
import { usePDFStore } from '../../store/usePDFStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { exportToImages, renderPageToCanvas } from '../../core/pdf/exporter';
import type { ScannerOptions } from '../../core/image/scannerEffect';
import confetti from 'canvas-confetti';

/**
 * Triggers a confetti animation for successful exports.
 */
function triggerConfetti(): void {
    confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
    });
}

/**
 * Return type for the useScannerExport hook.
 */
export interface UseScannerExportReturn {
    /** Whether the scanner effect modal is open */
    isScannerOpen: boolean;
    /** Preview canvas for scanner effect */
    scannerPreview: HTMLCanvasElement | null;
    /** Whether scanner processing is in progress */
    isProcessing: boolean;
    /** Opens the scanner flow with a preview of the first page */
    startScannerFlow: () => Promise<void>;
    /**
     * Handles the scanner download with the given options.
     * @param options - Scanner effect options
     */
    handleScannerDownload: (options: ScannerOptions) => Promise<void>;
    /** Closes the scanner modal */
    closeScannerModal: () => void;
}

/**
 * Custom hook to manage scanner effect export functionality.
 * Handles scanner modal state and image export operations.
 *
 * @returns Object containing scanner state and handler functions
 */
export function useScannerExport(): UseScannerExportReturn {
    const { pdfDocument, canvases, fileName } = usePDFStore();
    const { addNotification } = useNotificationStore();

    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [scannerPreview, setScannerPreview] = useState<HTMLCanvasElement | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    /**
     * Starts the scanner flow by rendering a preview of the first page.
     */
    const startScannerFlow = useCallback(async () => {
        if (!pdfDocument) return;

        const preview = await renderPageToCanvas(pdfDocument, 1, canvases[1], 1.5);
        setScannerPreview(preview);
        setIsScannerOpen(true);
    }, [pdfDocument, canvases]);

    /**
     * Handles the scanner download with the specified options.
     */
    const handleScannerDownload = useCallback(async (options: ScannerOptions) => {
        if (!pdfDocument) return;
        setIsProcessing(true);
        try {
            triggerConfetti();
            await exportToImages(pdfDocument, canvases, options, fileName ?? undefined);
            setIsScannerOpen(false);
        } catch {
            addNotification({
                type: 'error',
                title: 'Scan Error',
                message: 'Error creating scan'
            });
        } finally {
            setIsProcessing(false);
        }
    }, [pdfDocument, canvases, addNotification]);

    const closeScannerModal = useCallback(() => {
        setIsScannerOpen(false);
    }, []);

    return {
        isScannerOpen,
        scannerPreview,
        isProcessing,
        startScannerFlow,
        handleScannerDownload,
        closeScannerModal
    };
}
