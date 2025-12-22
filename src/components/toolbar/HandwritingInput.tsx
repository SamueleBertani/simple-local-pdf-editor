import { useState } from 'react';
import { useToolStore } from '../../store/useToolStore';
import { generateHandwriting } from '../../core/handwriting/generator';
import { Button } from '../ui/Button';

export function HandwritingInput() {
    const { activeTool, setPendingImage, setActiveTool } = useToolStore();
    const [text, setText] = useState('');

    if (activeTool !== 'handwriting') return null;

    const handleGenerate = async () => {
        if (!text) return;

        try {
            // Generate SVG Data URL from text using Opentype.js
            const url = await generateHandwriting(text);
            setPendingImage(url);
        } catch (error: any) {
            console.error('Failed to generate handwriting:', error);
            alert(`Error: ${error.message || error}`);
        }
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
