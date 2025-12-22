import opentype from 'opentype.js';
// @ts-ignore
import fontUrl from '../../assets/Caveat-Regular.ttf';

let cachedFont: opentype.Font | null = null;
const FONT_URL = fontUrl;

export async function generateHandwriting(text: string, color: string = 'black'): Promise<string> {
    console.log('Generating handwriting for:', text);
    console.log('Opentype object:', opentype);
    console.log('Font URL:', FONT_URL);

    if (!cachedFont) {
        try {
            if (!opentype) throw new Error('Opentype library is undefined. Check import.');

            console.log('Fetching font...');
            const response = await fetch(FONT_URL);
            console.log('Fetch response status:', response.status);

            if (!response.ok) {
                throw new Error(`Network response error: ${response.status} ${response.statusText}`);
            }

            const buffer = await response.arrayBuffer();
            console.log('Buffer received, size:', buffer.byteLength);

            cachedFont = opentype.parse(buffer);
            console.log('Font parsed successfully');
        } catch (error) {
            console.error('Detailed handwriting error:', error);
            throw error;
        }
    }

    if (!cachedFont) throw new Error('Failed to load font');

    const fontSize = 72; // Base size
    const path = cachedFont.getPath(text, 0, fontSize, fontSize); // x=0, y=fontSize (baseline)

    // Apply Jitter
    path.commands.forEach((cmd: any) => {
        const jitter = () => (Math.random() - 0.5) * 2; // +/- 1

        if (cmd.x !== undefined) cmd.x += jitter();
        if (cmd.y !== undefined) cmd.y += jitter();
        if (cmd.x1 !== undefined) cmd.x1 += jitter();
        if (cmd.y1 !== undefined) cmd.y1 += jitter();
        if (cmd.x2 !== undefined) cmd.x2 += jitter();
        if (cmd.y2 !== undefined) cmd.y2 += jitter();
    });

    const svgPath = path.toPathData(2);
    const bbox = path.getBoundingBox();
    const width = bbox.x2 - bbox.x1 + 10;
    const height = bbox.y2 - bbox.y1 + 10;

    // Check if width or height is NaN or 0 (empty text)
    if (!width || !height) return '';

    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${bbox.x1} ${bbox.y1} ${width} ${height}">
            <path d="${svgPath}" fill="${color}" stroke="${color}" stroke-width="1" />
        </svg>
    `;

    return `data:image/svg+xml;base64,${btoa(svg)}`;
}
