import { usePDFExport, type UsePDFExportReturn } from './export/usePDFExport';
import { useScannerExport, type UseScannerExportReturn } from './export/useScannerExport';

/**
 * Return type for the useExportHandlers hook.
 * Combines PDF export and scanner export functionality.
 */
export type UseExportHandlersReturn = UsePDFExportReturn & UseScannerExportReturn;

/**
 * Custom hook to manage PDF and scanner export functionality.
 * Composes usePDFExport and useScannerExport hooks for convenience.
 *
 * @returns Object containing export state and handler functions for both PDF and scanner exports
 *
 * @example
 * ```tsx
 * const {
 *   // PDF Export
 *   isExportModalOpen,
 *   handleExportPDF,
 *   handleExportWithQuality,
 *   closeExportModal,
 *   // Scanner Export
 *   isScannerOpen,
 *   startScannerFlow,
 *   handleScannerDownload,
 *   closeScannerModal
 * } = useExportHandlers();
 * ```
 */
export function useExportHandlers(): UseExportHandlersReturn {
    const pdfExport = usePDFExport();
    const scannerExport = useScannerExport();

    return {
        ...pdfExport,
        ...scannerExport
    };
}
