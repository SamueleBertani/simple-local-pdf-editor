import { useEffect, useState, useRef, useCallback } from 'react';
import type { PDFPageProxy } from 'pdfjs-dist';
import { usePDFStore } from '../../store/usePDFStore';
import { PDFPage } from './PDFPage';
import { Loader2 } from 'lucide-react';

/**
 * Main viewer component that renders the PDF document.
 * Iterates through pages and renders them via PDFPage components.
 */
export function PDFViewer() {
    const { pdfDocument, scale, setScale } = usePDFStore();
    const [pages, setPages] = useState<PDFPageProxy[]>([]);
    const [loading, setLoading] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    /**
     * Calculate optimal scale based on container width (90% to ensure margins)
     */
    const calculateOptimalScale = useCallback(() => {
        if (!containerRef.current || pages.length === 0) return;

        const containerWidth = containerRef.current.clientWidth;
        const firstPage = pages[0];
        const viewport = firstPage.getViewport({ scale: 1 });
        const newScale = (containerWidth * 0.9) / viewport.width;
        setScale(newScale);
    }, [pages, setScale]);

    // Load PDF pages
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

    // Calculate initial scale and handle resize
    useEffect(() => {
        if (pages.length === 0) return;

        // Calculate initial scale
        calculateOptimalScale();

        // Handle window resize
        const handleResize = () => {
            calculateOptimalScale();
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [pages, calculateOptimalScale]);

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
        <div ref={containerRef} className="flex-1 overflow-auto bg-slate-100 dark:bg-slate-950/50 p-8 flex flex-col items-center isolate">
            {pages.map((page, index) => (
                <PDFPage key={index} page={page} scale={scale} />
            ))}
        </div>
    );
}
