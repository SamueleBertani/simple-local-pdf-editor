import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import type { PDFDocumentProxy } from 'pdfjs-dist';

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

export async function exportToZip(
    pdfProxy: PDFDocumentProxy,
    canvases: Record<number, any>
) {
    const zip = new JSZip();

    for (let i = 1; i <= pdfProxy.numPages; i++) {
        const page = await pdfProxy.getPage(i);
        const viewport = page.getViewport({ scale: 2 }); // High res

        // 1. Render PDF Page
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const context = canvas.getContext('2d');

        if (!context) continue; // Skip

        // Cast context object to any to bypass RenderParameters mismatch
        await page.render({ canvasContext: context, viewport } as any).promise;

        // 2. Render Overlay
        const overlayCanvas = canvases[i];
        if (overlayCanvas) {
            const overlayData = overlayCanvas.toDataURL({ format: 'png', multiplier: 2 });
            const img = new Image();
            img.src = overlayData;
            await new Promise(resolve => {
                img.onload = () => {
                    // Draw overlay on top
                    context.drawImage(img, 0, 0, viewport.width, viewport.height);
                    resolve(null);
                };
            });
        }

        // 3. Add to ZIP
        const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
        if (blob) {
            zip.file(`page_${i}.png`, blob);
        }
    }

    const content = await zip.generateAsync({ type: 'blob' });
    downloadFile(content, 'pages_export.zip');
}

function downloadFile(blob: Blob, name: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
}
