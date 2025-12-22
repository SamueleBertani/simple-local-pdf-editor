import { useEffect, useRef } from 'react';
import type { PDFPageProxy } from 'pdfjs-dist';
import { CanvasOverlay } from '../canvas/CanvasOverlay';

interface PDFPageProps {
    page: PDFPageProxy;
    scale: number;
}

export function PDFPage({ page, scale }: PDFPageProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const viewport = page.getViewport({ scale });

    useEffect(() => {
        if (!canvasRef.current) return;

        // Viewport is stable inside render cycle usually, but recalculating is cheap
        // implementation moves viewport out of effect

        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (!context) return;

        // Set dimensions
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Render configuration
        const renderContext = {
            canvasContext: context,
            viewport: viewport,
        };

        // Cast renderContext to any to avoid strict type mismatch with older @types/pdfjs-dist vs new lib
        const renderTask = page.render(renderContext as any);

        return () => {
            renderTask.cancel();
        };
    }, [page, scale, viewport]);

    return (
        <div className="relative mb-8 shadow-lg" style={{ width: viewport.width, height: viewport.height }}>
            <canvas ref={canvasRef} className="block bg-white" />
            <CanvasOverlay
                width={viewport.width}
                height={viewport.height}
                scale={scale}
                pageIndex={page.pageNumber}
            />
        </div>
    );
}
