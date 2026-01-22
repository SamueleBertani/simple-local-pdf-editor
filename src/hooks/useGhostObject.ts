import { useEffect, useRef, useCallback } from 'react';
import type { Canvas, FabricObject, TPointerEventInfo, TPointerEvent } from 'fabric';
import type { ToolType } from '../store/useToolStore';
import { useIsMobile } from './useIsMobile';
import type { ToolSettings, CustomFabricObject } from '../types';
import { useTextGhost } from './ghost/useTextGhost';
import { useImageGhost } from './ghost/useImageGhost';
import { TOOLS } from '../constants/tools';

interface UseGhostObjectProps {
    fabricCanvas: Canvas | null;
    activeTool: ToolType;
    toolSettings: ToolSettings;
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
    const ghostObj = useRef<FabricObject | null>(null);
    const isInteracting = useRef(false);
    const isMouseOver = useRef(false);
    const lastPointer = useRef<{ x: number, y: number } | null>(null);

    const { createTextGhost } = useTextGhost();
    const { createImageGhost } = useImageGhost();



    /**
     * Re-creates the ghost object based on current tool settings.
     */
    /**
     * Re-creates the ghost object based on current tool settings.
     */
    const updateGhost = useCallback(async () => {
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

        if (isInteracting.current) return;

        let newGhost: FabricObject | null = null;

        // Create the new ghost off-canvas first
        if (activeTool === TOOLS.TEXT) {
            newGhost = createTextGhost(activeTool, toolSettings);
        } else if (activeTool === TOOLS.IMAGE || activeTool === TOOLS.STAMP || activeTool === TOOLS.HANDWRITING) {
            newGhost = await createImageGhost(activeTool, pendingImage);
        }

        // Synchronous swap to prevent flicker
        if (ghostObj.current) {
            fabricCanvas.remove(ghostObj.current);
            ghostObj.current = null;
        }

        if (newGhost) {
            // Position it at the last known pointer location immediately
            if (lastPointer.current) {
                newGhost.set({ left: lastPointer.current.x, top: lastPointer.current.y });
            }

            ghostObj.current = newGhost;

            // Only add if we have a valid position/mouse status, otherwise wait for next mousemove
            if (isMouseOver.current && lastPointer.current) {
                if (!fabricCanvas.contains(newGhost)) {
                    fabricCanvas.add(newGhost);
                }
                fabricCanvas.bringObjectToFront(newGhost);
            }

            fabricCanvas.requestRenderAll();
        } else {
            fabricCanvas.requestRenderAll();
        }
    }, [fabricCanvas, activeTool, toolSettings, pendingImage, isMobile, createTextGhost, createImageGhost]);

    // Simple add check for mouse movements
    const checkAndAddGhost = useCallback(() => {
        if (!fabricCanvas || !ghostObj.current) return;

        if (isMouseOver.current && !isInteracting.current && lastPointer.current) {
            ghostObj.current.set({ left: lastPointer.current.x, top: lastPointer.current.y });

            if (!fabricCanvas.contains(ghostObj.current)) {
                fabricCanvas.add(ghostObj.current);
                fabricCanvas.bringObjectToFront(ghostObj.current);
            }
            fabricCanvas.requestRenderAll();
        }
    }, [fabricCanvas]);

    useEffect(() => {
        if (!fabricCanvas) return;

        updateGhost();

        const handleMouseMove = (opt: TPointerEventInfo<TPointerEvent>) => {
            if (isMobile) return;

            const pointer = fabricCanvas.getPointer(opt.e);
            lastPointer.current = { x: pointer.x, y: pointer.y };

            if (!isMouseOver.current) isMouseOver.current = true;
            if (isInteracting.current) return;

            checkAndAddGhost();
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

        const handleMouseDown = (opt: TPointerEventInfo<TPointerEvent>) => {
            // Interact only if clicking on a real object
            const target = opt.target as CustomFabricObject | undefined;
            if (target && !target.data?.isGhost) {
                isInteracting.current = true;
                if (ghostObj.current) {
                    fabricCanvas.remove(ghostObj.current);
                    fabricCanvas.requestRenderAll();
                }
            }
        };

        const handleMouseUp = () => {
            const activeObj = fabricCanvas.getActiveObject();
            if (activeObj && 'isEditing' in activeObj && activeObj.isEditing) return;

            if (isInteracting.current) {
                isInteracting.current = false;
                checkAndAddGhost();
            }
        };

        const handleGlobalMouseUp = () => {
            const activeObj = fabricCanvas.getActiveObject();
            if (activeObj && 'isEditing' in activeObj && activeObj.isEditing) return;

            if (isInteracting.current) {
                isInteracting.current = false;
                checkAndAddGhost();
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
    }, [fabricCanvas, updateGhost, isMobile, checkAndAddGhost]);
}
