import { useToolStore } from '../../store/useToolStore';
import { STAMPS } from '../../constants/stamps';

export function StampInput() {
    const { activeTool, setPendingImage, pendingImage } = useToolStore();

    if (activeTool !== 'stamp') return null;

    return (
        <div className="w-full flex flex-col gap-6">
            <h3 className="text-sm font-semibold mb-3 sr-only">Stamp Selection</h3>

            <div className="grid grid-cols-2 gap-3">
                {STAMPS.map((stamp) => (
                    <button
                        key={stamp.id}
                        onClick={() => setPendingImage(stamp.url)}
                        className={`group relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${pendingImage === stamp.url
                                ? 'border-indigo-600 bg-indigo-50 shadow-sm'
                                : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                            }`}
                    >
                        <div className="w-full aspect-square flex items-center justify-center bg-white rounded-lg p-2 border border-slate-100">
                            <img
                                src={stamp.url}
                                alt={stamp.label}
                                className="max-w-full max-h-full object-contain opacity-90 group-hover:opacity-100 transition-opacity"
                            />
                        </div>
                        <span className={`text-xs font-medium text-center ${pendingImage === stamp.url ? 'text-indigo-700' : 'text-slate-600'
                            }`}>
                            {stamp.label}
                        </span>

                        {pendingImage === stamp.url && (
                            <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-indigo-600 animate-in zoom-in" />
                        )}
                    </button>
                ))}
            </div>

            <p className="text-xs text-slate-400 text-center mt-4">
                Select a stamp and click on the canvas to place it
            </p>
        </div>
    );
}
