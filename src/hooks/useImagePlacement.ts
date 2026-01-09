import { useEffect } from 'react';
import { FabricImage, type Canvas, type TPointerEventInfo, type TPointerEvent, type ModifiedEvent } from 'fabric';
import { useToolStore, type ToolType } from '../store/useToolStore';
import { useNotificationStore } from '../store/useNotificationStore';
import type { CustomFabricObject, ToolSettings } from '../types';

interface UseImagePlacementOptions {
    fabricCanvas: Canvas | null;
    activeTool: ToolType;
    toolSettings: ToolSettings;
    pendingImage: string | null;
    setIsDraggingCanvas: (isDragging: boolean) => void;
}

/**
 * Hook that handles image, stamp, and handwriting placement on the canvas.
 * Manages mouse interactions for placing images and saving stamp scales.
 */
export function useImagePlacement({
    fabricCanvas,
    activeTool,
    toolSettings,
    pendingImage,
    setIsDraggingCanvas
}: UseImagePlacementOptions): void {
    useEffect(() => {
        if (!fabricCanvas) return;

        // eslint-disable-next-line react-hooks/immutability
        fabricCanvas.isDrawingMode = false;

        const handleMouseDown = (opt: TPointerEventInfo<TPointerEvent>) => {
            const pointer = fabricCanvas.getPointer(opt.e);
            const target = opt.target as CustomFabricObject | undefined;

            // Allow selection of existing objects (ignore if clicking ghost)
            if (target && !target.data?.isGhost) {
                setIsDraggingCanvas(true);
                return;
            }

            // Image/Stamp/Handwriting placement
            if ((activeTool === 'image' || activeTool === 'stamp' || activeTool === 'handwriting') && pendingImage) {
                const imageUrl = pendingImage;
                FabricImage.fromURL(imageUrl).then((img) => {
                    const storedScale = activeTool === 'stamp' ? useToolStore.getState().stampScales[imageUrl] : null;

                    img.set({
                        left: pointer.x,
                        top: pointer.y,
                        originX: 'center',
                        originY: 'center',
                        scaleX: storedScale?.scaleX ?? 0.5,
                        scaleY: storedScale?.scaleY ?? 0.5,
                        data: {
                            stampUrl: activeTool === 'stamp' ? imageUrl : undefined
                        }
                    });
                    fabricCanvas.add(img);
                    fabricCanvas.setActiveObject(img);
                }).catch(() => {
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

        const handleObjectModified = (e: ModifiedEvent) => {
            const target = e.target as CustomFabricObject | undefined;
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
        fabricCanvas.on('object:modified', handleObjectModified as never);

        return () => {
            fabricCanvas.off('mouse:down', handleMouseDown);
            fabricCanvas.off('mouse:up', handleMouseUp);
            fabricCanvas.off('object:modified', handleObjectModified);
        };
    }, [fabricCanvas, activeTool, toolSettings, pendingImage, setIsDraggingCanvas]);
}
