import { useEffect } from 'react';
import { usePDFStore } from '../../store/usePDFStore';
import { useToolStore } from '../../store/useToolStore';

export function useObjectManipulationShortcuts() {
    const { canvases } = usePDFStore();
    const { setActiveTool, setPendingImage } = useToolStore();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            // Escape: Deselect / Reset Tool
            const isEscape = e.key === 'Escape';
            if (isEscape) {
                setActiveTool('select');
                setPendingImage(null);
            }

            if (Object.keys(canvases).length === 0) return;

            Object.values(canvases).forEach((canvas) => {
                if (!canvas) return;

                const activeObject = canvas.getActiveObject();

                // Escape: Deselect on canvas
                if (isEscape) {
                    canvas.discardActiveObject();
                    canvas.requestRenderAll();
                }

                if (!activeObject) return;

                // Delete / Backspace
                const isDelete = e.key === 'Delete' || e.key === 'Backspace';
                if (isDelete) {
                    const activeObjects = canvas.getActiveObjects();
                    if (activeObjects.length) {
                        activeObjects.forEach((obj: any) => {
                            canvas.remove(obj);
                        });
                        canvas.discardActiveObject();
                        canvas.requestRenderAll();
                    }
                }

                // Arrow Keys Nudge
                const step = e.shiftKey ? 10 : 1;
                if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
                    e.preventDefault();
                    if (e.key === 'ArrowLeft') activeObject.set('left', activeObject.left! - step);
                    if (e.key === 'ArrowRight') activeObject.set('left', activeObject.left! + step);
                    if (e.key === 'ArrowUp') activeObject.set('top', activeObject.top! - step);
                    if (e.key === 'ArrowDown') activeObject.set('top', activeObject.top! + step);
                    activeObject.setCoords();
                    canvas.requestRenderAll();
                }
            });
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [canvases, setActiveTool, setPendingImage]);
}
