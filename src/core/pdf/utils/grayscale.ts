/**
 * Grayscale Conversion Utilities
 *
 * Shared utilities for converting images and canvases to grayscale.
 * Uses the luminance formula: 0.299*R + 0.587*G + 0.114*B
 */

/** Luminance weights for grayscale conversion (ITU-R BT.601) */
const LUMINANCE_R = 0.299;
const LUMINANCE_G = 0.587;
const LUMINANCE_B = 0.114;

/**
 * Applies grayscale conversion to a canvas element in-place.
 * Modifies the canvas directly.
 *
 * @param canvas - The canvas element to convert to grayscale
 */
export function applyGrayscaleToCanvas(canvas: HTMLCanvasElement): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    applyGrayscaleToImageData(imageData);
    ctx.putImageData(imageData, 0, 0);
}

/**
 * Applies grayscale conversion to ImageData in-place.
 *
 * @param imageData - The ImageData to convert to grayscale
 */
export function applyGrayscaleToImageData(imageData: ImageData): void {
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        const gray = data[i] * LUMINANCE_R + data[i + 1] * LUMINANCE_G + data[i + 2] * LUMINANCE_B;
        data[i] = gray;     // R
        data[i + 1] = gray; // G
        data[i + 2] = gray; // B
        // Alpha (data[i + 3]) remains unchanged
    }
}

/**
 * Converts a data URL image to grayscale and returns a new JPEG data URL.
 *
 * @param dataUrl - The source data URL
 * @param jpegQuality - JPEG quality (0-1), defaults to 0.85
 * @returns Promise resolving to grayscale JPEG data URL
 */
export function convertDataUrlToGrayscale(
    dataUrl: string,
    jpegQuality: number = 0.85
): Promise<string> {
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
            applyGrayscaleToCanvas(canvas);
            resolve(canvas.toDataURL('image/jpeg', jpegQuality));
        };
        img.onerror = () => resolve(dataUrl);
        img.src = dataUrl;
    });
}
