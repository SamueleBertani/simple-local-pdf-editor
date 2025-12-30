import { useToolStore } from '../../store/useToolStore';

export function TextInput() {
    const { activeTool, toolSettings, setToolSettings } = useToolStore();

    if (activeTool !== 'text') return null;

    return (
        <div className="absolute top-4 left-64 bg-white p-4 rounded-xl shadow-xl border border-slate-200 z-50 animate-in fade-in zoom-in-95 w-80">
            <h3 className="text-sm font-semibold mb-3">Text Settings</h3>

            <div className="space-y-4 mb-4">
                <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">Size: {toolSettings.fontSize}px</label>
                    <input
                        type="range"
                        min="10"
                        max="72"
                        value={toolSettings.fontSize}
                        onChange={(e) => setToolSettings({ fontSize: Number(e.target.value) })}
                        className="w-full accent-indigo-600 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                    />
                </div>

                <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">Color</label>
                    <div className="flex gap-2">
                        {['#000000', '#EF4444', '#3B82F6', '#10B981', '#FFFFFF'].map((c) => (
                            <button
                                key={c}
                                onClick={() => setToolSettings({ color: c })}
                                className={`w-8 h-8 rounded-full border-2 transition-all ${toolSettings.color === c
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
                        <button onClick={() => setToolSettings({ fontFamily: 'sans-serif' })} className={`px-2 py-1 text-xs border rounded ${toolSettings.fontFamily === 'sans-serif' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'border-slate-200'}`}>Sans</button>
                        <button onClick={() => setToolSettings({ fontFamily: 'serif' })} className={`px-2 py-1 text-xs border rounded ${toolSettings.fontFamily === 'serif' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'border-slate-200'}`}>Serif</button>
                        <button onClick={() => setToolSettings({ fontFamily: 'monospace' })} className={`px-2 py-1 text-xs border rounded ${toolSettings.fontFamily === 'monospace' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'border-slate-200'}`}>Mono</button>
                    </div>
                </div>
            </div>
            <p className="text-[10px] text-slate-400 mt-2 text-center">
                Click on canvas to add text
            </p>
        </div>
    );
}
