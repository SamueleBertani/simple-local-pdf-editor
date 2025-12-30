import { useEffect } from 'react';
import { usePDFStore } from '../store/usePDFStore';
import { useHistoryStore } from '../store/useHistoryStore';

export function useShortcuts() {
    const { canvases } = usePDFStore();
    const { undo, redo } = useHistoryStore();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Undo: Cmd+Z or Ctrl+Z
            if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                undo();
                return;
            }

            // Redo: Cmd+Shift+Z or Ctrl+Y
            if (((e.metaKey || e.ctrlKey) && e.key === 'z' && e.shiftKey) ||
                ((e.metaKey || e.ctrlKey) && e.key === 'y')) {
                e.preventDefault();
                redo();
                return;
            }

            // ... exiting shortcut logic
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
                    // canvas.discardActiveObject(); // Kept commented out as remove usually clears, but check if needed
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
    }, [canvases, undo, redo]);
}
