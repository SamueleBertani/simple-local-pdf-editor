import { useEffect, useRef } from 'react';
import { FabricImage, Rect, IText } from 'fabric';
import { useFabric } from '../../hooks/useFabric';
import { useToolStore } from '../../store/useToolStore';
import { usePDFStore } from '../../store/usePDFStore';
import { useCanvasHistory } from '../../hooks/useCanvasHistory';
import { useClipboardStore } from '../../store/useClipboardStore';
import { useGhostObject } from '../../hooks/useGhostObject';

interface CanvasOverlayProps {
    width: number;
    height: number;
    scale: number;
    pageIndex: number;
}

export function CanvasOverlay({ width, height, scale, pageIndex }: CanvasOverlayProps) {
    const { canvasRef, fabricCanvas } = useFabric({ width, height, scale });
    const { activeTool, pendingImage, setActiveTool, toolSettings } = useToolStore();
    const { registerCanvas, unregisterCanvas } = usePDFStore();
    const { setLastActivePageIndex } = useClipboardStore();

    // Refs for drag state
    const isDragging = useRef(false);
    const startPos = useRef({ x: 0, y: 0 });
    const activeShape = useRef<any>(null);

    useCanvasHistory(fabricCanvas, pageIndex);

    useGhostObject({ fabricCanvas, activeTool, toolSettings, pendingImage });

    useEffect(() => {
        if (fabricCanvas) {
            registerCanvas(pageIndex, fabricCanvas);

            // Track active page for paste operations
            const handleInteraction = () => {
                setLastActivePageIndex(pageIndex);
            };

            fabricCanvas.on('mouse:down', handleInteraction);
            fabricCanvas.on('mouse:over', handleInteraction);

            return () => {
                unregisterCanvas(pageIndex);
                fabricCanvas.off('mouse:down', handleInteraction);
                fabricCanvas.off('mouse:over', handleInteraction);
            };
        }
    }, [fabricCanvas, pageIndex, registerCanvas, unregisterCanvas, setLastActivePageIndex]);

    // Manage Interactions
    useEffect(() => {
        if (!fabricCanvas) return;

        // 1. Configure Drawing Mode
        fabricCanvas.isDrawingMode = false;

        // 2. Interaction Handlers
        const handleMouseDown = (opt: any) => {
            const pointer = fabricCanvas.getPointer(opt.e);

            // Allow selection of existing objects (ignore if clicking ghost)
            if (opt.target && !opt.target.data?.isGhost) return;

            if (activeTool === 'rectangle') {
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
            } else if (activeTool === 'text') {
                const text = new IText('Type here', {
                    left: pointer.x, top: pointer.y,
                    fontFamily: toolSettings.fontFamily,
                    fontSize: toolSettings.fontSize,
                    fill: toolSettings.color
                });
                fabricCanvas.add(text);
                fabricCanvas.setActiveObject(text);
                text.enterEditing();
                text.selectAll();
            } else if ((activeTool === 'image' || activeTool === 'stamp' || activeTool === 'handwriting') && pendingImage) {
                FabricImage.fromURL(pendingImage).then((img) => {
                    img.set({
                        left: pointer.x, top: pointer.y,
                        originX: 'center', originY: 'center',
                        scaleX: 0.5, scaleY: 0.5
                    });
                    fabricCanvas.add(img);
                    fabricCanvas.setActiveObject(img);
                }).catch(console.error);
            }
        };

        const handleMouseMove = (opt: any) => {
            const pointer = fabricCanvas.getPointer(opt.e);

            // Move Drag Shape (Rectangle)
            if (isDragging.current && activeShape.current && activeTool === 'rectangle') {
                const rect = activeShape.current;
                const startX = startPos.current.x;
                const startY = startPos.current.y;
                const width = Math.abs(pointer.x - startX);
                const height = Math.abs(pointer.y - startY);
                rect.set({ width, height });
                if (pointer.x < startX) rect.set({ left: pointer.x });
                if (pointer.y < startY) rect.set({ top: pointer.y });
                fabricCanvas.requestRenderAll();
            }
        };

        const handleMouseUp = () => {
            if (isDragging.current) {
                isDragging.current = false;
                if (activeShape.current) {
                    activeShape.current.set({ selectable: true, evented: true });
                    activeShape.current.setCoords();
                    fabricCanvas.setActiveObject(activeShape.current);
                    activeShape.current = null;
                }
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
    }, [fabricCanvas, activeTool, toolSettings, pendingImage, setActiveTool]);

    return (
        <div className="absolute inset-0 z-10 pointer-events-auto">
            <canvas ref={canvasRef} />
        </div>
    );
}
