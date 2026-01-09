import { useEffect, useRef } from 'react';
import { Rect, Canvas, type TPointerEventInfo, type TPointerEvent } from 'fabric';
import type { ToolSettings, CustomFabricObject } from '../../../types';

interface RectangleDrawingHandlerProps {
    fabricCanvas: Canvas | null;
    activeTool: string;
    toolSettings: ToolSettings;
    setIsDraggingCanvas: (isDragging: boolean) => void;
}

export const RectangleDrawingHandler = ({
    fabricCanvas,
    activeTool,
    toolSettings,
    setIsDraggingCanvas
}: RectangleDrawingHandlerProps) => {
    const isDragging = useRef(false);
    const startPos = useRef({ x: 0, y: 0 });
    const activeShape = useRef<Rect | null>(null);

    useEffect(() => {
        if (!fabricCanvas) return;

        const handleMouseDown = (opt: TPointerEventInfo<TPointerEvent>) => {
            if (activeTool !== 'rectangle') return;
            const target = opt.target as CustomFabricObject | undefined;
            if (target && !target.data?.isGhost) return;

            const pointer = fabricCanvas.getPointer(opt.e);

            isDragging.current = true;
            startPos.current = { x: pointer.x, y: pointer.y };
            const rect = new Rect({
                left: pointer.x, top: pointer.y,
                width: 0, height: 0,
                fill: toolSettings.color,
                selectable: false, evented: false,
                originX: 'left', originY: 'top'
            });
            activeShape.current = rect;
            fabricCanvas.add(rect);
            setIsDraggingCanvas(true);
        };

        const handleMouseMove = (opt: TPointerEventInfo<TPointerEvent>) => {
            if (activeTool !== 'rectangle') return;
            if (!isDragging.current || !activeShape.current) return;

            const pointer = fabricCanvas.getPointer(opt.e);
            const rect = activeShape.current;
            const startX = startPos.current.x;
            const startY = startPos.current.y;
            const width = Math.abs(pointer.x - startX);
            const height = Math.abs(pointer.y - startY);

            rect.set({ width, height });
            if (pointer.x < startX) rect.set({ left: pointer.x });
            if (pointer.y < startY) rect.set({ top: pointer.y });

            fabricCanvas.requestRenderAll();
        };

        const handleMouseUp = () => {
            if (activeTool !== 'rectangle') return;

            if (isDragging.current) {
                isDragging.current = false;
                if (activeShape.current) {
                    const rect = activeShape.current;
                    const width = rect.width ?? 0;
                    const height = rect.height ?? 0;

                    // Remove if too small (accidental click)
                    if (width < 5 && height < 5) {
                        fabricCanvas.remove(rect);
                    } else {
                        rect.set({ selectable: true, evented: true });
                        rect.setCoords();
                        fabricCanvas.setActiveObject(rect);
                    }
                    activeShape.current = null;
                }
                setIsDraggingCanvas(false);
            }
        };

        fabricCanvas.on('mouse:down', handleMouseDown);
        fabricCanvas.on('mouse:move', handleMouseMove);
        fabricCanvas.on('mouse:up', handleMouseUp);

        return () => {
            fabricCanvas.off('mouse:down', handleMouseDown);
            fabricCanvas.off('mouse:move', handleMouseMove);
            fabricCanvas.off('mouse:up', handleMouseUp);
        };
    }, [fabricCanvas, activeTool, toolSettings, setIsDraggingCanvas]);

    return null;
};
