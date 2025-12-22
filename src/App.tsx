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
      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Sidebar */}
        {pdfDocument && (
          <div className="w-20 bg-white border-r border-slate-200 flex flex-col items-center py-6 gap-6 z-10 shrink-0 relative h-full">
            {/* Logo / Home */}
            <button
              onClick={() => setPdfDocument(null as any)} // Reset to null (using casting if type strictness complains about null vs Proxy) 
              // actually Store says Proxy | null, so it should be fine. 
              className="flex flex-col items-center gap-1 mb-2 hover:opacity-80 transition-opacity"
              title="Back to Home"
            >
              <div className="bg-indigo-600 p-2 rounded-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
            </button>

            <div className="w-full h-px bg-slate-200" />

            {/* Tools */}
            <Toolbar />
            <HandwritingInput />

            <div className="flex-1" /> {/* Spacer */}

            <div className="w-full h-px bg-slate-200" />

            {/* Actions */}
            <div className="flex flex-col gap-3 w-full px-2">
              <button
                onClick={handleExportPDF}
                disabled={!pdfDocument}
                className="flex flex-col items-center gap-1 text-slate-500 hover:text-indigo-600 transition-colors p-2 rounded-lg hover:bg-slate-50"
                title="Save PDF"
              >
                <Download className="w-5 h-5" />
                <span className="text-[10px] font-medium">PDF</span>
              </button>

              <button
                onClick={handleExportZIP}
                disabled={!pdfDocument}
                className="flex flex-col items-center gap-1 text-slate-500 hover:text-indigo-600 transition-colors p-2 rounded-lg hover:bg-slate-50"
                title="Save PNG (ZIP)"
              >
                <Download className="w-5 h-5" />
                <span className="text-[10px] font-medium">PNG</span>
              </button>

              <button
                onClick={() => window.location.reload()}
                className="flex flex-col items-center gap-1 text-red-500 hover:text-red-600 transition-colors p-2 rounded-lg hover:bg-red-50 mt-2"
                title="Close File"
              >
                <span className="text-xl font-bold leading-none">&times;</span>
                <span className="text-[10px] font-medium">Close</span>
              </button>
            </div>
          </div>
        )}

        {/* Viewer */}
        <div className="flex-1 flex flex-col relative bg-slate-100">
          {!pdfDocument ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <div className="flex flex-col items-center gap-4 mb-8">
                <div className="bg-indigo-600 p-4 rounded-2xl shadow-xl shadow-indigo-200">
                  <FileText className="w-12 h-12 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-slate-800">PDF Editor</h1>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center max-w-md w-full mx-4">
                <Upload className="w-12 h-12 mb-4 text-slate-300" />
                <p className="text-lg font-medium text-slate-600 text-center mb-1">Upload a PDF to start editing</p>
                <p className="text-sm text-slate-400 text-center mb-6">Processing happens locally in your browser.</p>

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
