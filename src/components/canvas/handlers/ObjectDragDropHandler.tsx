import { useEffect } from 'react';
import { Canvas, type TPointerEventInfo, type TPointerEvent, type FabricObject } from 'fabric';
import { usePDFStore } from '../../../store/usePDFStore';
import { generateId } from '../../../utils/generateId';
import type { CustomFabricObject } from '../../../types';

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

        const handleMouseUp = (opt: TPointerEventInfo<TPointerEvent>) => {
            // Check for Object Drop on another Page
            const activeObj = fabricCanvas.getActiveObject() as CustomFabricObject | undefined;
            if (activeObj && opt.e) {
                const allCanvases = usePDFStore.getState().canvases;

                Object.entries(allCanvases).forEach(([pIndex, targetCanvas]) => {
                    const targetPageIndex = parseInt(pIndex);
                    if (targetPageIndex === pageIndex) return;

                    const targetCanvasEl = targetCanvas.getElement();
                    if (!targetCanvasEl) return;

                    const rect = targetCanvasEl.getBoundingClientRect();
                    const clientX = (opt.e as MouseEvent).clientX;
                    const clientY = (opt.e as MouseEvent).clientY;

                    if (
                        clientX >= rect.left &&
                        clientX <= rect.right &&
                        clientY >= rect.top &&
                        clientY <= rect.bottom
                    ) {
                        // MATCH! Transfer object.
                        activeObj.clone().then((cloned: FabricObject) => {
                            const clonedObj = cloned as CustomFabricObject;
                            const pointer = targetCanvas.getPointer(opt.e);

                            clonedObj.set({
                                left: pointer.x,
                                top: pointer.y,
                                originX: activeObj.originX,
                                originY: activeObj.originY
                            });

                            if (clonedObj.id) {
                                clonedObj.set('id', generateId());
                            }

                            targetCanvas.add(clonedObj);
                            targetCanvas.setActiveObject(clonedObj);
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
