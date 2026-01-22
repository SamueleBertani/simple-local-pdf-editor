import { useToolStore } from '../../store/useToolStore';
import { STAMPS } from '../../constants/stamps';
import { cn } from '../../utils/cn';

export function StampInput() {
    const { setPendingImage, pendingImage } = useToolStore();

    return (
        <div className="w-full flex flex-col gap-6">
            <h3 className="text-sm font-semibold mb-3 sr-only">Stamp Selection</h3>

            <div className="grid grid-cols-2 gap-3">
                {STAMPS.map((stamp) => {
                    const isSelected = pendingImage === stamp.url;
                    return (
                        <button
                            key={stamp.id}
                            onClick={() => setPendingImage(stamp.url)}
                            className={cn(
                                "group relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all",
                                isSelected
                                    ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 shadow-sm"
                                    : "border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                            )}
                        >
                            <div className="w-full aspect-square flex items-center justify-center bg-white dark:bg-slate-800 rounded-lg p-2 border border-slate-100 dark:border-slate-700">
                                <img
                                    src={stamp.url}
                                    alt={stamp.label}
                                    className="max-w-full max-h-full object-contain opacity-90 group-hover:opacity-100 transition-opacity"
                                />
                            </div>
                            <span className={cn(
                                "text-xs font-medium text-center",
                                isSelected
                                    ? "text-indigo-700 dark:text-indigo-300"
                                    : "text-slate-600 dark:text-slate-400"
                            )}>
                                {stamp.label}
                            </span>

                            {isSelected && (
                                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-indigo-600 animate-in zoom-in" />
                            )}
                        </button>
                    );
                })}
            </div>

            <p className="text-xs text-slate-400 text-center mt-4">
                Select a stamp and click on the canvas to place it
            </p>
        </div>
    );
}
