
import { useState } from 'react';
import { useToolStore } from '../../store/useToolStore';
import { Button } from '../ui/Button';

export function TextInput() {
    const { activeTool, setPendingImage, setActiveTool } = useToolStore();
    const [text, setText] = useState('');
    const [fontSize, setFontSize] = useState(20);
    const [color, setColor] = useState('#000000');
    const [fontFamily, setFontFamily] = useState('sans-serif');

    if (activeTool !== 'text') return null;

    const handleGenerate = () => {
        if (!text) return;

        // Create an SVG with the text
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Measure text
        ctx.font = `${fontSize}px ${fontFamily}`;
        const metrics = ctx.measureText(text);
        const width = Math.ceil(metrics.width + 10);
        const height = Math.ceil(fontSize * 1.5 + 10);

        const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
                <text x="5" y="${fontSize}" font-family="${fontFamily}" font-size="${fontSize}px" fill="${color}">${text}</text>
            </svg>
        `;

        const url = `data:image/svg+xml;base64,${btoa(svg)}`;
        setPendingImage(url);
    };

    return (
        <div className="absolute top-4 left-64 bg-white p-4 rounded-xl shadow-xl border border-slate-200 z-50 animate-in fade-in zoom-in-95 w-80">
            <h3 className="text-sm font-semibold mb-3">Add Text</h3>

            <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type text..."
                className="w-full border border-slate-300 rounded-lg p-2 mb-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autoFocus
            />

            <div className="space-y-4 mb-4">
                <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">Size: {fontSize}px</label>
                    <input
                        type="range"
                        min="10"
                        max="72"
                        value={fontSize}
                        onChange={(e) => setFontSize(Number(e.target.value))}
                        className="w-full accent-indigo-600 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                    />
                </div>

                <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">Color</label>
                    <div className="flex gap-2">
                        {['#000000', '#EF4444', '#3B82F6', '#10B981', '#FFFFFF'].map((c) => (
                            <button
                                key={c}
                                onClick={() => setColor(c)}
                                className={`w-8 h-8 rounded-full border-2 transition-all ${color === c
                                        ? 'border-indigo-600 scale-110 ring-2 ring-indigo-100'
                                        : 'border-slate-200 opacity-80 hover:scale-105'
                                    }`}
                                style={{ backgroundColor: c }}
                            />
                        ))}
                    </div>
                </div>

                <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">Font</label>
                    <div className="flex gap-2">
                        <button onClick={() => setFontFamily('sans-serif')} className={`px-2 py-1 text-xs border rounded ${fontFamily === 'sans-serif' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'border-slate-200'}`}>Sans</button>
                        <button onClick={() => setFontFamily('serif')} className={`px-2 py-1 text-xs border rounded ${fontFamily === 'serif' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'border-slate-200'}`}>Serif</button>
                        <button onClick={() => setFontFamily('monospace')} className={`px-2 py-1 text-xs border rounded ${fontFamily === 'monospace' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'border-slate-200'}`}>Mono</button>
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button variant="ghost" size="sm" onClick={() => setActiveTool('select')}>Cancel</Button>
                <Button size="sm" onClick={handleGenerate}>Add Text</Button>
            </div>
        </div>
    );
}
