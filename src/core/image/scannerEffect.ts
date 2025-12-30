export interface ScannerOptions {
    noise: number; // 0-1
    tilt: number; // degrees, e.g. -2 to 2
    grayscale: boolean;
    contrast: number; // 1 = normal, > 1 = high contrast
    brightness: number; // 1 = normal
    blur: number; // 0 = none
    border: boolean;
}

export const DEFAULT_SCANNER_OPTIONS: ScannerOptions = {
    noise: 0.2,
    tilt: 0.5,
    grayscale: true,
    contrast: 1.2,
    brightness: 1.0,
    blur: 0.5,
    border: false,
};

export async function applyScannerEffect(
    sourceCanvas: HTMLCanvasElement,
    options: ScannerOptions
): Promise<HTMLCanvasElement> {
    const { noise, tilt, grayscale, contrast, brightness, blur, border } = options;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return sourceCanvas;

    // 1. Setup Canvas with Tilt Margin if needed
    // Add some padding to avoid cutting off rotated corners
    const padding = Math.abs(tilt) > 0 ? 20 : 0;
    canvas.width = sourceCanvas.width + padding * 2;
    canvas.height = sourceCanvas.height + padding * 2;

    // Fill white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Apply Tilt & Draw Image
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((tilt * Math.PI) / 180);
    // Draw with slight blur if requested
    if (blur > 0) {
        ctx.filter = `blur(${blur}px)`;
    }
    ctx.drawImage(sourceCanvas, -sourceCanvas.width / 2, -sourceCanvas.height / 2);
    ctx.restore();
    ctx.filter = 'none';

    // 3. Get Pixel Data for Pixel-level effects (Noise, Grayscale, Contrast)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        // A. Grayscale
        if (grayscale) {
            const avg = 0.299 * r + 0.587 * g + 0.114 * b;
            r = g = b = avg;
        }

        // B. Contrast & Brightness
        // Formula: factor * (color - 128) + 128
        if (contrast !== 1 || brightness !== 1) {
            r = brightness * (contrast * (r - 128) + 128);
            g = brightness * (contrast * (g - 128) + 128);
            b = brightness * (contrast * (b - 128) + 128);
        }

        // C. Noise
        // Add random variation
        if (noise > 0) {
            const random = (0.5 - Math.random()) * (noise * 100);
            r += random;
            g += random;
            b += random;
        }

        // Clamp values
        data[i] = Math.min(255, Math.max(0, r));
        data[i + 1] = Math.min(255, Math.max(0, g));
        data[i + 2] = Math.min(255, Math.max(0, b));
    }

    ctx.putImageData(imageData, 0, 0);

    // 4. Border / Shadow Effect (Optional)
    if (border) {
        // Implementation for shadow/border if needed
        // For now, implicit via the white padding background
    }

    return canvas;
}
