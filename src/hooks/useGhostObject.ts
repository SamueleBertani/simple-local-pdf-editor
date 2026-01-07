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

    useEffect(() => {
        if (!fabricCanvas) return;

        // Helper: Update Ghost
        const updateGhost = () => {
            // Remove existing ghost if any
            if (ghostObj.current) {
                fabricCanvas.remove(ghostObj.current);
                ghostObj.current = null;
            }

            // Don't show ghost if interacting (editing text or moving objects)
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
                    fabricCanvas.requestRenderAll();
                });
            }
        };

        // Initial setup
        updateGhost();

        const handleMouseMove = (opt: any) => {
            const pointer = fabricCanvas.getPointer(opt.e);

            // Move Ghost
            if (ghostObj.current && !isInteracting.current) {
                ghostObj.current.set({ left: pointer.x, top: pointer.y });
                // If not added to canvas yet, add it
                if (!fabricCanvas.contains(ghostObj.current)) {
                    fabricCanvas.add(ghostObj.current);
                }
                // Fix: ensure ghost is on top using canvas method
                fabricCanvas.bringObjectToFront(ghostObj.current);
                fabricCanvas.requestRenderAll();
            } else if (ghostObj.current && isInteracting.current) {
                // If interacting, ensure ghost is hidden
                fabricCanvas.remove(ghostObj.current);
                ghostObj.current = null;
            }
        };

        const handleMouseOut = () => {
            if (ghostObj.current) {
                fabricCanvas.remove(ghostObj.current);
                ghostObj.current = null;
                fabricCanvas.requestRenderAll();
            }
        };

        // Interaction Handlers
        const handleTextEditStart = () => {
            isInteracting.current = true;
            if (ghostObj.current) {
                fabricCanvas.remove(ghostObj.current);
                ghostObj.current = null;
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
                    ghostObj.current = null;
                    fabricCanvas.requestRenderAll();
                }
            }
        };

        const handleMouseUp = () => {
            // Only reset if we were interacting via mouse (not text edit)
            // But wait, text editing enters a specific mode. 
            // We should check if we are in text editing mode?
            // fabricCanvas.getActiveObject() might be IText in editing mode.
            // But 'text:editing:entered' handles the text editing state specifically.
            // MouseUp should clear the "drag/transform" interaction.

            // If we are editing text, don't reset isInteracting based on mouse up
            // because the user might just clicked inside the text box.
            // fabricCanvas.isDrawingMode is another thing.

            // Let's rely on checking if active object is in editing mode?
            const activeObj = fabricCanvas.getActiveObject() as any;
            if (activeObj && activeObj.isEditing) {
                return;
            }

            if (isInteracting.current) {
                isInteracting.current = false;
                // We might want to restore the ghost immediately or wait for move
                // updateGhost() calls requestRenderAll inside promise for images, 
                // so it might be safe.
                // However, without mouse move, we don't know where to put it yet if we cleared it.
                // But updateGhost just prepares it. `handleMouseMove` positions it.
                // Actually handleMouseMove expects ghostObj.current to be there or not?
                // logic in handleMouseMove: if ghostObj.current ...

                // If we call updateGhost(), it creates the ghost at (0,0)? 
                // No, Text is created at 'Type here' default? 
                // The Image load is async.

                // Better approach: Let handleMouseMove recreate/show ghost?
                // But handleMouseMove assumes ghostObj exists to move it.

                // Let's call updateGhost() which creates it. 
                // Then next mouseMove will position it.
                // It might briefly flash at 0,0 or wherever default is.
                // Text default: (0,0) implied? IText constructor: left: pointer.x?
                // Wait, updateGhost() in my code above uses `toolSettings` but doesn't have `pointer` position!
                // The original code used `pointer` from `opt` in `handleMouseDown` in Overlay.
                // But `useGhostObject` creates it.

                // Re-reading `updateGhost` in `useGhostObject`:
                // It creates Text with `originX: 'left', originY: 'top'`... but doesn't set `left` or `top`!
                // So it defaults to 0,0.
                // And `handleMouseMove` sets position.

                // If I call `updateGhost()` here, it will appear at 0,0 until mouse moves.
                // Maybe I should only set `isInteracting = false` and let `handleMouseMove` create it?
                // But `handleMouseMove` currently only moves it if it exists.

                // Let's change `handleMouseMove` to CREATE it if missing and not interacting?
                // Or just keep `updateGhost` doing the creation, but set visible=false until moved?
                // Or `opacity: 0`?

                // Actually my `updateGhost` function creates it with opacity 0.5.

                // If I just set `isInteracting = false`, the next `mouse:move` will trigger.
                // But `handleMouseMove` logic:
                // `if (ghostObj.current && !isInteracting.current)` -> moves it.
                // It doesn't create it.

                // So I need to call `updateGhost()`.
                // To avoid flash at 0,0, maybe `updateGhost` should accept position?
                // Or just rely on it being fast?
                // Or make `updateGhost` create it but not add to canvas?
                // `handleMouseMove` adds it.

                // In my logic: `updateGhost` creates `ghostObj.current`.
                // It does NOT add it to canvas (except `FabricImage` promise *does* NOT add it, wait).
                // `FabricImage.fromURL` ... `ghostObj.current = img`.
                // It does `fabricCanvas.requestRenderAll()`.
                // But it does NOT call `fabricCanvas.add(img)`.

                // `handleMouseMove`:
                // `if (!fabricCanvas.contains(ghostObj.current)) { fabricCanvas.add(ghostObj.current); }`

                // So `updateGhost` prepares the object but doesn't show it.
                // `handleMouseMove` positions it AND adds it.
                // THIS IS PERFECT.
                // So calling `updateGhost()` simply informs "we have a ghost ready".
                // Next mouse move will position and show it.

                updateGhost();
            }
        };

        fabricCanvas.on('mouse:move', handleMouseMove);
        fabricCanvas.on('mouse:out', handleMouseOut);
        fabricCanvas.on('text:editing:entered', handleTextEditStart);
        fabricCanvas.on('text:editing:exited', handleTextEditEnd);
        fabricCanvas.on('mouse:down', handleMouseDown);
        fabricCanvas.on('mouse:up', handleMouseUp);

        return () => {
            if (ghostObj.current && fabricCanvas) fabricCanvas.remove(ghostObj.current);
            ghostObj.current = null;
            fabricCanvas.off('mouse:move', handleMouseMove);
            fabricCanvas.off('mouse:out', handleMouseOut);
            fabricCanvas.off('text:editing:entered', handleTextEditStart);
            fabricCanvas.off('text:editing:exited', handleTextEditEnd);
            fabricCanvas.off('mouse:down', handleMouseDown);
            fabricCanvas.off('mouse:up', handleMouseUp);
        };
    }, [fabricCanvas, activeTool, toolSettings, pendingImage]);
}
