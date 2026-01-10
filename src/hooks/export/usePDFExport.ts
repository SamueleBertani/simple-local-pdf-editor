import { useState, useCallback } from 'react';
import { usePDFStore } from '../../store/usePDFStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { exportToPdf, EXPORT_QUALITY_PRESETS } from '../../core/pdf/exporter';
import type { ExportQualityOptions } from '../../core/pdf/exporter';
import { compressPDF, downloadPDF } from '../../core/pdf/compressionManager';
import type { CompressionLevel } from '../../core/pdf/compressionManager';
import { downloadPdfBytes } from '../../utils/download';
import confetti from 'canvas-confetti';

/** Bytes in a kilobyte */
const BYTES_PER_KB = 1024;
/** Bytes in a megabyte */
const BYTES_PER_MB = BYTES_PER_KB * BYTES_PER_KB;

/**
 * Formats a byte size into a human-readable string.
 * @param bytes - The size in bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
function formatFileSize(bytes: number): string {
    if (bytes < BYTES_PER_KB) return `${bytes} B`;
    if (bytes < BYTES_PER_MB) return `${(bytes / BYTES_PER_KB).toFixed(1)} KB`;
    return `${(bytes / BYTES_PER_MB).toFixed(2)} MB`;
}

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
 * Return type for the usePDFExport hook.
 */
export interface UsePDFExportReturn {
    /** Whether the export quality modal is open */
    isExportModalOpen: boolean;
    /** Whether an export operation is in progress */
    isExporting: boolean;
    /** Current export progress (0-100) */
    exportProgress: number;
    /** Current export stage description */
    exportStage: string;
    /** Saves the PDF immediately with high quality (no modal) */
    handleQuickSavePDF: () => Promise<void>;
    /** Opens the export quality modal for compression options */
    handleExportPDF: () => void;
    /** Closes the export modal */
    closeExportModal: () => void;
    /**
     * Exports the PDF with the specified quality options.
     * @param options - Export quality options
     */
    handleExportWithQuality: (options: ExportQualityOptions) => Promise<void>;
}

/**
 * Custom hook to manage PDF export functionality.
 * Handles export quality modal state and PDF export operations.
 *
 * @returns Object containing export state and handler functions
 */
export function usePDFExport(): UsePDFExportReturn {
    const { pdfDocument, canvases, fileName } = usePDFStore();
    const { addNotification } = useNotificationStore();

    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState(0);
    const [exportStage, setExportStage] = useState<string>('');

    const handleExportPDF = useCallback(() => {
        if (!pdfDocument) return;
        setIsExportModalOpen(true);
    }, [pdfDocument]);

    const closeExportModal = useCallback(() => {
        setIsExportModalOpen(false);
    }, []);

    /**
     * Quickly saves the PDF with high quality, no modal.
     * Ideal for users who just want to save their edits immediately.
     */
    const handleQuickSavePDF = useCallback(async () => {
        if (!pdfDocument) return;
        setIsExporting(true);
        setExportProgress(0);
        setExportStage('Saving PDF...');
        try {
            triggerConfetti();
            setExportProgress(50);
            const result = await exportToPdf(pdfDocument, canvases, EXPORT_QUALITY_PRESETS.high);
            const outputFileName = fileName ? `${fileName}.pdf` : 'document.pdf';
            downloadPdfBytes(result.pdfBytes, outputFileName);
            setExportProgress(100);

            const originalFormatted = formatFileSize(result.originalSize);
            const exportedFormatted = formatFileSize(result.exportedSize);
            const changeSign = result.percentChange >= 0 ? '+' : '';
            const changeText = `${changeSign}${result.percentChange.toFixed(1)}%`;

            addNotification({
                type: result.percentChange <= 0 ? 'success' : 'info',
                title: 'PDF Saved',
                message: `${originalFormatted} → ${exportedFormatted} (${changeText})`
            });
        } catch {
            addNotification({
                type: 'error',
                title: 'Save Error',
                message: 'Error saving the PDF'
            });
        } finally {
            setIsExporting(false);
        }
    }, [pdfDocument, canvases, addNotification]);

    /**
     * Exports the PDF with the specified quality options.
     * Supports both standard export and compression modes.
     */
    const handleExportWithQuality = useCallback(async (options: ExportQualityOptions) => {
        if (!pdfDocument) return;
        setIsExporting(true);
        setExportProgress(0);
        setExportStage('Starting...');
        try {
            triggerConfetti();

            let originalSize: number;
            let exportedSize: number;
            let percentChange: number;

            if (options.useReencode && options.reencodeQuality) {
                const compressionLevel: CompressionLevel = options.reencodeQuality === 'screen' ? 'extreme' : 'heavy';

                const result = await compressPDF(pdfDocument, canvases, {
                    level: compressionLevel,
                    grayscale: options.grayscale,
                    onProgress: (progress, stage) => {
                        setExportProgress(progress);
                        setExportStage(stage);
                    }
                });

                const outputFileName = fileName ? `${fileName}_minimized.pdf` : 'document_minimized.pdf';
                downloadPDF(result.pdfBytes, outputFileName);
                originalSize = result.originalSize;
                exportedSize = result.compressedSize;
                percentChange = -result.compressionRatio * 100;
            } else {
                setExportStage('Exporting PDF...');
                setExportProgress(50);
                const result = await exportToPdf(pdfDocument, canvases, options);
                const outputFileName = fileName ? `${fileName}_minimized.pdf` : 'document_minimized.pdf';
                downloadPdfBytes(result.pdfBytes, outputFileName);
                originalSize = result.originalSize;
                exportedSize = result.exportedSize;
                percentChange = result.percentChange;
                setExportProgress(100);
            }

            setIsExportModalOpen(false);

            const originalFormatted = formatFileSize(originalSize);
            const exportedFormatted = formatFileSize(exportedSize);
            const changeSign = percentChange >= 0 ? '+' : '';
            const changeText = `${changeSign}${percentChange.toFixed(1)}%`;

            addNotification({
                type: percentChange <= 0 ? 'success' : 'info',
                title: 'PDF Exported',
                message: `${originalFormatted} → ${exportedFormatted} (${changeText})`
            });
        } catch {
            addNotification({
                type: 'error',
                title: 'Export Error',
                message: 'Error exporting the PDF'
            });
        } finally {
            setIsExporting(false);
        }
    }, [pdfDocument, canvases, addNotification]);

    return {
        isExportModalOpen,
        isExporting,
        exportProgress,
        exportStage,
        handleQuickSavePDF,
        handleExportPDF,
        closeExportModal,
        handleExportWithQuality
    };
}
