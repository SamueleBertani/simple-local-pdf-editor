export interface ScannerOptions {
    noise: number; // 0-1
    tilt: number; // degrees
    grayscale: boolean;
    contrast: number; // 1 = normal
    brightness: number; // 1 = normal
    blur: number; // 0 = none
    shadow: number; // Shadow strength/offset
    rotate: boolean;
    distortion: number; // NEW: 0 to roughly 20 (amount of sine wave warp)
    chromaticAberration: number; // NEW: 0 to 5 (pixels of offset)
}

export const DEFAULT_SCANNER_OPTIONS: ScannerOptions = {
    noise: 0.2,
    tilt: 0.5,
    grayscale: true,
    contrast: 1.2,
    brightness: 1.0,
    blur: 0.5,
    shadow: 1, // Default small shadow
    rotate: true,
    distortion: 1.0,
    chromaticAberration: 1.0,
};

export async function applyScannerEffect(
    sourceCanvas: HTMLCanvasElement,
    options: ScannerOptions
): Promise<HTMLCanvasElement> {
    const { noise, tilt, grayscale, contrast, brightness, blur, shadow, distortion, chromaticAberration } = options;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return sourceCanvas;

    const padding = 50;
    canvas.width = sourceCanvas.width + padding * 2;
    canvas.height = sourceCanvas.height + padding * 2;

    // Fill white (Paper/Lid background)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // --- DRAWING THE PAPER & SHADOW ---
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((tilt * Math.PI) / 180);

    // Shadow
    if (shadow !== 0) {
        ctx.save();
        ctx.fillStyle = `rgba(0, 0, 0, ${Math.min(0.6, 0.2 + (Math.abs(shadow) / 20))})`;
        ctx.filter = `blur(${Math.abs(shadow) * 1.5 + 2}px)`;
        ctx.fillRect(
            -sourceCanvas.width / 2 + shadow,
            -sourceCanvas.height / 2 + shadow,
            sourceCanvas.width,
            sourceCanvas.height
        );
        ctx.restore();
    }

    // White Paper Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-sourceCanvas.width / 2, -sourceCanvas.height / 2, sourceCanvas.width, sourceCanvas.height);

    // Paper Border
    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    ctx.lineWidth = 1;
    ctx.strokeRect(-sourceCanvas.width / 2, -sourceCanvas.height / 2, sourceCanvas.width, sourceCanvas.height);

    // Draw Content
    if (blur > 0) {
        ctx.filter = `blur(${blur}px)`;
    }
    ctx.drawImage(sourceCanvas, -sourceCanvas.width / 2, -sourceCanvas.height / 2);
    ctx.restore();
    ctx.filter = 'none';

    // --- PIXEL MANIPULATION (Noise, Chromatic, Distortion) ---
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const width = canvas.width;
    const height = canvas.height;

    // We need a copy of the original data for distortion/chromatic sampling
    const sourceData = new Uint8ClampedArray(data);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const index = (y * width + x) * 4;

            // 1. Distortion (Warping)
            // Calculate source coordinate
            let sx = x;
            let sy = y;

            if (distortion > 0) {
                // Simple sine wave warp
                const offsetY = Math.sin(x / 150) * distortion * 2;
                sy = y + offsetY;
            }

            // Boundary checks
            if (sx < 0 || sx >= width || sy < 0 || sy >= height) {
                // Keep white (background)
                continue;
            }

            // 2. Chromatic Aberration
            // Sample R, G, B from slightly different positions
            const redOffset = chromaticAberration;
            const blueOffset = -chromaticAberration;

            // Helper to sample
            const getPixelParams = (tx: number, ty: number) => {
                const ix = Math.floor(Math.max(0, Math.min(width - 1, tx)));
                const iy = Math.floor(Math.max(0, Math.min(height - 1, ty)));
                return (iy * width + ix) * 4;
            };

            const rIdx = getPixelParams(sx + redOffset, sy);
            const gIdx = getPixelParams(sx, sy);
            const bIdx = getPixelParams(sx + blueOffset, sy);

            let r = sourceData[rIdx];
            let g = sourceData[gIdx + 1];
            let b = sourceData[bIdx + 2];
            // Alpha: use green channel's alpha as representative
            const a = sourceData[gIdx + 3];

            // 3. Color Effects (Grayscale, Noise, etc)

            // A. Grayscale
            if (grayscale) {
                const avg = 0.299 * r + 0.587 * g + 0.114 * b;
                r = g = b = avg;
            }

            // B. Contrast/Brightness
            if (contrast !== 1 || brightness !== 1) {
                r = brightness * (contrast * (r - 128) + 128);
                g = brightness * (contrast * (g - 128) + 128);
                b = brightness * (contrast * (b - 128) + 128);
            }

            // C. Noise
            if (noise > 0) {
                const random = (0.5 - Math.random()) * (noise * 100);
                r += random;
                g += random;
                b += random;
            }

            // Write back
            data[index] = Math.min(255, Math.max(0, r));
            data[index + 1] = Math.min(255, Math.max(0, g));
            data[index + 2] = Math.min(255, Math.max(0, b));
            data[index + 3] = a; // Keep original alpha (mostly 255)
        }
    }

    ctx.putImageData(imageData, 0, 0);

    return canvas;
}
