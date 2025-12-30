export interface ScannerOptions {
    noise: number; // 0-1
    tilt: number; // degrees
    grayscale: boolean;
    contrast: number; // 1 = normal
    brightness: number; // 1 = normal
    blur: number; // 0 = none
    shadow: number; // Shadow strength/offset
    rotate: boolean; // Just for random variation?
}

export const DEFAULT_SCANNER_OPTIONS: ScannerOptions = {
    noise: 0.2,
    tilt: 0.5,
    grayscale: true,
    contrast: 1.2,
    brightness: 1.0,
    blur: 0.5,
    shadow: 0,
    rotate: true,
};

export async function applyScannerEffect(
    sourceCanvas: HTMLCanvasElement,
    options: ScannerOptions
): Promise<HTMLCanvasElement> {
    const { noise, tilt, grayscale, contrast, brightness, blur, shadow } = options;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return sourceCanvas;

    // 1. Setup Canvas with Padding for Rotate/Shadow
    const padding = 50;
    canvas.width = sourceCanvas.width + padding * 2;
    canvas.height = sourceCanvas.height + padding * 2;

    // Fill white background (The "Scanner Lid" or just paper behind)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Transform Context
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((tilt * Math.PI) / 180);

    // 3. Draw Shadow (Manually, so we can control it)
    if (shadow > 0) {
        ctx.save();
        ctx.fillStyle = `rgba(0, 0, 0, 0.4)`; // Base shadow color
        // Draw slightly offset rect
        ctx.filter = `blur(${shadow * 2}px)`; // Blurriness increases with size
        ctx.fillRect(
            -sourceCanvas.width / 2 + shadow,
            -sourceCanvas.height / 2 + shadow,
            sourceCanvas.width,
            sourceCanvas.height
        );
        ctx.restore();
    }

    // 4. Draw Paper Background (to cover the shadow behind it)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-sourceCanvas.width / 2, -sourceCanvas.height / 2, sourceCanvas.width, sourceCanvas.height);

    // 5. Draw Paper Border (1px Outline)
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(-sourceCanvas.width / 2, -sourceCanvas.height / 2, sourceCanvas.width, sourceCanvas.height);

    // 6. Draw Content
    if (blur > 0) {
        ctx.filter = `blur(${blur}px)`;
    }
    ctx.drawImage(sourceCanvas, -sourceCanvas.width / 2, -sourceCanvas.height / 2);
    ctx.restore();
    ctx.filter = 'none';

    // 7. Apply Pixel Effects (Noise, Grayscale, Contrast) to EVERYTHING
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

        data[i] = Math.min(255, Math.max(0, r));
        data[i + 1] = Math.min(255, Math.max(0, g));
        data[i + 2] = Math.min(255, Math.max(0, b));
    }

    ctx.putImageData(imageData, 0, 0);

    return canvas;
}
