import { useState, useEffect } from 'react';
import { useToolStore } from '../../store/useToolStore';
import { generateHandwriting } from '../../core/handwriting/generator';
import { Shuffle } from 'lucide-react';

export function HandwritingInput() {
    const { activeTool, pendingImage, setPendingImage } = useToolStore();
    const [text, setText] = useState('');
    const [color, setColor] = useState('#000000');
    const [strokeWidth, setStrokeWidth] = useState(1);
    const [randomness, setRandomness] = useState(1);
    const [seed, setSeed] = useState(0);

    // Auto-generate on change
    useEffect(() => {
        if (activeTool !== 'handwriting') return;

        const generate = async () => {
            if (!text) {
                setPendingImage(null);
                return;
            }
            try {
                const url = await generateHandwriting(text, { color, strokeWidth, randomness, seed });
                setPendingImage(url);
            } catch (error) {
                console.error("Signature generation failed", error);
            }
        };

        const timer = setTimeout(generate, 200); // Debounce
        return () => clearTimeout(timer);
    }, [text, color, strokeWidth, randomness, seed, setPendingImage, activeTool]);

    if (activeTool !== 'handwriting') return null;

    const colors = ['#000000', '#374151', '#6b7280', '#9ca3af', '#EF4444', '#3B82F6'];

    return (
        <div className="absolute top-4 left-64 bg-white p-4 rounded-xl shadow-xl border border-slate-200 z-50 animate-in fade-in zoom-in-95 w-72">
            <h3 className="text-sm font-semibold mb-3">Signature Generator</h3>

            {/* Preview Section */}
            <div className="relative min-h-[80px] flex items-center justify-center bg-slate-50 border border-slate-100 rounded-lg mb-4 p-2 overflow-hidden group">
                {pendingImage ? (
                    <img src={pendingImage} alt="Signature Preview" className="max-h-20 max-w-full object-contain" />
                ) : (
                    <span className="text-xs text-slate-400 italic">Preview will appear here...</span>
                )}

                {/* Shuffle Button (Inside Preview) */}
                <button
                    onClick={() => setSeed(s => s + 1)}
                    className="absolute top-2 right-2 p-1.5 bg-white/80 hover:bg-white rounded-md shadow-sm border border-slate-200 text-slate-500 hover:text-indigo-600 transition-all"
                    title="Shuffle Variation"
                >
                    <Shuffle className="w-4 h-4" />
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

            <div className="space-y-4 mb-2">
                {/* Color Selection */}
                <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">Ink Color</label>
                    <div className="flex gap-2 flex-wrap">
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
                        <label className="text-xs font-medium text-slate-500">Thickness</label>
                        <span className="text-xs text-slate-400">{strokeWidth}px</span>
                    </div>
                    <input
                        type="range"
                        min="0.5"
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

            <p className="text-[10px] text-slate-400 mt-2 text-center">
                Click on canvas to place signature
            </p>
        </div>
    );
}
