import { useEffect } from 'react';
import { usePDFStore } from '../store/usePDFStore';

export function useShortcuts() {
    const { canvases } = usePDFStore();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Iterate over all canvases
            // If canvas has active object, apply shortcut
            // Note: Only one object should be active across all canvases ideally, or we apply to any active.

            const isDelete = e.key === 'Delete' || e.key === 'Backspace';
            const isEscape = e.key === 'Escape';
            const step = e.shiftKey ? 10 : 1;

            if (Object.keys(canvases).length === 0) return;

            Object.values(canvases).forEach((canvas) => {
                if (!canvas) return; // Guard

                const activeObject = canvas.getActiveObject();
                if (!activeObject) return;

                if (isDelete) {
                    canvas.remove(activeObject);
                    canvas.discardActiveObject();
                    canvas.requestRenderAll();
                }

                if (isEscape) {
                    canvas.discardActiveObject();
                    canvas.requestRenderAll();
                }

                if (e.key === 'ArrowLeft') {
                    activeObject.set('left', activeObject.left! - step);
                    activeObject.setCoords();
                    canvas.requestRenderAll();
                    e.preventDefault();
                }
                if (e.key === 'ArrowRight') {
                    activeObject.set('left', activeObject.left! + step);
                    activeObject.setCoords();
                    canvas.requestRenderAll();
                    e.preventDefault();
                }
                if (e.key === 'ArrowUp') {
                    activeObject.set('top', activeObject.top! - step);
                    activeObject.setCoords();
                    canvas.requestRenderAll();
                    e.preventDefault();
                }
                if (e.key === 'ArrowDown') {
                    activeObject.set('top', activeObject.top! + step);
                    activeObject.setCoords();
                    canvas.requestRenderAll();
                    e.preventDefault();
                }
            });
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [canvases]);
}
