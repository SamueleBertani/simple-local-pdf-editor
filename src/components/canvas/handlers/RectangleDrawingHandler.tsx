import { useEffect, useRef } from 'react';
import { Rect, Canvas } from 'fabric';

interface RectangleDrawingHandlerProps {
    fabricCanvas: Canvas | null;
    activeTool: string;
    toolSettings: any;
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

        const handleMouseDown = (opt: any) => {
            if (activeTool !== 'rectangle') return;

            const pointer = fabricCanvas.getPointer(opt.e);

            // Allow selection of existing objects (ignore if clicking ghost)
            // But if we are in rectangle tool and simply clicked text, we might want to start drawing?
            // The original logic checked opt.target first globally. 
            // We should assume the parent handles the "select existing" check OR we do it here.
            // Original logic:
            // if (opt.target && !opt.target.data?.isGhost) { setIsDraggingCanvas(true); return; }
            // This handler specifically handles DRAWING. So if we clicked an object, we probably shouldn't draw.
            // However, the parent `CanvasOverlay` manages the global mouse down. 
            // Ideally this handler is ONLY for when we ARE drawing.

            // Let's rely on the fact that if we are in 'rectangle' mode, we might want to draw ON TOP of things?
            // Or usually if we click a shape in rect mode, do we select it?
            // "ActiveTool === rectangle" usually implies drawing mode.

            // Original logic was:
            /*
           if (opt.target && !opt.target.data?.isGhost) {
                setIsDraggingCanvas(true);
                return;
            }
            if (activeTool === 'rectangle') { ... }
            */
            // So if we clicked a target, we returned EARLY in the parent.
            // WE must respect that. If `opt.target` is present, we should probably NOT draw.

            if (opt.target && !opt.target.data?.isGhost) return;

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

        const handleMouseMove = (opt: any) => {
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
                    activeShape.current.set({ selectable: true, evented: true });
                    activeShape.current.setCoords();
                    fabricCanvas.setActiveObject(activeShape.current);
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
