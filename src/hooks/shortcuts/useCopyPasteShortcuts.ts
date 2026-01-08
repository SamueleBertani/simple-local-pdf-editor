import { useEffect } from 'react';
import * as fabric from 'fabric';
import { usePDFStore } from '../../store/usePDFStore';
import { useClipboardStore } from '../../store/useClipboardStore';
import { generateId } from '../../utils/generateId';

export function useCopyPasteShortcuts() {
    const { canvases } = usePDFStore();
    const { clipboard, setClipboard, lastActivePageIndex } = useClipboardStore();

    useEffect(() => {
        const handleKeyDown = async (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            const isCmdOrCtrl = e.metaKey || e.ctrlKey;

            // Copy: Cmd+C
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

            // Paste: Cmd+V
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
                        if (obj.set) {
                            obj.set('id', generateId());
                        }

                        canvas.add(obj);
                        canvas.setActiveObject(obj);
                        canvas.requestRenderAll();
                    });
                }
                return;
            }

            // Duplicate: Cmd+D
            if (isCmdOrCtrl && e.key === 'd') {
                e.preventDefault();
                // Find active object
                for (const canvas of Object.values(canvases)) {
                    const activeObject = canvas.getActiveObject();
                    if (activeObject) {
                        activeObject.clone()
                            .then((cloned: any) => {
                                cloned.set({
                                    left: activeObject.left! + 20,
                                    top: activeObject.top! + 20,
                                    evented: true,
                                    id: generateId(),
                                });

                                canvas.add(cloned);
                                canvas.setActiveObject(cloned);
                                canvas.requestRenderAll();
                            })
                            .catch((err: Error) => {
                                console.error('Failed to duplicate object:', err);
                            });
                        break;
                    }
                }
                return;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [canvases, clipboard, setClipboard, lastActivePageIndex]);
}
