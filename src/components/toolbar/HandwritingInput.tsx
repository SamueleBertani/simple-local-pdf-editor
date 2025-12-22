import { useState } from 'react';
import { useToolStore } from '../../store/useToolStore';
import { generateHandwriting } from '../../core/handwriting/generator';
import { Button } from '../ui/Button';

export function HandwritingInput() {
    const { activeTool, setPendingImage, setActiveTool } = useToolStore();
    const [text, setText] = useState('');

    if (activeTool !== 'handwriting') return null;

    const handleGenerate = () => {
        if (!text) return;

        // Generate Path
        const pathData = generateHandwriting(text);

        // Wrap in SVG
        // Estimate width based on char count logic from generator
        // This is approximate. Logic: 12*2 per char?
        const width = text.length * 24 + 20;
        const height = 50; // 10 * 2  + margins

        const svgString = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        <path d="${pathData}" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;

        const url = `data:image/svg+xml;base64,${btoa(svgString)}`;

        setPendingImage(url);
        // User can now click to place. 
        // Logic in CanvasOverlay handles the placement.
        // We stay in 'handwriting' mode until placed? 
        // Actually CanvasOverlay resets to 'select' after placement.
    };

    return (
        <div className="absolute top-4 left-64 bg-white p-4 rounded-xl shadow-xl border border-slate-200 z-50 animate-in fade-in zoom-in-95">
            <h3 className="text-sm font-semibold mb-2">Generate Handwriting</h3>
            <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type here..."
                className="w-full border border-slate-300 rounded p-2 mb-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autoFocus
            />
            <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setActiveTool('select')}>Cancel</Button>
                <Button size="sm" onClick={handleGenerate}>Generate & Place</Button>
            </div>
        </div>
    );
}
