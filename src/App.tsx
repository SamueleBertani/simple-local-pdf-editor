import type { ChangeEvent, DragEvent } from 'react';
import { useState, useEffect } from 'react';
import { Upload, Download, Moon, Sun } from 'lucide-react';
import { PDFJS } from './core/pdf/pdfWorker';
import { usePDFStore } from './store/usePDFStore';
import { PDFViewer } from './components/viewer/PDFViewer';
import { Button } from './components/ui/Button';
import { Toolbar } from './components/toolbar/Toolbar';
import { SettingsSidebar } from './components/layout/SettingsSidebar';
import { useShortcuts } from './hooks/useShortcuts';
import { exportToPdf, exportToImages, renderPageToCanvas } from './core/pdf/exporter';
import { ScannerEffectModal } from './components/modals/ScannerEffectModal';
import { clsx } from 'clsx';
import { useToolStore } from './store/useToolStore';
import confetti from 'canvas-confetti';
import { useTheme } from './hooks/useTheme';
import { ZoomControls } from './components/toolbar/ZoomControls';

function App() {
  const { setPdfDocument, pdfDocument, canvases, scale, setScale } = usePDFStore();
  const { activeTool } = useToolStore();
  const [isDragging, setIsDragging] = useState(false);
  const { theme, toggleTheme } = useTheme();
  useShortcuts();

  // Gesture Support: Ctrl + Wheel for zooming
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // Check for Ctrl key (standard for pinch-to-zoom on trackpads too)
      if (e.ctrlKey) {
        e.preventDefault(); // Persist browser zoom

        // Calculate new scale
        const delta = -e.deltaY * 0.01; // Sensitivity
        const newScale = Math.min(3, Math.max(0.5, scale + delta));

        setScale(newScale);
      }
    };

    // Add listener to window or specific container
    window.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      window.removeEventListener('wheel', handleWheel);
    };
  }, [scale, setScale]);

  const loadFile = async (file: File) => {
    if (file.type !== 'application/pdf') {
      alert('Please upload a valid PDF file');
      return;
    }

    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = PDFJS.getDocument({
      data: arrayBuffer,
      verbosity: PDFJS.VerbosityLevel.ERRORS,
    });
    const doc = await loadingTask.promise;

    setPdfDocument(doc);
  };

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await loadFile(file);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await loadFile(file);
  };

  /* Confetti Trigger */
  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  /* Scanner Effect Logic */
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerPreview, setScannerPreview] = useState<HTMLCanvasElement | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const startScannerFlow = async () => {
    if (!pdfDocument) return;

    // Render first page for preview
    const preview = await renderPageToCanvas(pdfDocument, 1, canvases[1], 1.5); // Slightly lower scale for preview speed
    setScannerPreview(preview);
    setIsScannerOpen(true);
  };

  const handleScannerDownload = async (options: any) => {
    if (!pdfDocument) return;
    setIsProcessing(true);
    try {
      // Trigger confetti only on actual download
      triggerConfetti();
      await exportToImages(pdfDocument, canvases, options);
      setIsScannerOpen(false);
    } catch (e) {
      console.error(e);
      alert('Error creating scan');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportPDF = async () => {
    if (!pdfDocument) return;
    triggerConfetti();
    await exportToPdf(pdfDocument, canvases);
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden text-slate-900 dark:text-slate-100 font-sans">
      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Sidebar */}
        {pdfDocument && (
          <div className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col items-center py-6 gap-6 z-10 shrink-0 relative h-full">
            {/* Tools */}
            <Toolbar />

            <div className="flex-1" /> {/* Spacer */}

            <div className="w-full h-px bg-slate-200 dark:bg-slate-800" />

            {/* Actions */}
            <div className="flex flex-col gap-3 w-full px-4">
              <button
                onClick={handleExportPDF}
                disabled={!pdfDocument}
                className="flex items-center gap-3 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 w-full"
                title="Save PDF"
              >
                <Download className="w-5 h-5" />
                <span className="text-sm font-medium">Save PDF</span>
              </button>

              <button
                onClick={startScannerFlow}
                disabled={!pdfDocument}
                className="flex items-center gap-3 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 w-full"
                title="Scanner Export (PNG)"
              >
                <Download className="w-5 h-5" />
                <span className="text-sm font-medium">Save PNG (Scan)</span>
              </button>

              <button
                onClick={toggleTheme}
                className="flex items-center gap-3 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 w-full"
                title="Toggle Theme"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                <span className="text-sm font-medium">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
              </button>

              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-3 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors p-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 mt-2 w-full"
                title="Close File"
              >
                <span className="text-xl font-bold leading-none w-5 text-center">&times;</span>
                <span className="text-sm font-medium">Close File</span>
              </button>
            </div>
          </div>
        )}

        {/* Viewer */}
        <div className="flex-1 flex flex-col relative bg-slate-100 dark:bg-slate-950/50 min-w-0">
          {!pdfDocument ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
              <div className="flex flex-col items-center gap-4 mb-8">
                {/* Icon removed as requested */}
                <h1 className="text-4xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">PDF Editor</h1>
              </div>

              <div
                className={clsx(
                  "bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border-2 flex flex-col items-center max-w-md w-full mx-4 transition-all duration-200",
                  isDragging
                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 scale-105"
                    : "border-slate-200 dark:border-slate-800 border-dashed"
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload className={clsx("w-12 h-12 mb-4 transition-colors", isDragging ? "text-indigo-600 dark:text-indigo-400" : "text-slate-300 dark:text-slate-600")} />
                <p className={clsx("text-lg font-medium text-center mb-1 transition-colors", isDragging ? "text-indigo-700 dark:text-indigo-300" : "text-slate-600 dark:text-slate-300")}>
                  {isDragging ? "Drop PDF here" : "Upload a PDF to start editing"}
                </p>
                <p className={clsx("text-sm text-center mb-6 transition-colors", isDragging ? "text-indigo-500 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500")}>
                  {isDragging ? "Release to open" : "Drag & Drop or click to select"}
                </p>

                <div className="relative w-full">
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer z-20"
                  />
                  <Button size="lg" className="w-full relative z-10 pointer-events-none">Select Document</Button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <PDFViewer />
              <ZoomControls />
            </>
          )}
        </div>

        {/* Right Sidebar (Tool Settings) */}
        <SettingsSidebar
          activeTool={activeTool}
          visible={!!pdfDocument && (activeTool === 'handwriting' || activeTool === 'text' || activeTool === 'rectangle' || activeTool === 'stamp')}
        />
      </main>

      {/* Scanner Effect Modal */}
      <ScannerEffectModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onDownload={handleScannerDownload}
        previewCanvas={scannerPreview}
        isProcessing={isProcessing}
      />
    </div>
  );
}

export default App;
