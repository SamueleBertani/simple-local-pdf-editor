/**
 * Downloads a Blob as a file by creating a temporary anchor element.
 *
 * @param blob - The Blob data to download
 * @param filename - The filename for the downloaded file
 */
export function downloadFile(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

/**
 * Downloads a Uint8Array as a PDF file.
 *
 * @param pdfBytes - The PDF data as Uint8Array
 * @param filename - The filename for the downloaded file (defaults to 'document.pdf')
 */
export function downloadPdfBytes(pdfBytes: Uint8Array, filename: string = 'document.pdf'): void {
    const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
    downloadFile(blob, filename);
}
