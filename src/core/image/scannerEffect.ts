/**
 * Configuration options for the scanner effect simulation.
 */
export interface ScannerOptions {
    /** 0-1: Intensity of random pixel noise (grain) */
    noise: number;
    /** Degrees: Angle of rotation to simulate misalignment */
    tilt: number;
    /** Convert image to grayscale if true */
    grayscale: boolean;
    /** Multiplier: 1 = normal, > 1 increases contrast */
    contrast: number;
    /** Multiplier: 1 = normal, > 1 increases brightness */
    brightness: number;
    /** Pixels: Amount of Gaussian blur to apply (0 = none) */
    blur: number;
    /** Pixels: Offset and size of the drop shadow (0 = none) */
    shadow: number;
    /** Enable rotation (used for random variation logic) */
    rotate: boolean;
    /** 0-20: Intensity of sinusoidal distortion (paper warp) */
    distortion: number;
    /** Pixels: Offset amount for chromatic aberration (color fringing) */
    chromaticAberration: number;
}

export const DEFAULT_SCANNER_OPTIONS: ScannerOptions = {
    noise: 0.2,
    tilt: 0.5,
    grayscale: true,
    contrast: 1.2,
    brightness: 1.0,
    blur: 0.5,
    shadow: 1,
    rotate: true,
    distortion: 1.0,
    chromaticAberration: 1.0,
};

/**
 * Applies a set of realistic scanner effects to a source canvas.
 * Simulates physical scanner imperfections including:
 * - Misalignment (Tilt)
 * - Shadow depth
 * - Paper borders
 * - Optical Distortion (Warping)
 * - Chromatic Aberration (Lens fraying)
 * - Sensor Noise
 * - Lighting adjustments (Contrast/Brightness)
 * 
 * @param sourceCanvas - The input canvas containing the original page/image.
 * @param options - Configuration object for effect intensity.
 * @returns A promise resolving to a new HTMLCanvasElement with effects applied.
 */
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
