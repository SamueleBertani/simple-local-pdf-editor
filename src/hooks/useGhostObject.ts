import { useEffect, useRef, useCallback } from 'react';
import { Canvas, FabricImage, IText } from 'fabric';
import { useToolStore } from '../store/useToolStore';
import type { ToolType } from '../store/useToolStore';
import { useIsMobile } from './useIsMobile';

interface UseGhostObjectProps {
    fabricCanvas: Canvas | null;
    activeTool: ToolType;
    toolSettings: any;
    pendingImage: string | null;
}

/**
 * Hook to handle the "Ghost" object (preview) that follows the mouse cursor.
 * Used for tools like Text, Stamps, and Handwriting to show where the object will be placed.
 * 
 * Handles:
 * - Creating/Updating the ghost object based on the active tool.
 * - Moving the ghost with the mouse.
 * - Hiding the ghost during interactions or when leaving the canvas.
 */
export function useGhostObject({ fabricCanvas, activeTool, toolSettings, pendingImage }: UseGhostObjectProps) {
    const isMobile = useIsMobile();
    const ghostObj = useRef<any>(null);
    const isInteracting = useRef(false);
    const isMouseOver = useRef(false);
    const lastPointer = useRef<{ x: number, y: number } | null>(null);

    /**
     * Adds the ghost to the canvas if conditions are met.
     */
    const checkAndAddGhost = useCallback(() => {
        if (!fabricCanvas) return;
        if (ghostObj.current && isMouseOver.current && !isInteracting.current && lastPointer.current) {
            ghostObj.current.set({ left: lastPointer.current.x, top: lastPointer.current.y });

            if (!fabricCanvas.contains(ghostObj.current)) {
                fabricCanvas.add(ghostObj.current);
            }

            fabricCanvas.bringObjectToFront(ghostObj.current);
            fabricCanvas.requestRenderAll();
        }
    }, [fabricCanvas]);

    /**
     * Re-creates the ghost object based on current tool settings.
     */
    const updateGhost = useCallback(() => {
        if (!fabricCanvas) return;

        // Disable ghost on mobile
        if (isMobile) {
            if (ghostObj.current) {
                fabricCanvas.remove(ghostObj.current);
                ghostObj.current = null;
                fabricCanvas.requestRenderAll();
            }
            return;
        }

        if (ghostObj.current) {
            fabricCanvas.remove(ghostObj.current);
            ghostObj.current = null;
        }

        if (isInteracting.current) return;

        if (activeTool === 'text') {
            const text = new IText('Type here', {
                fontFamily: toolSettings.fontFamily,
                fontSize: toolSettings.fontSize,
                fill: toolSettings.color,
                opacity: 0.5,
                evented: false,
                selectable: false,
                originX: 'left',
                originY: 'top',
                data: { isGhost: true }
            });
            ghostObj.current = text;
            checkAndAddGhost();
        } else if ((activeTool === 'image' || activeTool === 'stamp' || activeTool === 'handwriting') && pendingImage) {
            FabricImage.fromURL(pendingImage).then((img) => {
                if (!activeTool.match(/image|stamp|handwriting/)) return;
                if (isInteracting.current) return;

                // @ts-ignore
                const storedScale = activeTool === 'stamp' ? useToolStore.getState().stampScales[pendingImage] : null;

                img.set({
                    opacity: 0.5,
                    evented: false,
                    selectable: false,
                    originX: 'center',
                    originY: 'center',
                    scaleX: storedScale?.scaleX ?? 0.5,
                    scaleY: storedScale?.scaleY ?? 0.5,
                    data: { isGhost: true }
                });
                ghostObj.current = img;
                checkAndAddGhost();
            });
        }
    }, [fabricCanvas, activeTool, toolSettings, pendingImage, checkAndAddGhost, isMobile]);

    useEffect(() => {
        if (!fabricCanvas) return;

        updateGhost();

        const handleMouseMove = (opt: any) => {
            if (isMobile) return;

            const pointer = fabricCanvas.getPointer(opt.e);
            lastPointer.current = { x: pointer.x, y: pointer.y };

            if (!isMouseOver.current) isMouseOver.current = true;
            if (isInteracting.current) return;

            if (ghostObj.current) {
                ghostObj.current.set({ left: pointer.x, top: pointer.y });

                if (!fabricCanvas.contains(ghostObj.current)) {
                    fabricCanvas.add(ghostObj.current);
                    fabricCanvas.bringObjectToFront(ghostObj.current);
                }

                fabricCanvas.requestRenderAll();
            }
        };

        const handleNativeMouseEnter = (e: MouseEvent) => {
            isMouseOver.current = true;
            const pointer = fabricCanvas.getPointer(e);
            lastPointer.current = { x: pointer.x, y: pointer.y };
            checkAndAddGhost();
        };

        const handleNativeMouseLeave = () => {
            isMouseOver.current = false;
            if (ghostObj.current) {
                fabricCanvas.remove(ghostObj.current);
                fabricCanvas.requestRenderAll();
            }
        };

        const handleTextEditStart = () => {
            isInteracting.current = true;
            if (ghostObj.current) {
                fabricCanvas.remove(ghostObj.current);
                fabricCanvas.requestRenderAll();
            }
        };

        const handleTextEditEnd = () => {
            isInteracting.current = false;
            updateGhost();
        };

        const handleMouseDown = (opt: any) => {
            // Interact only if clicking on a real object
            if (opt.target && !opt.target.data?.isGhost) {
                isInteracting.current = true;
                if (ghostObj.current) {
                    fabricCanvas.remove(ghostObj.current);
                    fabricCanvas.requestRenderAll();
                }
            }
        };

        const handleMouseUp = () => {
            const activeObj = fabricCanvas.getActiveObject() as any;
            if (activeObj && activeObj.isEditing) return;

            if (isInteracting.current) {
                isInteracting.current = false;
                updateGhost();
            }
        };

        const handleGlobalMouseUp = () => {
            const activeObj = fabricCanvas.getActiveObject() as any;
            if (activeObj && activeObj.isEditing) return;

            if (isInteracting.current) {
                isInteracting.current = false;
                updateGhost();
            }
        };

        fabricCanvas.on('mouse:move', handleMouseMove);
        fabricCanvas.on('text:editing:entered', handleTextEditStart);
        fabricCanvas.on('text:editing:exited', handleTextEditEnd);
        fabricCanvas.on('mouse:down', handleMouseDown);
        fabricCanvas.on('mouse:up', handleMouseUp);

        const upperCanvas = fabricCanvas.upperCanvasEl;
        if (upperCanvas) {
            upperCanvas.addEventListener('mouseenter', handleNativeMouseEnter);
            upperCanvas.addEventListener('mouseleave', handleNativeMouseLeave);
        }

        window.addEventListener('mouseup', handleGlobalMouseUp);

        return () => {
            if (ghostObj.current && fabricCanvas) fabricCanvas.remove(ghostObj.current);
            ghostObj.current = null;

            fabricCanvas.off('mouse:move', handleMouseMove);
            fabricCanvas.off('text:editing:entered', handleTextEditStart);
            fabricCanvas.off('text:editing:exited', handleTextEditEnd);
            fabricCanvas.off('mouse:down', handleMouseDown);
            fabricCanvas.off('mouse:up', handleMouseUp);

            if (upperCanvas) {
                upperCanvas.removeEventListener('mouseenter', handleNativeMouseEnter);
                upperCanvas.removeEventListener('mouseleave', handleNativeMouseLeave);
            }
            window.removeEventListener('mouseup', handleGlobalMouseUp);
        };
    }, [fabricCanvas, updateGhost, isMobile]);
}
