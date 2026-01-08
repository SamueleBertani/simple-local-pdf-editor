import { useEffect } from 'react';
import type { FabricObject } from 'fabric';
import { usePDFStore } from '../../store/usePDFStore';
import { useToolStore } from '../../store/useToolStore';
import { isInputFocused } from '../../utils/keyboard';

export function useObjectManipulationShortcuts() {
    const { canvases } = usePDFStore();
    const { setActiveTool, setPendingImage } = useToolStore();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isInputFocused(e)) return;

            const isEscape = e.key === 'Escape';
            if (isEscape) {
                setActiveTool('select');
                setPendingImage(null);
                Object.values(canvases).forEach((canvas) => {
                    canvas?.discardActiveObject();
                    canvas?.requestRenderAll();
                });
                return;
            }

            if (Object.keys(canvases).length === 0) return;

            Object.values(canvases).forEach((canvas) => {
                if (!canvas) return;

                const activeObject = canvas.getActiveObject();
                if (!activeObject) return;

                // Delete / Backspace
                if (e.key === 'Delete' || e.key === 'Backspace') {
                    const activeObjects = canvas.getActiveObjects();
                    activeObjects.forEach((obj: FabricObject) => canvas.remove(obj));
                    canvas.discardActiveObject();
                    canvas.requestRenderAll();
                    return;
                }

                // Arrow Keys Nudge
                if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
                    e.preventDefault();
                    const step = e.shiftKey ? 10 : 1;
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
