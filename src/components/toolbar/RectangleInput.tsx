
import { useState } from 'react';
import { useToolStore } from '../../store/useToolStore';
import { Button } from '../ui/Button';

export function RectangleInput() {
    const { activeTool, setPendingImage, setActiveTool } = useToolStore();

    // Default is white opaque for covering info
    const [color, setColor] = useState('#FFFFFF');

    if (activeTool !== 'rectangle') return null;

    const handleGenerate = () => {
        // Create a simple white rectangle SVG
        // Default size 200x50, user can resize it
        const width = 200;
        const height = 50;

        const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
                <rect width="${width}" height="${height}" fill="${color}" />
            </svg>
        `;

        const url = `data:image/svg+xml;base64,${btoa(svg)}`;
        setPendingImage(url);
    };

    return (
        <div className="absolute top-4 left-64 bg-white p-4 rounded-xl shadow-xl border border-slate-200 z-50 animate-in fade-in zoom-in-95 w-64">
            <h3 className="text-sm font-semibold mb-3">Add Cover Rect</h3>

            <p className="text-xs text-slate-500 mb-4">
                Creates a resizable rectangle to cover information.
            </p>

            <div className="space-y-4 mb-4">
                <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">Color</label>
                    <div className="flex gap-2">
                        {['#FFFFFF', '#000000', '#F3F4F6'].map((c) => (
                            <button
                                key={c}
                                onClick={() => setColor(c)}
                                className={`w-8 h-8 rounded-md border-2 transition-all ${color === c
                                    ? 'border-indigo-600 scale-110 ring-2 ring-indigo-100'
                                    : 'border-slate-200 opacity-80 hover:scale-105'
                                    }`}
                                style={{ backgroundColor: c }}
                                title={c === '#FFFFFF' ? 'White' : c === '#000000' ? 'Black' : 'Gray'}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button variant="ghost" size="sm" onClick={() => setActiveTool('select')}>Cancel</Button>
                <Button size="sm" onClick={handleGenerate}>Add Rect</Button>
            </div>
        </div>
    );
}
