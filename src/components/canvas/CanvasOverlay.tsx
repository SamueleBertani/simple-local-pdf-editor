import { useEffect, useRef } from 'react';
import { FabricImage, Rect, IText } from 'fabric';
import { useFabric } from '../../hooks/useFabric';
import { useToolStore } from '../../store/useToolStore';
import { usePDFStore } from '../../store/usePDFStore';
import { useCanvasHistory } from '../../hooks/useCanvasHistory';
import { useClipboardStore } from '../../store/useClipboardStore';

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

    useEffect(() => {
        if (!fabricCanvas) return;

        // 1. Configure Drawing Mode (Disabled for all currently, using custom implementations)
        fabricCanvas.isDrawingMode = false;

        // 2. Interaction Handlers
        const handleMouseDown = (opt: any) => {
            const pointer = fabricCanvas.getPointer(opt.e);

            // Allow selection of existing objects logic (sticky tools)
            if (opt.target) return;

            // A. Rectangle: Start Drag
            if (activeTool === 'rectangle') {
                isDragging.current = true;
                startPos.current = { x: pointer.x, y: pointer.y };

                const rect = new Rect({
                    left: pointer.x,
                    top: pointer.y,
                    originX: 'left',
                    originY: 'top',
                    width: 0,
                    height: 0,
                    fill: toolSettings.color,
                    selectable: false, // Not selectable while drawing
                    evented: false,
                });

                activeShape.current = rect;
                fabricCanvas.add(rect);
            }
            // B. Text: Click to Place
            else if (activeTool === 'text') {
                const text = new IText('Type here', {
                    left: pointer.x,
                    top: pointer.y,
                    fontFamily: toolSettings.fontFamily,
                    fontSize: toolSettings.fontSize,
                    fill: toolSettings.color,
                });

                fabricCanvas.add(text);
                fabricCanvas.setActiveObject(text);
                text.enterEditing();
                text.selectAll();
                // Sticky tool: Do not reset to 'select'
            }
            // C. Image/Stamp/Handwriting (Click to Place)
            else if ((activeTool === 'image' || activeTool === 'stamp' || activeTool === 'handwriting') && pendingImage) {
                FabricImage.fromURL(pendingImage).then((img) => {
                    img.set({
                        left: pointer.x,
                        top: pointer.y,
                        originX: 'center',
                        originY: 'center',
                        scaleX: 0.5,
                        scaleY: 0.5,
                    });
                    fabricCanvas.add(img);
                    fabricCanvas.setActiveObject(img);
                }).catch((err) => {
                    console.error("Error loading image", err);
                });
            }
        };

        const handleMouseMove = (opt: any) => {
            if (!isDragging.current || !activeShape.current) return;
            const pointer = fabricCanvas.getPointer(opt.e);

            if (activeTool === 'rectangle') {
                const rect = activeShape.current;
                const startX = startPos.current.x;
                const startY = startPos.current.y;

                // Calculate dimensions
                const width = Math.abs(pointer.x - startX);
                const height = Math.abs(pointer.y - startY);

                rect.set({ width, height });

                // Handle negative/reverse dragging
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
