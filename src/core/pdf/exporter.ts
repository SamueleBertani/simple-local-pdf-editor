import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import type { PDFDocumentProxy } from 'pdfjs-dist';

/**
 * Exports the current PDF document and its overlay canvases to a new PDF file.
 * This process involves:
 * 1. Loading the original PDF bytes.
 * 2. Iterating through each page.
 * 3. Converting corresponding Fabric.js canvases to high-res PNGs.
 * 4. Embedding these PNGs onto the PDF pages.
 * 5. Saving and triggering a download of the modified PDF.
 * 
 * @param pdfProxy - The source PDF document proxy from PDF.js.
 * @param canvases - A record mapping page numbers (1-based) to Fabric.js canvas instances.
 */
export async function exportToPdf(
    pdfProxy: PDFDocumentProxy,
    canvases: Record<number, any>
) {
    const existingPdfBytes = await pdfProxy.getData();
    // Use standard ArrayBuffer for PDFDocument.load
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    const pages = pdfDoc.getPages();

    for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        // pageNumber is 1-based, index is 0-based
        const canvas = canvases[i + 1];

        if (canvas) {
            // Get Data URL (PNG)
            const dataUrl = canvas.toDataURL({ format: 'png', multiplier: 2 });
            const pngImage = await pdfDoc.embedPng(dataUrl);
            const { width, height } = page.getSize();

            page.drawImage(pngImage, {
                x: 0,
                y: 0,
                width: width,
                height: height,
            });
        }
    }

    const pdfBytes = await pdfDoc.save();
    // Cast to any to bypass strict BlobPart check if typed array mismatch occurs
    downloadFile(new Blob([pdfBytes as any], { type: 'application/pdf' }), 'edited_document.pdf');
}

import { applyScannerEffect } from '../image/scannerEffect';
import type { ScannerOptions } from '../image/scannerEffect';

/**
 * Renders a single PDF page and its overlay annotations to a standard HTML Canvas.
 * Used for generating previews and for the final image export process.
 * 
 * @param pdfProxy - The source PDF document.
 * @param pageIndex - The 1-based page number to render.
 * @param overlayCanvas - Optional Fabric.js canvas containing annotations for this page.
 * @param scale - Rendering scale (default 2 for high DPI).
 * @returns A promise resolving to the rendered HTMLCanvasElement.
 */
export async function renderPageToCanvas(
    pdfProxy: PDFDocumentProxy,
    pageIndex: number,
    overlayCanvas?: any,
    scale: number = 2
): Promise<HTMLCanvasElement> {
    const page = await pdfProxy.getPage(pageIndex);
    const viewport = page.getViewport({ scale });

    // 1. Render PDF Page
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const context = canvas.getContext('2d');

    if (!context) throw new Error("Could not get canvas context");

    // Cast to any to bypass strict typing issues with pdfjs-dist
    await page.render({ canvasContext: context, viewport } as any).promise;

    // 2. Render Overlay (Fabric items)
    if (overlayCanvas) {
        const overlayData = overlayCanvas.toDataURL({ format: 'png', multiplier: scale });
        const img = new Image();
        img.src = overlayData;
        await new Promise(resolve => {
            img.onload = () => {
                context.drawImage(img, 0, 0, viewport.width, viewport.height);
                resolve(null);
            };
            img.onerror = resolve; // Continue even if overlay fails
        });
    }

    return canvas;
}

/**
 * Exports the PDF pages as images (PNG), optionally applying "Scanner Effects".
 * If multiple pages are exported, downloads a ZIP file.
 * If scanner effects are enabled, randomizes certain parameters (like tilt) per page 
 * to create a naturally imperfect batch scan look.
 * 
 * @param pdfProxy - The source PDF document.
 * @param canvases - A record of overlay canvases.
 * @param scannerOptions - Optional configuration for scanner effects.
 */
export async function exportToImages(
    pdfProxy: PDFDocumentProxy,
    canvases: Record<number, any>,
    scannerOptions?: ScannerOptions
) {
    const isSinglePage = pdfProxy.numPages === 1;
    const zip = new JSZip();

    for (let i = 1; i <= pdfProxy.numPages; i++) {
        // Render base page + overlay
        let canvas = await renderPageToCanvas(pdfProxy, i, canvases[i], 2);

        // Apply Scanner Effect if options provided
        if (scannerOptions) {
            // Randomize Tilt per page within the selected range (e.g., if 5 deg, random between -5 and 5)
            // Noise is already random per-pixel in applyScannerEffect, so it's unique per page automatically.
            const pageOptions = {
                ...scannerOptions,
                tilt: scannerOptions.tilt !== 0
                    ? (Math.random() * 2 - 1) * Math.abs(scannerOptions.tilt)
                    : 0
            };
            canvas = await applyScannerEffect(canvas, pageOptions);
        }

        // 3. Handle Output
        const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
        if (blob) {
            if (isSinglePage) {
                downloadFile(blob, scannerOptions ? 'scanned_page.png' : 'edited_page.png');
                return; // Exit, no zip
            } else {
                zip.file(`page_${i}.png`, blob);
            }
        }
    }

    // Generate zip
    const content = await zip.generateAsync({ type: 'blob' });
    downloadFile(content, scannerOptions ? 'scanned_export.zip' : 'pages_export.zip');
}

function downloadFile(blob: Blob, name: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
}
