import { useState, useEffect } from 'react';
import { useToolStore } from '../../store/useToolStore';
import { generateHandwriting } from '../../core/handwriting/generator';
import { Button } from '../ui/Button';

export function HandwritingInput() {
    const { activeTool, setPendingImage, setActiveTool } = useToolStore();
    const [text, setText] = useState('');
    const [color, setColor] = useState('#000000');
    const [strokeWidth, setStrokeWidth] = useState(1);
    const [randomness, setRandomness] = useState(1);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [seed, setSeed] = useState(0);

    // Live preview generation
    useEffect(() => {
        const generatePreview = async () => {
            if (!text) {
                setPreviewUrl(null);
                return;
            }
            try {
                const url = await generateHandwriting(text, { color, strokeWidth, randomness });
                setPreviewUrl(url);
            } catch (e) {
                // Silent fail for preview
            }
        };

        const timer = setTimeout(generatePreview, 100); // 100ms debounce
        return () => clearTimeout(timer);
    }, [text, color, strokeWidth, randomness, seed]);

    if (activeTool !== 'handwriting') return null;

    const handleGenerate = async () => {
        if (!text) return;
        if (previewUrl) {
            // Use cached preview if available
            setPendingImage(previewUrl);
        } else {
            // Fallback generation
            try {
                const url = await generateHandwriting(text, { color, strokeWidth, randomness });
                setPendingImage(url);
            } catch (error: any) {
                console.error('Failed to generate handwriting:', error);
                alert(`Error: ${error.message || error}`);
            }
        }
    };

    const colors = ['#000000', '#374151', '#6b7280', '#9ca3af']; // Black to Gray-400

    return (
        <div className="absolute top-4 left-64 bg-white p-4 rounded-xl shadow-xl border border-slate-200 z-50 animate-in fade-in zoom-in-95 w-80">
            <h3 className="text-sm font-semibold mb-3">Generate Handwriting</h3>

            {/* Preview Section */}
            <div className="relative min-h-[80px] flex items-center justify-center bg-slate-50 border border-slate-100 rounded-lg mb-4 p-2 overflow-hidden group">
                {previewUrl ? (
                    <img src={previewUrl} alt="Signature Preview" className="max-h-20 max-w-full object-contain" />
                ) : (
                    <span className="text-xs text-slate-400 italic">Preview will appear here...</span>
                )}

                {/* Shuffle Button */}
                <button
                    onClick={() => setSeed(s => s + 1)}
                    className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-sm border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 transition-all opacity-0 group-hover:opacity-100"
                    title="Shuffle variations"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                        <path d="M3 3v5h5" />
                        <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                        <path d="M16 21h5v-5" />
                    </svg>
                </button>
            </div>

            <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type your signature..."
                className="w-full border border-slate-300 rounded-lg p-2 mb-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autoFocus
            />

            <div className="space-y-4 mb-4">
                {/* Color Selection */}
                <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">Ink Color</label>
                    <div className="flex gap-2">
                        {colors.map((c) => (
                            <button
                                key={c}
                                onClick={() => setColor(c)}
                                className={`w-8 h-8 rounded-full border-2 transition-all ${color === c
                                    ? 'border-indigo-600 scale-110 ring-2 ring-indigo-100'
                                    : 'border-transparent hover:scale-105'
                                    }`}
                                style={{ backgroundColor: c }}
                                title={c}
                            />
                        ))}
                    </div>
                </div>

                {/* Stroke Width Slider */}
                <div>
                    <div className="flex justify-between mb-1">
                        <label className="text-xs font-medium text-slate-500">Stroke Width</label>
                        <span className="text-xs text-slate-400">{strokeWidth}px</span>
                    </div>
                    <input
                        type="range"
                        min="0.1"
                        max="3"
                        step="0.1"
                        value={strokeWidth}
                        onChange={(e) => setStrokeWidth(parseFloat(e.target.value))}
                        className="w-full accent-indigo-600 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                    />
                </div>

                {/* Randomness Slider */}
                <div>
                    <div className="flex justify-between mb-1">
                        <label className="text-xs font-medium text-slate-500">Messiness</label>
                        <span className="text-xs text-slate-400">{(randomness * 100).toFixed(0)}%</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="2"
                        step="0.1"
                        value={randomness}
                        onChange={(e) => setRandomness(parseFloat(e.target.value))}
                        className="w-full accent-indigo-600 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                    />
                </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button variant="ghost" size="sm" onClick={() => setActiveTool('select')}>Cancel</Button>
                <Button size="sm" onClick={handleGenerate}>Sign</Button>
            </div>
        </div>
    );
}
