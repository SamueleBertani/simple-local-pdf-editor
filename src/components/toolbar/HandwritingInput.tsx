import { useState, useEffect } from 'react';
import { useToolStore } from '../../store/useToolStore';
import { generateHandwriting } from '../../core/handwriting/generator';
import { Shuffle } from 'lucide-react';
import { ColorPicker } from './ColorPicker';

const INK_COLORS = ['#000000', '#374151', '#6b7280', '#9ca3af', '#EF4444', '#3B82F6'] as const;

export function HandwritingInput() {
    const { pendingImage, setPendingImage } = useToolStore();
    const [text, setText] = useState('');
    const [color, setColor] = useState('#000000');
    const [strokeWidth, setStrokeWidth] = useState(1);
    const [randomness, setRandomness] = useState(1);
    const [seed, setSeed] = useState(0);

    // Auto-generate on change
    useEffect(() => {
        const generate = async () => {
            if (!text) {
                setPendingImage(null);
                return;
            }
            try {
                const url = await generateHandwriting(text, { color, strokeWidth, randomness, seed });
                setPendingImage(url);
            } catch {
                // Signature generation failed silently
            }
        };

        const timer = setTimeout(generate, 200); // Debounce
        return () => clearTimeout(timer);
    }, [text, color, strokeWidth, randomness, seed, setPendingImage]);

    return (
        <div className="w-full flex flex-col gap-6">
            {/* Preview Section */}
            <div className="relative min-h-[120px] flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-lg p-4 overflow-hidden group">
                {pendingImage ? (
                    <img src={pendingImage} alt="Signature Preview" className="max-h-24 max-w-full object-contain" />
                ) : (
                    <span className="text-xs text-slate-400 italic">Preview will appear here...</span>
                )}

                {/* Shuffle Button (Inside Preview) */}
                <button
                    onClick={() => setSeed(s => s + 1)}
                    className="absolute top-2 right-2 p-1.5 bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 rounded-md shadow-sm border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
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
                className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-base dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                autoFocus
            />

            <div className="space-y-6">
                {/* Color Selection */}
                <ColorPicker
                    label="Ink Color"
                    colors={INK_COLORS}
                    value={color}
                    onChange={setColor}
                />

                {/* Stroke Width Slider */}
                <div>
                    <div className="flex justify-between mb-1">
                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Thickness</label>
                        <span className="text-xs text-slate-400 dark:text-slate-500">{strokeWidth}px</span>
                    </div>
                    <input
                        type="range"
                        min="0.5"
                        max="3"
                        step="0.1"
                        value={strokeWidth}
                        onChange={(e) => setStrokeWidth(parseFloat(e.target.value))}
                        className="w-full accent-indigo-600 h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                    />
                </div>

                {/* Randomness Slider */}
                <div>
                    <div className="flex justify-between mb-1">
                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Messiness</label>
                        <span className="text-xs text-slate-400 dark:text-slate-500">{(randomness * 100).toFixed(0)}%</span>
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

            <p className="text-xs text-slate-400 text-center mt-4">
                Click on canvas to place signature
            </p>
        </div>
    );
}
