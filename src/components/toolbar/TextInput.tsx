import { useToolStore } from '../../store/useToolStore';
import { ColorPicker } from './ColorPicker';
import { cn } from '../../utils/cn';

const TEXT_COLORS = ['#000000', '#EF4444', '#3B82F6', '#10B981', '#FFFFFF', '#6B7280'] as const;

/** Base styles for font family selection buttons */
const FONT_BTN_BASE = "flex-1 py-2 text-sm border rounded-lg transition-colors";
const FONT_BTN_SELECTED = "bg-primary-600 border-primary-600 text-white shadow-md";
const FONT_BTN_UNSELECTED = "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-primary-300 dark:hover:border-primary-500";

export function TextInput() {
    const { toolSettings, setToolSettings } = useToolStore();

    return (
        <div className="w-full flex flex-col gap-6">
            <div className="space-y-6">
                <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">Size</label>
                    <div className="flex items-center gap-4">
                        <input
                            type="range"
                            min="10"
                            max="72"
                            value={toolSettings.fontSize}
                            onChange={(e) => setToolSettings({ fontSize: Number(e.target.value) })}
                            className="flex-1 accent-primary-500 h-2 bg-slate-100 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="text-sm font-semibold text-slate-600 dark:text-slate-400 w-8 text-right">{toolSettings.fontSize}</span>
                    </div>
                </div>

                <ColorPicker
                    colors={TEXT_COLORS}
                    value={toolSettings.color}
                    onChange={(color) => setToolSettings({ color })}
                />

                <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">Font Family</label>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setToolSettings({ fontFamily: 'sans-serif' })}
                            className={cn(
                                FONT_BTN_BASE,
                                toolSettings.fontFamily === 'sans-serif' ? FONT_BTN_SELECTED : FONT_BTN_UNSELECTED
                            )}
                        >
                            Sans
                        </button>
                        <button
                            onClick={() => setToolSettings({ fontFamily: 'serif' })}
                            className={cn(
                                FONT_BTN_BASE,
                                "font-serif",
                                toolSettings.fontFamily === 'serif' ? FONT_BTN_SELECTED : FONT_BTN_UNSELECTED
                            )}
                        >
                            Serif
                        </button>
                        <button
                            onClick={() => setToolSettings({ fontFamily: 'monospace' })}
                            className={cn(
                                FONT_BTN_BASE,
                                "font-mono",
                                toolSettings.fontFamily === 'monospace' ? FONT_BTN_SELECTED : FONT_BTN_UNSELECTED
                            )}
                        >
                            Mono
                        </button>
                    </div>
                </div>
            </div>
            <p className="text-xs text-slate-400 text-center mt-4">
                Click on canvas to add text
            </p>
        </div>
    );
}
