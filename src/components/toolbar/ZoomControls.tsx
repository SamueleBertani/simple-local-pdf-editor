import { Minus, Plus, RotateCcw } from 'lucide-react';
import { usePDFStore } from '../../store/usePDFStore';
import { MIN_SCALE, MAX_SCALE, SCALE_STEP, DEFAULT_SCALE } from '../../constants/zoom';
import { Z_INDEX } from '../../constants/zIndex';

/**
 * Floating zoom controls panel positioned at bottom-right of the viewport.
 * Provides zoom in/out buttons, percentage display, and reset functionality.
 */
export function ZoomControls() {
    const { scale, setScale } = usePDFStore();

    const handleZoomIn = () => {
        setScale(Math.min(MAX_SCALE, scale + SCALE_STEP));
    };

    const handleZoomOut = () => {
        setScale(Math.max(MIN_SCALE, scale - SCALE_STEP));
    };

    const handleReset = () => {
        setScale(DEFAULT_SCALE);
    };

    return (
        <div
            className="fixed bottom-24 right-4 md:bottom-8 md:right-8 flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 rounded-lg shadow-xl"
            style={{ zIndex: Z_INDEX.UI.FLOATING_CONTROLS }}
        >
            <button
                onClick={handleZoomOut}
                aria-label="Zoom out"
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-slate-600 dark:text-slate-400 transition-colors"
                title="Zoom Out"
            >
                <Minus className="w-4 h-4" />
            </button>

            <span className="text-xs font-medium w-12 text-center text-slate-700 dark:text-slate-300 select-none tabular-nums">
                {Math.round(scale * 100)}%
            </span>

            <button
                onClick={handleZoomIn}
                aria-label="Zoom in"
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-slate-600 dark:text-slate-400 transition-colors"
                title="Zoom In"
            >
                <Plus className="w-4 h-4" />
            </button>

            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />

            <button
                onClick={handleReset}
                aria-label="Reset zoom to 100%"
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-slate-600 dark:text-slate-400 transition-colors"
                title="Reset Zoom"
            >
                <RotateCcw className="w-4 h-4" />
            </button>
        </div>
    );
}
