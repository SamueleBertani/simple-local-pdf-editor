import { useToolStore } from '../../store/useToolStore';

export function TextInput() {
    const { activeTool, toolSettings, setToolSettings } = useToolStore();

    if (activeTool !== 'text') return null;

    return (
        <div className="w-full flex flex-col gap-6">
            <div className="space-y-6">
                <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">Size</label>
                    <div className="flex items-center gap-4">
                        <input
                            type="range"
                            min="10"
                            max="72"
                            value={toolSettings.fontSize}
                            onChange={(e) => setToolSettings({ fontSize: Number(e.target.value) })}
                            className="flex-1 accent-indigo-600 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="text-sm font-semibold text-slate-600 w-8 text-right">{toolSettings.fontSize}</span>
                    </div>
                </div>

                <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">Color</label>
                    <div className="flex gap-3 flex-wrap">
                        {['#000000', '#EF4444', '#3B82F6', '#10B981', '#FFFFFF'].map((c) => (
                            <button
                                key={c}
                                onClick={() => setToolSettings({ color: c })}
                                className={`w-10 h-10 rounded-full border-2 transition-all shadow-sm ${toolSettings.color === c
                                    ? 'border-indigo-600 scale-110 ring-2 ring-100'
                                    : 'border-transparent hover:scale-105'
                                    }`}
                                style={{ backgroundColor: c }}
                            />
                        ))}
                    </div>
                </div>

                <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">Font Family</label>
                    <div className="flex gap-2">
                        <button onClick={() => setToolSettings({ fontFamily: 'sans-serif' })} className={`flex-1 py-2 text-sm border rounded-lg transition-colors ${toolSettings.fontFamily === 'sans-serif' ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'}`}>Sans</button>
                        <button onClick={() => setToolSettings({ fontFamily: 'serif' })} className={`flex-1 py-2 text-sm border rounded-lg transition-colors font-serif ${toolSettings.fontFamily === 'serif' ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'}`}>Serif</button>
                        <button onClick={() => setToolSettings({ fontFamily: 'monospace' })} className={`flex-1 py-2 text-sm border rounded-lg transition-colors font-mono ${toolSettings.fontFamily === 'monospace' ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'}`}>Mono</button>
                    </div>
                </div>
            </div>
            <p className="text-xs text-slate-400 text-center mt-4">
                Click on canvas to add text
            </p>
        </div>
    );
}
