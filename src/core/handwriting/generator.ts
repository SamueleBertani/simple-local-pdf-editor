import * as opentype from 'opentype.js';
import fontUrl from '../../assets/Caveat-Regular.ttf';

let cachedFont: opentype.Font | null = null;
const FONT_URL = fontUrl;

export interface HandwritingOptions {
    color?: string;
    strokeWidth?: number;
    randomness?: number; // 0 to 2, default 1
    seed?: number; // Variation seed
}

/**
 * Generates an SVG string of handwriting based on text input.
 * Uses a custom heuristic to randomize glyph placement and rotation, simulating natural handwriting.
 *
 * @param text The text to convert to handwriting.
 * @param options Styling and randomization options.
 * @returns A Data URL string (data:image/svg+xml;base64,...) containing the SVG rendering, or an empty string if generation fails (invalid dimensions).
 */
export async function generateHandwriting(text: string, options: HandwritingOptions = {}): Promise<string> {
    const { color = 'black', strokeWidth = 1, randomness = 1, seed = 0 } = options;

    if (!cachedFont) {
        try {
            // Handle both default export and star import scenarios
            const lib = (opentype as unknown as { default?: typeof opentype }).default || opentype;
            if (!lib || !lib.parse) throw new Error('Opentype library is not loaded correctly.');

            const response = await fetch(FONT_URL);
            if (!response.ok) {
                throw new Error(`Network response error: ${response.status} ${response.statusText}`);
            }

            const buffer = await response.arrayBuffer();
            cachedFont = lib.parse(buffer);
        } catch (error) {
            console.error('Handwriting generation error:', error);
            throw error;
        }
    }

    if (!cachedFont) throw new Error('Failed to load font');

    const fontSize = 72;
    const glyphs = cachedFont.stringToGlyphs(text);
    const scale = 1 / cachedFont.unitsPerEm * fontSize;

    // Master path to accumulate all glyph paths
    const masterPath = new opentype.Path();

    let xCurr = 0;

    glyphs.forEach((glyph) => {
        if (!glyph.unicode) {
            // Handle spacing/unknown
            xCurr += glyph.advanceWidth ? glyph.advanceWidth * scale : fontSize * 0.3;
            return;
        }

        // Simple seeded random function
        const pseudoRandom = () => {
            const x = Math.sin(seed + glyph.index + xCurr) * 10000;
            return x - Math.floor(x);
        };

        // Random variations scaled by randomness factor
        const r1 = seed ? pseudoRandom() : Math.random();
        const r2 = seed ? pseudoRandom() : Math.random();
        const r3 = seed ? pseudoRandom() : Math.random();

        const rot = (r1 - 0.5) * 10 * randomness; // +/- 5 degrees * factor
        const yOff = (r2 - 0.5) * 10 * randomness; // +/- 5 pixels baseline * factor
        const xOff = (r3 - 0.5) * 5 * randomness;  // +/- 2.5 pixels spacing * factor

        // Get path for the glyph at (0,0) so we can rotate it easily
        const path = glyph.getPath(0, 0, fontSize);

        // Apply transformations manually to commands
        const bbox = glyph.getBoundingBox();
        const cx = (bbox.x1 + bbox.x2) * scale / 2;
        const cy = (bbox.y1 + bbox.y2) * scale / 2;

        const rad = rot * Math.PI / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);

        // PathCommand is a discriminated union - we cast to access optional coordinate properties
        type MutablePathCommand = { x?: number; y?: number; x1?: number; y1?: number; x2?: number; y2?: number };
        path.commands.forEach((cmd) => {
            const command = cmd as MutablePathCommand;
            if (command.x !== undefined && command.y !== undefined) {
                const px = command.x - cx;
                const py = command.y - cy;
                const nx = px * cos - py * sin + cx;
                const ny = px * sin + py * cos + cy;
                command.x = nx + xCurr + xOff;
                command.y = ny + fontSize + yOff;
            }
            if (command.x1 !== undefined && command.y1 !== undefined) {
                const px = command.x1 - cx;
                const py = command.y1 - cy;
                const nx = px * cos - py * sin + cx;
                const ny = px * sin + py * cos + cy;
                command.x1 = nx + xCurr + xOff;
                command.y1 = ny + fontSize + yOff;
            }
            if (command.x2 !== undefined && command.y2 !== undefined) {
                const px = command.x2 - cx;
                const py = command.y2 - cy;
                const nx = px * cos - py * sin + cx;
                const ny = px * sin + py * cos + cy;
                command.x2 = nx + xCurr + xOff;
                command.y2 = ny + fontSize + yOff;
            }
        });

        masterPath.extend(path);

        // Advance
        xCurr += ((glyph.advanceWidth || 0) * scale) + xOff;
    });

    const svgPath = masterPath.toPathData(2);
    const bbox = masterPath.getBoundingBox();
    const width = bbox.x2 - bbox.x1 + 20;
    const height = bbox.y2 - bbox.y1 + 20;

    if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) return '';

    const viewBoxX = bbox.x1 - 10;
    const viewBoxY = bbox.y1 - 10;

    const normalizedWeight = strokeWidth || 1;
    let erodeRadius = 0;
    let finalStrokeWidth = 0;

    // Logic: 0.1 to 1.0 -> Erosion (Thinning)
    // 1.0 to 3.0 -> Stroke (Thickening)
    if (normalizedWeight < 1) {
        erodeRadius = (1 - normalizedWeight) * 1; // E.g. 0.1 -> 0.9px erosion
        finalStrokeWidth = 0;
    } else {
        erodeRadius = 0;
        finalStrokeWidth = (normalizedWeight - 1) * 1.5; // E.g. 3 -> 3px stroke
    }

    const filterId = `erode-${Date.now()}`;
    const filterDef = erodeRadius > 0 ? `
        <defs>
            <filter id="${filterId}">
                <feMorphology operator="erode" radius="${erodeRadius}" />
            </filter>
        </defs>
    ` : '';

    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${viewBoxX} ${viewBoxY} ${width} ${height}">
            ${filterDef}
            <path d="${svgPath}" fill="${color}" stroke="${finalStrokeWidth > 0 ? color : 'none'}" stroke-width="${finalStrokeWidth}" ${erodeRadius > 0 ? `filter="url(#${filterId})"` : ''} />
        </svg>
    `;

    return `data:image/svg+xml;base64,${btoa(svg)}`;
}
