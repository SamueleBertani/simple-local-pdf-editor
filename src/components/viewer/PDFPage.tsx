import { useEffect, useRef } from 'react';
import type { PDFPageProxy } from 'pdfjs-dist';
import { CanvasOverlay } from '../canvas/CanvasOverlay';

interface PDFPageProps {
    page: PDFPageProxy;
    scale: number;
}

/**
 * Component to render a single PDF page.
 * Handles the canvas lifecycle and integrates the interactive overlay.
 */
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

        // Cast renderContext to satisfy pdfjs-dist RenderParameters type
        const renderTask = page.render(renderContext as Parameters<typeof page.render>[0]);

        renderTask.promise.catch((error) => {
            // RenderingCancelledException is expected on re-renders
            if (error.name !== 'RenderingCancelledException') {
                console.error('Render error:', error);
            }
        });

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
