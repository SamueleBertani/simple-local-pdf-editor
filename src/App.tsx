import type { ChangeEvent } from 'react';
import { Upload, FileText, Download } from 'lucide-react';
import { PDFJS } from './core/pdf/pdfWorker';
import { usePDFStore } from './store/usePDFStore';
import { PDFViewer } from './components/viewer/PDFViewer';
import { Button } from './components/ui/Button';
import { Toolbar } from './components/toolbar/Toolbar';
import { HandwritingInput } from './components/toolbar/HandwritingInput';
import { useShortcuts } from './hooks/useShortcuts';
import { exportToPdf, exportToZip } from './core/pdf/exporter';

function App() {
  const { setPdfDocument, pdfDocument, canvases } = usePDFStore();
  useShortcuts();

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Please upload a valid PDF file');
      return;
    }

    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = PDFJS.getDocument(arrayBuffer);
    const doc = await loadingTask.promise;

    setPdfDocument(doc);
  };

  const handleExportPDF = async () => {
    if (!pdfDocument) return;
    await exportToPdf(pdfDocument, canvases);
  };

  const handleExportZIP = async () => {
    if (!pdfDocument) return;
    await exportToZip(pdfDocument, canvases);
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-50 overflow-hidden text-slate-900 font-sans">
      {/* Header */}
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-1.5 rounded-lg">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">PDF Editor</span>
        </div>

        <div className="flex items-center gap-3">
          {!pdfDocument && (
            <div className="relative">
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <Button variant="primary">
                <Upload className="w-4 h-4 mr-2" />
                Open PDF
              </Button>
            </div>
          )}

          {pdfDocument && (
            <Button variant="secondary" onClick={() => window.location.reload()}>
              Close File
            </Button>
          )}

          <div className="flex gap-2">
            <Button variant="ghost" disabled={!pdfDocument} onClick={handleExportPDF}>
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
            <Button variant="ghost" disabled={!pdfDocument} onClick={handleExportZIP}>
              <Download className="w-4 h-4 mr-2" />
              Export ZIP
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Toolbar Placeholder */}
        {pdfDocument && (
          <div className="w-20 bg-white border-r border-slate-200 flex flex-col items-center py-4 gap-4 z-10 shrink-0 relative">
            <Toolbar />
            <HandwritingInput />
          </div>
        )}

        {/* Viewer */}
        <div className="flex-1 flex flex-col relative bg-slate-100">
          {!pdfDocument ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <Upload className="w-16 h-16 mb-4 text-slate-300" />
              <p className="text-lg font-medium text-slate-500">Upload a PDF to start editing</p>
              <p className="text-sm text-slate-400 mt-2">All processing happens locally in your browser.</p>

              <div className="mt-8 relative">
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Button size="lg">Select Document</Button>
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
