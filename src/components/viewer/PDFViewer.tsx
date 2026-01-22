import { useEffect, useState, useRef, useCallback } from 'react';
import { usePDFStore } from '../../store/usePDFStore';
import { PDFPage } from './PDFPage';
import { Loader2 } from 'lucide-react';
import type { PageViewport } from 'pdfjs-dist';

/**
 * Main viewer component that renders the PDF document.
 * Refactored to lazily load pages using Intersection Observer via PDFPage.
 */
export function PDFViewer() {
    const { pdfDocument, scale, setScale } = usePDFStore();
    const [numPages, setNumPages] = useState(0);
    const [firstPageViewport, setFirstPageViewport] = useState<PageViewport | null>(null);
    const [loading, setLoading] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    /**
     * Calculate optimal scale based on container width (90% to ensure margins)
     */
    const calculateOptimalScale = useCallback((viewport: PageViewport) => {
        if (!containerRef.current) return;

        const containerWidth = containerRef.current.clientWidth;
        // Calculate what scale is needed to map viewport.width to containerWidth * 0.9
        // viewport.width is at scale 1 (usually)
        // newScale = (containerWidth * 0.9) / (viewport.width at scale 1)

        // Ensure we work with unscaled width
        const baseWidth = viewport.width;
        const newScale = (containerWidth * 0.9) / baseWidth;
        setScale(newScale);
    }, [setScale]);

    // Initial load: Get numPages and Page 1 dims
    useEffect(() => {
        const initPDF = async () => {
            if (!pdfDocument) return;

            setLoading(true);
            try {
                // Peek at page 1 to set defaults
                const page1 = await pdfDocument.getPage(1);
                const viewport = page1.getViewport({ scale: 1 });

                setNumPages(pdfDocument.numPages);
                setFirstPageViewport(viewport);

                // Set initial scale
                calculateOptimalScale(viewport);
            } catch (error) {
                console.error("Failed to initialize PDF", error);
            } finally {
                setLoading(false);
            }
        };

        initPDF();
    }, [pdfDocument, calculateOptimalScale]);

    // Handle resize
    useEffect(() => {
        if (!firstPageViewport) return;

        const handleResize = () => {
            calculateOptimalScale(firstPageViewport);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [firstPageViewport, calculateOptimalScale]);

    if (!pdfDocument) {
        return (
            <div className="flex-1 flex items-center justify-center text-slate-400">
                No PDF loaded
            </div>
        )
    }

    if (loading || !firstPageViewport) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
            </div>
        );
    }

    // Default dimensions from page 1 (unscaled)
    const defaultWidth = firstPageViewport.width;
    const defaultHeight = firstPageViewport.height;

    return (
        <div ref={containerRef} className="flex-1 overflow-auto bg-slate-100 dark:bg-slate-950/50 p-8 flex flex-col items-center">
            {Array.from({ length: numPages }, (_, i) => (
                <PDFPage
                    key={i}
                    pageIndex={i + 1}
                    scale={scale}
                    defaultWidth={defaultWidth}
                    defaultHeight={defaultHeight}
                />
            ))}
        </div>
    );
}
