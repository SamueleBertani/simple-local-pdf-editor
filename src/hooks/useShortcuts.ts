import { useEffect } from 'react';
import * as fabric from 'fabric';
import { usePDFStore } from '../store/usePDFStore';
import { useHistoryStore } from '../store/useHistoryStore';
import { useClipboardStore } from '../store/useClipboardStore';
import { useToolStore } from '../store/useToolStore';

export function useShortcuts() {
    const { canvases } = usePDFStore();
    const { undo, redo } = useHistoryStore();
    const { clipboard, setClipboard, lastActivePageIndex } = useClipboardStore();
    const { setActiveTool, setPendingImage } = useToolStore();

    useEffect(() => {
        const handleKeyDown = async (e: KeyboardEvent) => {
            // ----------------------------------------------------------------
            // 1. Guard against input fields
            // ----------------------------------------------------------------
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            const isCmdOrCtrl = e.metaKey || e.ctrlKey;

            // ----------------------------------------------------------------
            // 2. Global Undo/Redo
            // ----------------------------------------------------------------
            if (isCmdOrCtrl && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                undo();
                return;
            }
            if ((isCmdOrCtrl && e.key === 'z' && e.shiftKey) || (isCmdOrCtrl && e.key === 'y')) {
                e.preventDefault();
                redo();
                return;
            }

            // ----------------------------------------------------------------
            // 3. Copy / Paste
            // ----------------------------------------------------------------
            if (isCmdOrCtrl && e.key === 'c') {
                e.preventDefault();
                // Find and copy active object
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

            if (isCmdOrCtrl && e.key === 'v') {
                e.preventDefault();
                if (!clipboard) return;

                // Determine target page
                let targetPageIndex = lastActivePageIndex;
                if (typeof targetPageIndex !== 'number' || !canvases[targetPageIndex]) {
                    const keys = Object.keys(canvases).map(Number);
                    if (keys.length > 0) targetPageIndex = keys[0];
                }

                if (typeof targetPageIndex === 'number' && canvases[targetPageIndex]) {
                    const canvas = canvases[targetPageIndex];
                    const objects = await fabric.util.enlivenObjects([clipboard], {});

                    objects.forEach((obj: any) => {
                        obj.set({
                            left: obj.left + 20,
                            top: obj.top + 20,
                            evented: true,
                        });

                        // New ID for pasted object
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

            // ----------------------------------------------------------------
            // 4. Tool Management (Escape)
            // ----------------------------------------------------------------
            const isEscape = e.key === 'Escape';
            if (isEscape) {
                setActiveTool('select');
                setPendingImage(null);
            }

            // ----------------------------------------------------------------
            // 5. Canvas-Specific Actions (Delete, Move)
            // ----------------------------------------------------------------
            if (Object.keys(canvases).length === 0) return;

            Object.values(canvases).forEach((canvas) => {
                if (!canvas) return;

                const activeObject = canvas.getActiveObject();

                // Escape deselects
                if (isEscape) {
                    canvas.discardActiveObject();
                    canvas.requestRenderAll();
                }

                if (!activeObject) return;

                // Delete
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

                // Nudge (Arrow Keys)
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
    }, [canvases, undo, redo, clipboard, setClipboard, lastActivePageIndex, setActiveTool, setPendingImage]);
}
