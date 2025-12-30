import { useEffect, useRef } from 'react';
import { Canvas, FabricImage, IText } from 'fabric';
import type { ToolType } from '../store/useToolStore';

interface UseGhostObjectProps {
    fabricCanvas: Canvas | null;
    activeTool: ToolType;
    toolSettings: any;
    pendingImage: string | null;
}

export function useGhostObject({ fabricCanvas, activeTool, toolSettings, pendingImage }: UseGhostObjectProps) {
    const ghostObj = useRef<any>(null);

    useEffect(() => {
        if (!fabricCanvas) return;

        // Helper: Update Ghost
        const updateGhost = () => {
            if (ghostObj.current) {
                fabricCanvas.remove(ghostObj.current);
                ghostObj.current = null;
            }

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

                    img.set({
                        opacity: 0.5,
                        evented: false,
                        selectable: false,
                        originX: 'center',
                        originY: 'center',
                        scaleX: 0.5,
                        scaleY: 0.5,
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
            if (ghostObj.current) {
                ghostObj.current.set({ left: pointer.x, top: pointer.y });
                // If not added to canvas yet, add it
                if (!fabricCanvas.contains(ghostObj.current)) {
                    fabricCanvas.add(ghostObj.current);
                }
                // Fix: ensure ghost is on top using canvas method
                fabricCanvas.bringObjectToFront(ghostObj.current);
                fabricCanvas.requestRenderAll();
            }
        };

        const handleMouseOut = () => {
            if (ghostObj.current) {
                fabricCanvas.remove(ghostObj.current);
                fabricCanvas.requestRenderAll();
            }
        };

        fabricCanvas.on('mouse:move', handleMouseMove);
        fabricCanvas.on('mouse:out', handleMouseOut);

        return () => {
            if (ghostObj.current && fabricCanvas) fabricCanvas.remove(ghostObj.current);
            ghostObj.current = null;
            fabricCanvas.off('mouse:move', handleMouseMove);
            fabricCanvas.off('mouse:out', handleMouseOut);
        };
    }, [fabricCanvas, activeTool, toolSettings, pendingImage]);
}
