import { useState, useCallback } from 'react';
import { usePDFStore } from '../store/usePDFStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { exportToPdf, exportToImages, renderPageToCanvas } from '../core/pdf/exporter';
import type { ExportQualityOptions } from '../core/pdf/exporter';
import type { ScannerOptions } from '../core/image/scannerEffect';
import { compressPDF, downloadPDF, selectStrategy } from '../core/pdf/compressionManager';
import type { CompressionLevel } from '../core/pdf/compressionManager';
import confetti from 'canvas-confetti';

/** Bytes in a kilobyte */
const BYTES_PER_KB = 1024;
/** Bytes in a megabyte */
const BYTES_PER_MB = BYTES_PER_KB * BYTES_PER_KB;

/**
 * Return type for the useExportHandlers hook.
 */
interface UseExportHandlersReturn {
  /** Whether the export quality modal is open */
  isExportModalOpen: boolean;
  /** Whether an export operation is in progress */
  isExporting: boolean;
  /** Current export progress (0-100) */
  exportProgress: number;
  /** Current export stage description */
  exportStage: string;
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
  /** Opens the export quality modal */
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
 * Custom hook to manage PDF and scanner export functionality.
 * Handles export quality modal, scanner effect modal, and all export operations.
 *
 * @returns Object containing export state and handler functions
 *
 * @example
 * ```tsx
 * const {
 *   isExportModalOpen,
 *   handleExportPDF,
 *   handleExportWithQuality,
 *   closeExportModal
 * } = useExportHandlers();
 *
 * return (
 *   <>
 *     <button onClick={handleExportPDF}>Export PDF</button>
 *     <ExportModal
 *       isOpen={isExportModalOpen}
 *       onClose={closeExportModal}
 *       onExport={handleExportWithQuality}
 *     />
 *   </>
 * );
 * ```
 */
export function useExportHandlers(): UseExportHandlersReturn {
  const { pdfDocument, canvases } = usePDFStore();
  const { addNotification } = useNotificationStore();

  // Export Quality Modal State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStage, setExportStage] = useState<string>('');

  // Scanner Effect State
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
      await exportToImages(pdfDocument, canvases, options);
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

  const handleExportPDF = useCallback(() => {
    if (!pdfDocument) return;
    setIsExportModalOpen(true);
  }, [pdfDocument]);

  const closeExportModal = useCallback(() => {
    setIsExportModalOpen(false);
  }, []);

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
      let strategyUsed: string = 'standard';

      if (options.useReencode && options.reencodeQuality) {
        const compressionLevel: CompressionLevel = options.reencodeQuality === 'screen' ? 'extreme' : 'heavy';
        const strategy = selectStrategy();
        strategyUsed = strategy;

        const result = await compressPDF(pdfDocument, canvases, {
          level: compressionLevel,
          grayscale: options.grayscale,
          onProgress: (progress, stage) => {
            setExportProgress(progress);
            setExportStage(stage);
          }
        });

        downloadPDF(result.pdfBytes, 'compressed_document.pdf');
        originalSize = result.originalSize;
        exportedSize = result.compressedSize;
        percentChange = -result.compressionRatio * 100;
      } else {
        setExportStage('Exporting PDF...');
        setExportProgress(50);
        const result = await exportToPdf(pdfDocument, canvases, options);
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
      const strategyInfo = strategyUsed !== 'standard' ? ` [${strategyUsed}]` : '';

      addNotification({
        type: percentChange <= 0 ? 'success' : 'info',
        title: 'PDF Exported',
        message: `${originalFormatted} → ${exportedFormatted} (${changeText})${strategyInfo}`
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
    isScannerOpen,
    scannerPreview,
    isProcessing,
    startScannerFlow,
    handleScannerDownload,
    closeScannerModal,
    handleExportPDF,
    closeExportModal,
    handleExportWithQuality
  };
}
