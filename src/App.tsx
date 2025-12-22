import type { ChangeEvent, DragEvent } from 'react';
import { useState } from 'react';
import { Upload, FileText, Download } from 'lucide-react';
import { PDFJS } from './core/pdf/pdfWorker';
import { usePDFStore } from './store/usePDFStore';
import { PDFViewer } from './components/viewer/PDFViewer';
import { Button } from './components/ui/Button';
import { Toolbar } from './components/toolbar/Toolbar';
import { HandwritingInput } from './components/toolbar/HandwritingInput';
import { useShortcuts } from './hooks/useShortcuts';
import { exportToPdf, exportToImages } from './core/pdf/exporter';
import { clsx } from 'clsx';

function App() {
  const { setPdfDocument, pdfDocument, canvases } = usePDFStore();
  const [isDragging, setIsDragging] = useState(false);

  useShortcuts();

  const loadFile = async (file: File) => {
    if (file.type !== 'application/pdf') {
      alert('Please upload a valid PDF file');
      return;
    }

    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = PDFJS.getDocument(arrayBuffer);
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

  const handleExportPDF = async () => {
    if (!pdfDocument) return;
    await exportToPdf(pdfDocument, canvases);
  };

  const handleExportZIP = async () => {
    if (!pdfDocument) return;
    await exportToImages(pdfDocument, canvases);
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-50 overflow-hidden text-slate-900 font-sans">
      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Sidebar */}
        {pdfDocument && (
          <div className="w-64 bg-white border-r border-slate-200 flex flex-col items-center py-6 gap-6 z-10 shrink-0 relative h-full">
            {/* Tools */}
            <Toolbar />
            <HandwritingInput />

            <div className="flex-1" /> {/* Spacer */}

            <div className="w-full h-px bg-slate-200" />

            {/* Actions */}
            <div className="flex flex-col gap-3 w-full px-4">
              <button
                onClick={handleExportPDF}
                disabled={!pdfDocument}
                className="flex items-center gap-3 text-slate-600 hover:text-indigo-600 transition-colors p-3 rounded-lg hover:bg-slate-50 w-full"
                title="Save PDF"
              >
                <Download className="w-5 h-5" />
                <span className="text-sm font-medium">Save PDF</span>
              </button>

              <button
                onClick={handleExportZIP}
                disabled={!pdfDocument}
                className="flex items-center gap-3 text-slate-600 hover:text-indigo-600 transition-colors p-3 rounded-lg hover:bg-slate-50 w-full"
                title="Save PNG (ZIP)"
              >
                <Download className="w-5 h-5" />
                <span className="text-sm font-medium">Save PNG</span>
              </button>

              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-3 text-red-500 hover:text-red-600 transition-colors p-3 rounded-lg hover:bg-red-50 mt-2 w-full"
                title="Close File"
              >
                <span className="text-xl font-bold leading-none w-5 text-center">&times;</span>
                <span className="text-sm font-medium">Close File</span>
              </button>
            </div>
          </div>
        )}

        {/* Viewer */}
        <div className="flex-1 flex flex-col relative bg-slate-100">
          {!pdfDocument ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <div className="flex flex-col items-center gap-4 mb-8">
                {/* Icon removed as requested */}
                <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">PDF Editor</h1>
              </div>

              <div
                className={clsx(
                  "bg-white p-8 rounded-2xl shadow-sm border-2 flex flex-col items-center max-w-md w-full mx-4 transition-all duration-200",
                  isDragging
                    ? "border-indigo-500 bg-indigo-50 scale-105"
                    : "border-slate-200 border-dashed"
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload className={clsx("w-12 h-12 mb-4 transition-colors", isDragging ? "text-indigo-600" : "text-slate-300")} />
                <p className={clsx("text-lg font-medium text-center mb-1 transition-colors", isDragging ? "text-indigo-700" : "text-slate-600")}>
                  {isDragging ? "Drop PDF here" : "Upload a PDF to start editing"}
                </p>
                <p className={clsx("text-sm text-center mb-6 transition-colors", isDragging ? "text-indigo-500" : "text-slate-400")}>
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
            <PDFViewer />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
