import { Minus, Plus, RotateCcw } from 'lucide-react';
import { usePDFStore } from '../../store/usePDFStore';

export function ZoomControls() {
    const { scale, setScale } = usePDFStore();

    const handleZoomIn = () => {
        setScale(Math.min(3, scale + 0.25));
    };

    const handleZoomOut = () => {
        setScale(Math.max(0.5, scale - 0.25));
    };

    const handleReset = () => {
        setScale(1);
    };

    return (
        <div className="fixed bottom-6 right-6 flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 rounded-lg shadow-xl z-50">
            <button
                onClick={handleZoomOut}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-slate-600 dark:text-slate-400 transition-colors"
                title="Zoom Out (Ctrl -)"
            >
                <Minus className="w-4 h-4" />
            </button>

            <span className="text-xs font-medium w-12 text-center text-slate-700 dark:text-slate-300 select-none tabular-nums">
                {Math.round(scale * 100)}%
            </span>

            <button
                onClick={handleZoomIn}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-slate-600 dark:text-slate-400 transition-colors"
                title="Zoom In (Ctrl +)"
            >
                <Plus className="w-4 h-4" />
            </button>

            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />

            <button
                onClick={handleReset}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-slate-600 dark:text-slate-400 transition-colors"
                title="Reset Zoom"
            >
                <RotateCcw className="w-4 h-4" />
            </button>
        </div>
    );
}
