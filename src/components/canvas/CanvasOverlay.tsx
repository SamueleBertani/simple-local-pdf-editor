import { useEffect, useState } from 'react';
import { FabricImage } from 'fabric';
import { useFabric } from '../../hooks/useFabric';
import { useToolStore } from '../../store/useToolStore';
import { usePDFStore } from '../../store/usePDFStore';
import { useCanvasHistory } from '../../hooks/useCanvasHistory';
import { useClipboardStore } from '../../store/useClipboardStore';
import { useGhostObject } from '../../hooks/useGhostObject';
import { RectangleDrawingHandler } from './handlers/RectangleDrawingHandler';
import { TextCreationHandler } from './handlers/TextCreationHandler';
import { ObjectDragDropHandler } from './handlers/ObjectDragDropHandler';
import { useNotificationStore } from '../../store/useNotificationStore';

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

    // Manage Interactions (Remaining Logic: Stamping/Image placement and global Setup)
    useEffect(() => {
        if (!fabricCanvas) return;

        // 1. Configure Drawing Mode
        fabricCanvas.isDrawingMode = false;

        const handleMouseDown = (opt: any) => {
            const pointer = fabricCanvas.getPointer(opt.e);

            // Allow selection of existing objects (ignore if clicking ghost)
            if (opt.target && !opt.target.data?.isGhost) {
                // We are possibly starting a drag of an object
                setIsDraggingCanvas(true);
                return;
            }

            // Image/Stamp placement (still here for now)
            if ((activeTool === 'image' || activeTool === 'stamp' || activeTool === 'handwriting') && pendingImage) {
                const imageUrl = pendingImage; // Capture for use in async callback
                FabricImage.fromURL(imageUrl).then((img) => {
                    // Check for stored scale if it's a stamp
                    const storedScale = activeTool === 'stamp' ? useToolStore.getState().stampScales[imageUrl] : null;

                    img.set({
                        left: pointer.x, top: pointer.y,
                        originX: 'center', originY: 'center',
                        scaleX: storedScale?.scaleX ?? 0.5,
                        scaleY: storedScale?.scaleY ?? 0.5,
                        data: {
                            stampUrl: activeTool === 'stamp' ? imageUrl : undefined
                        }
                    });
                    fabricCanvas.add(img);
                    fabricCanvas.setActiveObject(img);
                }).catch(err => {
                    console.error("Error loading image", err);
                    useNotificationStore.getState().addNotification({
                        type: 'error',
                        title: 'Image Load Error',
                        message: 'Failed to load image. Please try again.'
                    });
                });
            }
        };

        const handleMouseUp = () => {
            setIsDraggingCanvas(false);
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
        fabricCanvas.on('mouse:up', handleMouseUp);
        fabricCanvas.on('object:modified', handleObjectModified);

        return () => {
            fabricCanvas.off('mouse:down', handleMouseDown);
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

            <RectangleDrawingHandler
                fabricCanvas={fabricCanvas}
                activeTool={activeTool}
                toolSettings={toolSettings}
                setIsDraggingCanvas={setIsDraggingCanvas}
            />

            <TextCreationHandler
                fabricCanvas={fabricCanvas}
                activeTool={activeTool}
                toolSettings={toolSettings}
            />

            <ObjectDragDropHandler
                fabricCanvas={fabricCanvas}
                pageIndex={pageIndex}
            />
        </div>
    );
}
