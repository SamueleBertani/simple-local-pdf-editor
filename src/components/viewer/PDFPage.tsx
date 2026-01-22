import { useEffect, useRef, useState } from 'react';
import type { PDFPageProxy } from 'pdfjs-dist';
import { CanvasOverlay } from '../canvas/CanvasOverlay';
import { useInView } from '../../hooks/useInView';
import { Loader2 } from 'lucide-react';
import { usePDFStore } from '../../store/usePDFStore';

interface PDFPageProps {
    pageIndex: number; // 1-based index
    scale: number;
    defaultWidth?: number;
    defaultHeight?: number;
    onDimensionsLoad?: (width: number, height: number) => void;
}

/**
 * Component to render a single PDF page.
 * Handles lazy loading of page data and managing lifecycle.
 */
export function PDFPage({ pageIndex, scale, defaultWidth = 600, defaultHeight = 800 }: PDFPageProps) {
    const { pdfDocument } = usePDFStore();
    const [page, setPage] = useState<PDFPageProxy | null>(null);
    const [ref, isInView] = useInView({ triggerOnce: true, rootMargin: '200px' });
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const renderTaskRef = useRef<any>(null);

    // Initial loading
    useEffect(() => {
        if (isInView && !page && pdfDocument) {
            pdfDocument.getPage(pageIndex).then(setPage).catch(console.error);
        }
    }, [isInView, page, pdfDocument, pageIndex]);

    // Derived viewport
    const viewport = page ? page.getViewport({ scale }) : null;
    const width = viewport ? viewport.width : (defaultWidth * scale);
    const height = viewport ? viewport.height : (defaultHeight * scale);

    // Rendering PDF content
    useEffect(() => {
        if (!page || !canvasRef.current || !viewport) return;

        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
            canvasContext: context,
            viewport: viewport,
        };

        if (renderTaskRef.current) {
            renderTaskRef.current.cancel();
        }

        const renderTask = page.render(renderContext as any);
        renderTaskRef.current = renderTask;

        renderTask.promise.catch((err: any) => {
            if (err?.name !== 'RenderingCancelledException') {
                console.error('Render error:', err);
            }
        });

        return () => {
            renderTask.cancel();
        };
    }, [page, scale, viewport]);

    return (
        <div
            ref={ref}
            className="relative mb-8 shadow-lg bg-white transition-all duration-300"
            style={{ width, height }}
        >
            {(!page || !viewport) ? (
                <div className="flex items-center justify-center w-full h-full bg-slate-50 text-slate-400">
                    {isInView ? (
                        <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
                    ) : (
                        <span className="text-sm">Page {pageIndex}</span>
                    )}
                </div>
            ) : (
                <>
                    <canvas ref={canvasRef} className="block bg-white" />
                    <CanvasOverlay
                        width={viewport.width}
                        height={viewport.height}
                        scale={scale}
                        pageIndex={pageIndex}
                    />
                </>
            )}
        </div>
    );
}
