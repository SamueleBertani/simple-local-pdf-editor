import { useEffect, useRef, useState } from 'react';
import { FabricImage, Rect, IText } from 'fabric';
import { useFabric } from '../../hooks/useFabric';
import { useToolStore } from '../../store/useToolStore';
import { usePDFStore } from '../../store/usePDFStore';
import { useCanvasHistory } from '../../hooks/useCanvasHistory';
import { useClipboardStore } from '../../store/useClipboardStore';
import { useGhostObject } from '../../hooks/useGhostObject';
import { generateId } from '../../utils/generateId';

interface CanvasOverlayProps {
    width: number;
    height: number;
    scale: number;
    pageIndex: number;
}

/**
 * The core overlay component for each PDF page.
 * Manages the Fabric.js canvas instance relative to the PDF page coordinates.
 * 
 * Responsibilities:
 * - Initializes and scales the Fabric canvas.
 * - Handles user input (Drawing, Text, Rectangle, Stamps).
 * - Manages object placement and drag-and-drop between pages.
 * - Integrates with shared stores (History, Clipboard, PDF).
 */
export function CanvasOverlay({ width, height, scale, pageIndex }: CanvasOverlayProps) {
    const { canvasRef, fabricCanvas } = useFabric({ width, height, scale });
    const { activeTool, pendingImage, setActiveTool, toolSettings } = useToolStore();
    const { registerCanvas, unregisterCanvas } = usePDFStore();
    const { setLastActivePageIndex } = useClipboardStore();

    const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);

    // Refs for drag state
    const isDragging = useRef(false);
    const startPos = useRef({ x: 0, y: 0 });
    const activeShape = useRef<any>(null);

    // Hooks
    useCanvasHistory(fabricCanvas, pageIndex);
    useGhostObject({ fabricCanvas, activeTool, toolSettings, pendingImage });

    // Register canvas with global store
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
            if (opt.target && !opt.target.data?.isGhost) {
                // We are possibly starting a drag of an object
                setIsDraggingCanvas(true);
                return;
            }

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
                setIsDraggingCanvas(true);
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
                    // Check for stored scale if it's a stamp
                    // @ts-ignore
                    const storedScale = activeTool === 'stamp' ? useToolStore.getState().stampScales[pendingImage] : null;

                    img.set({
                        left: pointer.x, top: pointer.y,
                        originX: 'center', originY: 'center',
                        scaleX: storedScale?.scaleX ?? 0.5,
                        scaleY: storedScale?.scaleY ?? 0.5,
                        data: {
                            stampUrl: activeTool === 'stamp' ? pendingImage : undefined
                        }
                    });
                    fabricCanvas.add(img);
                    fabricCanvas.setActiveObject(img);
                }).catch(err => {
                    console.error("Error loading image", err);
                    alert('Failed to load image. Please try again.');
                });
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

        const handleMouseUp = (opt: any) => {
            setIsDraggingCanvas(false);

            if (isDragging.current) {
                isDragging.current = false;
                if (activeShape.current) {
                    activeShape.current.set({ selectable: true, evented: true });
                    activeShape.current.setCoords();
                    fabricCanvas.setActiveObject(activeShape.current);
                    activeShape.current = null;
                }
                return;
            }

            // Check for Object Drop on another Page
            const activeObj = fabricCanvas.getActiveObject();
            if (activeObj && opt.e) {
                const allCanvases = usePDFStore.getState().canvases;

                Object.entries(allCanvases).forEach(([pIndex, targetCanvas]: [string, any]) => {
                    const targetPageIndex = parseInt(pIndex);
                    if (targetPageIndex === pageIndex) return;

                    const targetCanvasEl = targetCanvas.getElement();
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

            const activeObjOld = fabricCanvas.getActiveObject() as any;
            if (activeObjOld && activeObjOld.isEditing) {
                return;
            }

        };

        const handleObjectModified = (e: any) => {
            const target = e.target;
            if (!target) return;

            // If it's a stamp (has stampUrl in data), save the new scale
            if (target.data?.stampUrl) {
                useToolStore.getState().setStampScale(target.data.stampUrl, {
                    scaleX: target.scaleX || 0.5,
                    scaleY: target.scaleY || 0.5
                });
            }
        };

        fabricCanvas.on('mouse:down', handleMouseDown);
        fabricCanvas.on('mouse:move', handleMouseMove);
        fabricCanvas.on('mouse:up', handleMouseUp);
        fabricCanvas.on('object:modified', handleObjectModified);

        return () => {
            fabricCanvas.off('mouse:down', handleMouseDown);
            fabricCanvas.off('mouse:move', handleMouseMove);
            fabricCanvas.off('mouse:up', handleMouseUp);
            fabricCanvas.off('object:modified', handleObjectModified);
        };
    }, [fabricCanvas, activeTool, toolSettings, pendingImage, setActiveTool]);

    return (
        <div
            className="absolute inset-0 pointer-events-auto"
            style={{ zIndex: isDraggingCanvas ? 50 : 10 }}
        >
            <canvas ref={canvasRef} />
        </div>
    );
}
