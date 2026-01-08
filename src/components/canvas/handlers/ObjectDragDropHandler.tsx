import { useEffect } from 'react';
import { Canvas } from 'fabric';
import { usePDFStore } from '../../../store/usePDFStore';
import { generateId } from '../../../utils/generateId';

interface ObjectDragDropHandlerProps {
    fabricCanvas: Canvas | null;
    pageIndex: number;
}

export const ObjectDragDropHandler = ({
    fabricCanvas,
    pageIndex
}: ObjectDragDropHandlerProps) => {

    useEffect(() => {
        if (!fabricCanvas) return;

        const handleMouseUp = (opt: any) => {
            // Check for Object Drop on another Page
            const activeObj = fabricCanvas.getActiveObject();
            if (activeObj && opt.e) {
                const allCanvases = usePDFStore.getState().canvases;

                Object.entries(allCanvases).forEach(([pIndex, targetCanvas]: [string, any]) => {
                    const targetPageIndex = parseInt(pIndex);
                    if (targetPageIndex === pageIndex) return;

                    const targetCanvasEl = targetCanvas.getElement();
                    // Fabric exposes getElement() but for typing safety we might need to check if it exists
                    if (!targetCanvasEl) return;

                    const rect = targetCanvasEl.getBoundingClientRect();
                    const clientX = opt.e.clientX;
                    const clientY = opt.e.clientY;

                    if (
                        clientX >= rect.left &&
                        clientX <= rect.right &&
                        clientY >= rect.top &&
                        clientY <= rect.bottom
                    ) {
                        // MATCH! Transfer object.
                        activeObj.clone().then((cloned: any) => {
                            const pointer = targetCanvas.getPointer(opt.e);

                            cloned.set({
                                left: pointer.x,
                                top: pointer.y,
                                originX: activeObj.originX,
                                originY: activeObj.originY
                            });

                            if (cloned.id) {
                                cloned.set('id', generateId());
                            }

                            targetCanvas.add(cloned);
                            targetCanvas.setActiveObject(cloned);
                            targetCanvas.requestRenderAll();

                            fabricCanvas.remove(activeObj);
                            fabricCanvas.discardActiveObject();
                            fabricCanvas.requestRenderAll();
                        });
                    }
                });
            }
        };

        fabricCanvas.on('mouse:up', handleMouseUp);

        return () => {
            fabricCanvas.off('mouse:up', handleMouseUp);
        };
    }, [fabricCanvas, pageIndex]);

    return null;
};
