import { useEffect } from 'react';
import * as fabric from 'fabric';
import type { FabricObject } from 'fabric';
import { usePDFStore } from '../../store/usePDFStore';
import { useClipboardStore } from '../../store/useClipboardStore';
import { generateId } from '../../utils/generateId';
import { isInputFocused } from '../../utils/keyboard';
import type { CustomFabricObject } from '../../types';

export function useCopyPasteShortcuts() {
    const { canvases } = usePDFStore();
    const {
        clipboard,
        setClipboard,
        lastActivePageIndex,
        duplicateOffset,
        setDuplicationContext,
    } = useClipboardStore();

    useEffect(() => {
        const handleKeyDown = async (e: KeyboardEvent) => {
            if (isInputFocused(e)) return;

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

                    for (const obj of objects) {
                        if ('set' in obj && typeof obj.set === 'function') {
                            const fabricObj = obj as FabricObject;
                            fabricObj.set({
                                left: (fabricObj.left ?? 0) + 20,
                                top: (fabricObj.top ?? 0) + 20,
                                evented: true,
                                id: generateId(),
                            });
                            canvas.add(fabricObj);
                            canvas.setActiveObject(fabricObj);
                            canvas.requestRenderAll();
                        }
                    }
                }
                return;
            }

            // Duplicate: Cmd+D (Figma-style with dynamic offset)
            if (isCmdOrCtrl && e.key === 'd') {
                e.preventDefault();
                for (const canvas of Object.values(canvases)) {
                    const activeObject = canvas.getActiveObject() as CustomFabricObject;
                    if (activeObject) {
                        const sourceLeft = activeObject.left ?? 0;
                        const sourceTop = activeObject.top ?? 0;

                        activeObject.clone().then((cloned: FabricObject) => {
                            const newId = generateId();
                            cloned.set({
                                left: sourceLeft + duplicateOffset.x,
                                top: sourceTop + duplicateOffset.y,
                                evented: true,
                                id: newId,
                            });
                            canvas.add(cloned);
                            canvas.setActiveObject(cloned);
                            canvas.requestRenderAll();

                            // Update duplication context for tracking movement
                            setDuplicationContext({
                                sourceObjectId: activeObject.id ?? '',
                                sourcePosition: { left: sourceLeft, top: sourceTop },
                                duplicatedObjectId: newId,
                            });
                        });
                        break;
                    }
                }
                return;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [canvases, clipboard, setClipboard, lastActivePageIndex, duplicateOffset, setDuplicationContext]);
}
