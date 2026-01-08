import { PDFDocument } from 'pdf-lib';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { Canvas } from 'fabric';

/**
 * Compression quality presets mapping to DPI and JPEG quality settings.
 * Lower DPI = smaller file size but less detail.
 */
export const COMPRESSION_QUALITY_SETTINGS = {
    screen: { dpi: 72, jpegQuality: 0.4, label: 'Screen', description: 'Lowest size, for viewing only' },
    ebook: { dpi: 150, jpegQuality: 0.6, label: 'E-book', description: 'Good for digital reading' },
    printer: { dpi: 200, jpegQuality: 0.75, label: 'Printer', description: 'Suitable for home printing' },
    prepress: { dpi: 300, jpegQuality: 0.9, label: 'Prepress', description: 'Professional print quality' }
} as const;

export type CompressionQuality = keyof typeof COMPRESSION_QUALITY_SETTINGS;

export interface ReencodeOptions {
    /** Compression quality preset */
    quality: CompressionQuality;
    /** Convert to grayscale for additional compression */
    grayscale?: boolean;
    /** Progress callback (0-100) */
    onProgress?: (progress: number, currentPage: number, totalPages: number) => void;
}

export interface CompressionResult {
    /** Compressed PDF bytes */
    pdfBytes: Uint8Array;
    /** Original file size in bytes */
    originalSize: number;
    /** Compressed file size in bytes */
    compressedSize: number;
    /** Compression ratio (0-1, higher = more compression) */
    compressionRatio: number;
    /** Method used for compression */
    method: string;
}

/**
 * Applies grayscale conversion to a canvas.
 * Uses luminance formula: 0.299*R + 0.587*G + 0.114*B
 */
function applyGrayscaleToCanvas(canvas: HTMLCanvasElement): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        data[i] = gray;     // R
        data[i + 1] = gray; // G
        data[i + 2] = gray; // B
    }

    ctx.putImageData(imageData, 0, 0);
}

/**
 * Re-encodes entire PDF pages as compressed JPEG images.
 *
 * This method provides maximum compression (50-70%) by:
 * 1. Rendering each page (PDF + annotations) to a canvas
 * 2. Converting to JPEG with specified quality
 * 3. Creating a new PDF with only the compressed images
 *
 * Trade-off: Text becomes non-selectable (rasterized).
 *
 * @param pdfProxy - Source PDF document from PDF.js
 * @param canvases - Fabric.js overlay canvases with annotations
 * @param options - Compression options
 * @returns Compression result with PDF bytes and statistics
 */
export async function reencodeCompression(
    pdfProxy: PDFDocumentProxy,
    canvases: Record<number, Canvas>,
    options: ReencodeOptions
): Promise<CompressionResult> {
    const settings = COMPRESSION_QUALITY_SETTINGS[options.quality];
    const scale = settings.dpi / 72; // PDF native resolution is 72 DPI
    const totalPages = pdfProxy.numPages;

    // Get original size
    const originalBytes = await pdfProxy.getData();
    const originalSize = originalBytes.byteLength;

    // Create new PDF from scratch
    const newPdfDoc = await PDFDocument.create();

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        // Report progress
        options.onProgress?.(
            Math.round(((pageNum - 1) / totalPages) * 90),
            pageNum,
            totalPages
        );

        const page = await pdfProxy.getPage(pageNum);
        const viewport = page.getViewport({ scale });

        // Create canvas for rendering
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            throw new Error(`Failed to get canvas context for page ${pageNum}`);
        }

        // 1. Render PDF page to canvas
        // Cast to any to bypass strict typing issues with pdfjs-dist
        await page.render({ canvasContext: ctx, viewport } as any).promise;

        // 2. Render overlay annotations if present
        const overlay = canvases[pageNum];
        if (overlay && overlay.getObjects().length > 0) {
            const overlayDataUrl = overlay.toDataURL({ format: 'png', multiplier: scale });
            await new Promise<void>((resolve) => {
                const img = new Image();
                img.onload = () => {
                    ctx.drawImage(img, 0, 0, viewport.width, viewport.height);
                    resolve();
                };
                img.onerror = () => resolve(); // Continue even if overlay fails
                img.src = overlayDataUrl;
            });
        }

        // 3. Apply grayscale if requested
        if (options.grayscale) {
            applyGrayscaleToCanvas(canvas);
        }

        // 4. Convert to JPEG
        const jpegDataUrl = canvas.toDataURL('image/jpeg', settings.jpegQuality);
        const jpegImage = await newPdfDoc.embedJpg(jpegDataUrl);

        // 5. Add page with original PDF dimensions
        const originalWidth = viewport.width / scale;
        const originalHeight = viewport.height / scale;
        const pdfPage = newPdfDoc.addPage([originalWidth, originalHeight]);

        pdfPage.drawImage(jpegImage, {
            x: 0,
            y: 0,
            width: originalWidth,
            height: originalHeight
        });
    }

    // Save with object streams for additional compression
    options.onProgress?.(95, totalPages, totalPages);

    const pdfBytes = await newPdfDoc.save({
        useObjectStreams: true
    });

    options.onProgress?.(100, totalPages, totalPages);

    const compressedSize = pdfBytes.byteLength;

    return {
        pdfBytes,
        originalSize,
        compressedSize,
        compressionRatio: 1 - (compressedSize / originalSize),
        method: `reencode-${options.quality}${options.grayscale ? '-grayscale' : ''}`
    };
}

/**
 * Downloads a PDF blob with the given filename.
 */
export function downloadCompressedPdf(pdfBytes: Uint8Array, filename: string = 'compressed_document.pdf'): void {
    // Cast to any to bypass strict BlobPart check if typed array mismatch occurs
    const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}
