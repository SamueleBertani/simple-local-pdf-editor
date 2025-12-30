import { useEffect, useState } from 'react';
import { usePDFStore } from '../../store/usePDFStore';
import { PDFPage } from './PDFPage';
import { Loader2 } from 'lucide-react';

/**
 * Main viewer component that renders the PDF document.
 * Iterates through pages and renders them via PDFPage components.
 */
export function PDFViewer() {
    const { pdfDocument, scale } = usePDFStore();
    const [pages, setPages] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadPages = async () => {
            if (!pdfDocument) return;
            setLoading(true);

            const loadedPages = [];
            for (let i = 1; i <= pdfDocument.numPages; i++) {
                const page = await pdfDocument.getPage(i);
                loadedPages.push(page);
            }

            setPages(loadedPages);
            setLoading(false);
        };

        loadPages();
    }, [pdfDocument]);

    if (!pdfDocument) {
        return (
            <div className="flex-1 flex items-center justify-center text-slate-400">
                No PDF loaded
            </div>
        )
    }

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-auto bg-slate-100 p-8 flex flex-col items-center">
            {pages.map((page, index) => (
                <PDFPage key={index} page={page} scale={scale} />
            ))}
        </div>
    );
}
