import { useEffect } from 'react';
import * as fabric from 'fabric';
import { usePDFStore } from '../store/usePDFStore';
import { useHistoryStore } from '../store/useHistoryStore';
import { useClipboardStore } from '../store/useClipboardStore';

export function useShortcuts() {
    const { canvases } = usePDFStore();
    const { undo, redo } = useHistoryStore();
    const { clipboard, setClipboard, lastActivePageIndex } = useClipboardStore();

    useEffect(() => {
        const handleKeyDown = async (e: KeyboardEvent) => {
            // Guard against input fields
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            // Copy: Cmd+C or Ctrl+C
            if ((e.metaKey || e.ctrlKey) && e.key === 'c') {
                e.preventDefault();

                // Find the active object across all canvases
                // We'll iterate and break on first found (assuming single selection mostly)
                for (const canvas of Object.values(canvases)) {
                    const activeObject = canvas.getActiveObject();
                    if (activeObject) {
                        const cloned = activeObject.toObject(['id', 'left', 'top', 'width', 'height', 'scaleX', 'scaleY', 'fill', 'stroke', 'text', 'angle', 'fontFamily', 'fontSize']);
                        setClipboard(cloned);
                        break;
                    }
                }
                return;
            }

            // Paste: Cmd+V or Ctrl+V
            if ((e.metaKey || e.ctrlKey) && e.key === 'v') {
                e.preventDefault();

                if (!clipboard) return;

                // Determine target canvas
                let targetPageIndex = lastActivePageIndex;

                // Fallback: use first available if none active
                if (typeof targetPageIndex !== 'number' || !canvases[targetPageIndex]) {
                    const keys = Object.keys(canvases).map(Number);
                    if (keys.length > 0) targetPageIndex = keys[0];
                }

                if (typeof targetPageIndex === 'number' && canvases[targetPageIndex]) {
                    const canvas = canvases[targetPageIndex];

                    const objects = await fabric.util.enlivenObjects([clipboard], {});
                    objects.forEach((obj: any) => {
                        // Clone logic: offset slightly
                        obj.set({
                            left: obj.left + 20,
                            top: obj.top + 20,
                            evented: true,
                        });

                        // Generate new ID if we are using IDs
                        if (obj.id || clipboard.id) {
                            obj.set('id', Math.random().toString(36).substr(2, 9));
                        }

                        canvas.add(obj);
                        canvas.setActiveObject(obj);
                        canvas.requestRenderAll();
                    });
                }
                return;
            }

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
    }, [canvases, undo, redo, clipboard, setClipboard, lastActivePageIndex]);
}
