import { useToolStore } from '../../store/useToolStore';
import { ColorPicker } from './ColorPicker';

export function TextInput() {
    const { activeTool, toolSettings, setToolSettings } = useToolStore();

    if (activeTool !== 'text') return null;

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
                            className="flex-1 accent-indigo-600 h-2 bg-slate-100 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="text-sm font-semibold text-slate-600 dark:text-slate-400 w-8 text-right">{toolSettings.fontSize}</span>
                    </div>
                </div>

                <ColorPicker
                    colors={['#000000', '#EF4444', '#3B82F6', '#10B981', '#FFFFFF', '#6B7280']}
                    value={toolSettings.color}
                    onChange={(color) => setToolSettings({ color })}
                />

                <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">Font Family</label>
                    <div className="flex gap-2">
                        <button onClick={() => setToolSettings({ fontFamily: 'sans-serif' })} className={`flex-1 py-2 text-sm border rounded-lg transition-colors ${toolSettings.fontFamily === 'sans-serif' ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-indigo-500'}`}>Sans</button>
                        <button onClick={() => setToolSettings({ fontFamily: 'serif' })} className={`flex-1 py-2 text-sm border rounded-lg transition-colors font-serif ${toolSettings.fontFamily === 'serif' ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-indigo-500'}`}>Serif</button>
                        <button onClick={() => setToolSettings({ fontFamily: 'monospace' })} className={`flex-1 py-2 text-sm border rounded-lg transition-colors font-mono ${toolSettings.fontFamily === 'monospace' ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-indigo-500'}`}>Mono</button>
                    </div>
                </div>
            </div>
            <p className="text-xs text-slate-400 text-center mt-4">
                Click on canvas to add text
            </p>
        </div>
    );
}
