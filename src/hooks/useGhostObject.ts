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

export function useGhostObject({ fabricCanvas, activeTool, toolSettings, pendingImage }: UseGhostObjectProps) {
    const ghostObj = useRef<any>(null);
    const isInteracting = useRef(false);
    const isMouseOver = useRef(false);
    const lastPointer = useRef<{ x: number, y: number } | null>(null);

    useEffect(() => {
        if (!fabricCanvas) return;

        // Helper: Update Ghost
        const updateGhost = () => {
            // Remove existing ghost if any
            if (ghostObj.current) {
                fabricCanvas.remove(ghostObj.current);
                ghostObj.current = null;
            }

            // Don't create ghost if interacting (editing text or moving objects)
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
                    if (isInteracting.current) return; // Check again after async load

                    // Get stored scale for this stamp if available
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

        // Helper: Check if ghost should be added and add it
        const checkAndAddGhost = () => {
            if (ghostObj.current && isMouseOver.current && !isInteracting.current && lastPointer.current) {
                // Update position
                ghostObj.current.set({ left: lastPointer.current.x, top: lastPointer.current.y });

                if (!fabricCanvas.contains(ghostObj.current)) {
                    fabricCanvas.add(ghostObj.current);
                }

                // Only bring to front once when adding/showing
                fabricCanvas.bringObjectToFront(ghostObj.current);
                fabricCanvas.requestRenderAll();
            }
        };

        // Initial setup
        updateGhost();

        const handleMouseMove = (opt: any) => {
            const pointer = fabricCanvas.getPointer(opt.e);
            lastPointer.current = { x: pointer.x, y: pointer.y };

            if (!isMouseOver.current) {
                isMouseOver.current = true;
            }

            if (isInteracting.current) return;

            // Move Ghost
            if (ghostObj.current) {
                ghostObj.current.set({ left: pointer.x, top: pointer.y });

                if (!fabricCanvas.contains(ghostObj.current)) {
                    fabricCanvas.add(ghostObj.current);
                    fabricCanvas.bringObjectToFront(ghostObj.current);
                }
                // PERFORMANCE FIX: Removed continuous bringObjectToFront here to prevent stutter

                fabricCanvas.requestRenderAll();
            }
        };

        const handleNativeMouseEnter = (e: MouseEvent) => {
            isMouseOver.current = true;

            // Calculate pointer relative to canvas element
            // This corresponds to fabric's logic somewhat, but getPointer usually takes event.
            // We can just rely on the next mousemove to set lastPointer precise,
            // or try to set it here.

            // Simple: just mark mouseOver, let checkAndAddGhost add it (might use old lastPointer or wait for move)
            // If we want instant appearance at entry point:
            // We need to simulate the pointer calculation.
            // But fabric's getPointer needs the event.
            // We can pass 'e' to it?
            // fabricCanvas.getPointer(e) works with native events too.
            const pointer = fabricCanvas.getPointer(e);
            lastPointer.current = { x: pointer.x, y: pointer.y };

            checkAndAddGhost();
        };

        const handleNativeMouseLeave = () => {
            // Real exit from the wrapper/canvas
            isMouseOver.current = false;
            if (ghostObj.current) {
                fabricCanvas.remove(ghostObj.current);
                fabricCanvas.requestRenderAll();
            }
        };

        // Interaction Handlers
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
            // If clicking on a real object (not ghost), we are finding to interact
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
            if (activeObj && activeObj.isEditing) {
                return;
            }

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

        // Fabric Events
        fabricCanvas.on('mouse:move', handleMouseMove);
        fabricCanvas.on('text:editing:entered', handleTextEditStart);
        fabricCanvas.on('text:editing:exited', handleTextEditEnd);
        fabricCanvas.on('mouse:down', handleMouseDown);
        fabricCanvas.on('mouse:up', handleMouseUp);

        // Native Events for robust Entry/Exit (avoids object-hover flickering)
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
    }, [fabricCanvas, activeTool, toolSettings, pendingImage]);
}
