import { GLYPHS } from './glyphs';

export function generateHandwriting(text: string) {
    const scale = 2; // Base scale
    let pathFn = '';
    let offsetX = 0;
    const jitterAmount = 0.5;

    const textUpper = text.toUpperCase();

    for (const char of textUpper) {
        const glyph = GLYPHS[char];
        if (!glyph) {
            // Fallback for unknown: just move ahead
            offsetX += 8 * scale;
            continue;
        }

        let penDown = false;
        for (const point of glyph) {
            if (point === null) {
                penDown = false;
                continue;
            }

            // Add Jitter
            const jx = (Math.random() - 0.5) * jitterAmount;
            const jy = (Math.random() - 0.5) * jitterAmount;

            const x = (point[0] * scale) + offsetX + jx;
            const y = (point[1] * scale) + jy;

            if (!penDown) {
                pathFn += ` M ${x} ${y}`;
                penDown = true;
            } else {
                pathFn += ` L ${x} ${y}`;
            }
        }

        // Simplistic spacing
        offsetX += 12 * scale; // 10 width + 2 spacing
    }

    return pathFn.trim();
}
