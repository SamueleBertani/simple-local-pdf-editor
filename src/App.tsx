import { useEffect, useRef } from 'react';
import { Download, FileDown, Moon, Sun, Scan } from 'lucide-react';
import { usePDFStore } from './store/usePDFStore';
import { PDFViewer } from './components/viewer/PDFViewer';
import { Toolbar } from './components/toolbar/Toolbar';
import { SettingsSidebar } from './components/layout/SettingsSidebar';
import { DesktopSidebar } from './components/layout/DesktopSidebar';
import { UploadDropzone } from './components/upload/UploadDropzone';
import { useShortcuts } from './hooks/useShortcuts';
import { useFileUpload } from './hooks/useFileUpload';
import { useExportHandlers } from './hooks/useExportHandlers';
import { ScannerEffectModal } from './components/modals/ScannerEffectModal';
import { ExportQualityModal } from './components/modals/ExportQualityModal';
import { clsx } from 'clsx';
import { useToolStore, hasToolSettings } from './store/useToolStore';
import { useTheme } from './hooks/useTheme';
import { ZoomControls } from './components/toolbar/ZoomControls';
import { MobileSettingsDrawer } from './components/mobile/MobileSettingsDrawer';
import { MIN_SCALE, MAX_SCALE, WHEEL_SENSITIVITY } from './constants/zoom';
import { NotificationContainer } from './components/ui/NotificationContainer';

/**
 * Main application component for the PDF Editor.
 * Orchestrates the overall layout and connects various hooks and components.
 *
 * @returns The main application UI
 */
function App() {
  const { pdfDocument, scale, setScale } = usePDFStore();
  const { activeTool } = useToolStore();
  const { theme, toggleTheme } = useTheme();

  // File upload handling
  const {
    isDragging,
    handleFileUpload,
    handleDragOver,
    handleDragLeave,
    handleDrop
  } = useFileUpload();

  // Export handling
  const {
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
    handleQuickSavePDF,
    handleExportPDF,
    closeExportModal,
    handleExportWithQuality
  } = useExportHandlers();

  useShortcuts({
    onExportPDF: handleExportPDF,
    onScannerExport: startScannerFlow
  });

  // Keep scale in ref to avoid re-registering wheel listener on every scale change
  const scaleRef = useRef(scale);
  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  // Gesture Support: Ctrl + Wheel for zooming
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const delta = -e.deltaY * WHEEL_SENSITIVITY;
        const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scaleRef.current + delta));
        setScale(newScale);
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [setScale]);

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden text-slate-900 dark:text-slate-100 font-sans">
      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Mobile Header */}
        {pdfDocument && (
          <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 z-20">
            <button
              onClick={toggleTheme}
              className="p-2 text-slate-600 dark:text-slate-400"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={startScannerFlow}
                className="flex items-center gap-1 p-2 text-slate-700 dark:text-slate-300 font-medium text-sm bg-slate-100 dark:bg-slate-800 rounded-lg"
                aria-label="Export as scanned images"
              >
                <Scan className="w-4 h-4" />
              </button>
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-1 p-2 text-slate-700 dark:text-slate-300 font-medium text-sm bg-slate-100 dark:bg-slate-800 rounded-lg"
                aria-label="Minimize PDF"
              >
                <FileDown className="w-4 h-4" />
              </button>
              <button
                onClick={handleQuickSavePDF}
                className="flex items-center gap-1 p-2 text-white font-medium text-sm bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
                aria-label="Save PDF"
              >
                <Download className="w-4 h-4" />
                Save
              </button>
            </div>
          </div>
        )}

        {/* Sidebar (Desktop Only) */}
        {pdfDocument && (
          <DesktopSidebar
            theme={theme}
            onToggleTheme={toggleTheme}
            onQuickSavePDF={handleQuickSavePDF}
            onExportPDF={handleExportPDF}
            onScannerExport={startScannerFlow}
          />
        )}

        {/* Viewer */}
        <div className={clsx(
          "flex-1 flex flex-col relative bg-slate-100 dark:bg-slate-950/50 min-w-0 transition-all",
          pdfDocument ? "pt-14 pb-20 md:pt-0 md:pb-0" : ""
        )}>
          {!pdfDocument ? (
            <UploadDropzone
              isDragging={isDragging}
              onFileUpload={handleFileUpload}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            />
          ) : (
            <>
              <PDFViewer />
              <ZoomControls />
            </>
          )}
        </div>

        {/* Right Sidebar (Desktop Only) */}
        <div className="hidden md:block h-full">
          <SettingsSidebar
            activeTool={activeTool}
            visible={!!pdfDocument && hasToolSettings(activeTool)}
          />
        </div>
      </main>

      {/* Mobile Bottom Toolbar */}
      {pdfDocument && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 z-30 pb-safe">
          <Toolbar orientation="horizontal" />
        </div>
      )}

      {/* Mobile Settings Drawer */}
      <MobileSettingsDrawer />

      {/* Scanner Effect Modal */}
      <ScannerEffectModal
        isOpen={isScannerOpen}
        onClose={closeScannerModal}
        onDownload={handleScannerDownload}
        previewCanvas={scannerPreview}
        isProcessing={isProcessing}
      />

      {/* Export Quality Modal */}
      <ExportQualityModal
        isOpen={isExportModalOpen}
        onClose={closeExportModal}
        onExport={handleExportWithQuality}
        isProcessing={isExporting}
        progress={exportProgress}
        progressStage={exportStage}
      />

      {/* Notifications */}
      <NotificationContainer />
    </div>
  );
}

export default App;
