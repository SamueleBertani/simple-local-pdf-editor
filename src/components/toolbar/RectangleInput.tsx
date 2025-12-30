import { useToolStore } from '../../store/useToolStore';

export function RectangleInput() {
    const { activeTool, toolSettings, setToolSettings } = useToolStore();

    if (activeTool !== 'rectangle') return null;

    return (
        <div className="absolute top-4 left-64 bg-white p-4 rounded-xl shadow-xl border border-slate-200 z-50 animate-in fade-in zoom-in-95 w-64">
            <h3 className="text-sm font-semibold mb-3">Cover Settings</h3>

            <div className="space-y-4 mb-4">
                <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">Fill Color</label>
                    <div className="flex gap-2">
                        {['#FFFFFF', '#000000', '#F3F4F6'].map((c) => (
                            <button
                                key={c}
                                onClick={() => setToolSettings({ color: c })}
                                className={`w-8 h-8 rounded-md border-2 transition-all ${toolSettings.color === c
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

            <p className="text-[10px] text-slate-400 mt-2 text-center">
                Click and drag on canvas to cover
            </p>
        </div>
    );
}
