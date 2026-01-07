import { useEffect, useRef } from 'react';
import { Canvas, FabricImage, IText } from 'fabric';
import { useToolStore } from '../store/useToolStore';
import type { ToolType } from '../store/useToolStore';

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
    const ghostObj = useRef<any>(null);
    const isInteracting = useRef(false);
    const isMouseOver = useRef(false);
    const lastPointer = useRef<{ x: number, y: number } | null>(null);

    useEffect(() => {
        if (!fabricCanvas) return;

        /**
         * Re-creates the ghost object based on current tool settings.
         */
        const updateGhost = () => {
            // Cleanup existing ghost
            if (ghostObj.current) {
                fabricCanvas.remove(ghostObj.current);
                ghostObj.current = null;
            }

            // Don't create ghost if user is interacting with canvas
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
                    // Guard: verify tool didn't change while loading
                    if (!activeTool.match(/image|stamp|handwriting/)) return;
                    if (isInteracting.current) return;

                    // Get stored scale for stamps if available
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
        };

        /**
         * Adds the ghost to the canvas if conditions are met.
         */
        const checkAndAddGhost = () => {
            if (ghostObj.current && isMouseOver.current && !isInteracting.current && lastPointer.current) {
                ghostObj.current.set({ left: lastPointer.current.x, top: lastPointer.current.y });

                if (!fabricCanvas.contains(ghostObj.current)) {
                    fabricCanvas.add(ghostObj.current);
                }

                // Bring to front to ensure visibility over other objects
                fabricCanvas.bringObjectToFront(ghostObj.current);
                fabricCanvas.requestRenderAll();
            }
        };

        // Initialize ghost
        updateGhost();

        // --- Event Handlers ---

        const handleMouseMove = (opt: any) => {
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

        // Bind Fabric Events
        fabricCanvas.on('mouse:move', handleMouseMove);
        fabricCanvas.on('text:editing:entered', handleTextEditStart);
        fabricCanvas.on('text:editing:exited', handleTextEditEnd);
        fabricCanvas.on('mouse:down', handleMouseDown);
        fabricCanvas.on('mouse:up', handleMouseUp);

        // Bind Native Events (on upperCanvas for reliable Enter/Leave)
        const upperCanvas = fabricCanvas.upperCanvasEl;
        if (upperCanvas) {
            upperCanvas.addEventListener('mouseenter', handleNativeMouseEnter);
            upperCanvas.addEventListener('mouseleave', handleNativeMouseLeave);
        }

        window.addEventListener('mouseup', handleGlobalMouseUp);

        // Cleanup
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
    }, [fabricCanvas, activeTool, toolSettings, pendingImage]);
}
