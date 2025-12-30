import { useToolStore } from '../../store/useToolStore';

export function RectangleInput() {
    const { activeTool, toolSettings, setToolSettings } = useToolStore();

    if (activeTool !== 'rectangle') return null;

    return (
        <div className="w-full flex flex-col gap-6">
            <div className="space-y-6">
                <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">Fill Color</label>
                    <div className="flex gap-3">
                        {['#FFFFFF', '#000000', '#F3F4F6'].map((c) => (
                            <button
                                key={c}
                                onClick={() => setToolSettings({ color: c })}
                                className={`w-10 h-10 rounded-md border-2 transition-all shadow-sm ${toolSettings.color === c
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

            <p className="text-xs text-slate-400 text-center mt-4">
                Click and drag on canvas to cover
            </p>
        </div>
    );
}
