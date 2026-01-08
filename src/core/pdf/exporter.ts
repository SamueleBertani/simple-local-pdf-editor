import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { Canvas } from 'fabric';

/**
 * Export quality options for controlling file size vs visual quality tradeoff.
 */
export interface ExportQualityOptions {
    /** Image format: 'jpeg' for smaller files, 'png' for lossless */
    format: 'jpeg' | 'png';
    /** JPEG quality (0-1), only used when format is 'jpeg' */
    quality: number;
    /** Resolution multiplier (1 = native 72dpi, 2 = 144dpi) */
    multiplier: number;
    /** Display name for the preset */
    label: string;
    /** Description of the preset */
    description: string;
    /** Convert images to grayscale for additional compression */
    grayscale?: boolean;
    /** Use re-encoding mode for maximum compression (loses text selectability) */
    useReencode?: boolean;
    /** Re-encode quality preset when useReencode is true */
    reencodeQuality?: 'screen' | 'ebook' | 'printer' | 'prepress';
}

/** Preset export quality configurations */
export const EXPORT_QUALITY_PRESETS: Record<string, ExportQualityOptions> = {
    high: {
        format: 'png',
        quality: 1,
        multiplier: 2,
        label: 'High',
        description: 'Maximum quality, larger file size',
        grayscale: false
    },
    medium: {
        format: 'jpeg',
        quality: 0.85,
        multiplier: 1,
        label: 'Medium',
        description: 'Good balance of quality and size',
        grayscale: false
    },
    low: {
        format: 'jpeg',
        quality: 0.65,
        multiplier: 1,
        label: 'Low',
        description: 'Smaller file size, slight quality loss',
        grayscale: false
    },
    extreme: {
        format: 'jpeg',
        quality: 0.45,
        multiplier: 0.75,
        label: 'Extreme',
        description: 'Maximum compression, noticeable quality loss',
        grayscale: false
    }
};

export const DEFAULT_EXPORT_QUALITY = EXPORT_QUALITY_PRESETS.medium;

/** Result of PDF export with size information */
export interface ExportResult {
    /** Original file size in bytes */
    originalSize: number;
    /** Exported file size in bytes */
    exportedSize: number;
    /** Size difference percentage (negative = smaller, positive = larger) */
    percentChange: number;
}

/**
 * Applies grayscale conversion to a canvas for additional compression.
 * Uses luminance formula: 0.299*R + 0.587*G + 0.114*B
 */
function applyGrayscaleToDataUrl(dataUrl: string): Promise<string> {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                resolve(dataUrl);
                return;
            }

            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            for (let i = 0; i < data.length; i += 4) {
                const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
                data[i] = gray;     // R
                data[i + 1] = gray; // G
                data[i + 2] = gray; // B
                // Alpha (data[i + 3]) remains unchanged
            }

            ctx.putImageData(imageData, 0, 0);
            resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.onerror = () => resolve(dataUrl);
        img.src = dataUrl;
    });
}

/**
 * Exports the current PDF document and its overlay canvases to a new PDF file.
 * This process involves:
 * 1. Loading the original PDF bytes.
 * 2. Iterating through each page.
 * 3. Converting corresponding Fabric.js canvases to images (PNG or JPEG based on quality options).
 * 4. Embedding these images onto the PDF pages.
 * 5. Saving and triggering a download of the modified PDF.
 *
 * @param pdfProxy - The source PDF document proxy from PDF.js.
 * @param canvases - A record mapping page numbers (1-based) to Fabric.js canvas instances.
 * @param qualityOptions - Optional quality settings for compression.
 * @returns Export result with file size information.
 */
export async function exportToPdf(
    pdfProxy: PDFDocumentProxy,
    canvases: Record<number, Canvas>,
    qualityOptions: ExportQualityOptions = DEFAULT_EXPORT_QUALITY
): Promise<ExportResult> {
    const existingPdfBytes = await pdfProxy.getData();
    const originalSize = existingPdfBytes.byteLength;

    // Use standard ArrayBuffer for PDFDocument.load
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    const pages = pdfDoc.getPages();
    const { format, quality, multiplier, grayscale } = qualityOptions;

    for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        // pageNumber is 1-based, index is 0-based
        const canvas = canvases[i + 1];

        if (canvas && canvas.getObjects().length > 0) {
            // Get Data URL based on format
            let dataUrl = format === 'jpeg'
                ? canvas.toDataURL({ format: 'jpeg', quality, multiplier })
                : canvas.toDataURL({ format: 'png', multiplier });

            // Apply grayscale conversion if enabled (reduces file size further)
            if (grayscale) {
                dataUrl = await applyGrayscaleToDataUrl(dataUrl);
            }

            const image = format === 'jpeg' || grayscale
                ? await pdfDoc.embedJpg(dataUrl)
                : await pdfDoc.embedPng(dataUrl);

            const { width, height } = page.getSize();

            page.drawImage(image, {
                x: 0,
                y: 0,
                width: width,
                height: height,
            });
        }
    }

    // Save with object streams for better compression
    const pdfBytes = await pdfDoc.save({
        useObjectStreams: true,
    });
    const exportedSize = pdfBytes.byteLength;
    const percentChange = ((exportedSize - originalSize) / originalSize) * 100;

    // Cast to any to bypass strict BlobPart check if typed array mismatch occurs
    downloadFile(new Blob([pdfBytes as any], { type: 'application/pdf' }), 'edited_document.pdf');

    return { originalSize, exportedSize, percentChange };
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
    overlayCanvas?: Canvas,
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
    canvases: Record<number, Canvas>,
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
