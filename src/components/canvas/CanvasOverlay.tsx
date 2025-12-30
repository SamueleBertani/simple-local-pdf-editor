import { useEffect } from 'react';
import { Image as FabricImage } from 'fabric';
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
    const { activeTool, pendingImage, setActiveTool, setPendingImage } = useToolStore();
    const { registerCanvas, unregisterCanvas } = usePDFStore();
    const { setLastActivePageIndex } = useClipboardStore();

    useCanvasHistory(fabricCanvas, pageIndex);

    useEffect(() => {
        if (fabricCanvas) {
            registerCanvas(pageIndex, fabricCanvas);

            // Track active page for paste operations
            const handleInteraction = () => {
                setLastActivePageIndex(pageIndex);
            };

            fabricCanvas.on('mouse:down', handleInteraction);
            fabricCanvas.on('mouse:over', handleInteraction); // Optional: if just hovering implies intent

            return () => {
                unregisterCanvas(pageIndex);
                fabricCanvas.off('mouse:down', handleInteraction);
                fabricCanvas.off('mouse:over', handleInteraction);
            };
        }
    }, [fabricCanvas, pageIndex, registerCanvas, unregisterCanvas, setLastActivePageIndex]);

    useEffect(() => {
        if (!fabricCanvas) return;

        const handleMouseDown = (opt: any) => {
            if ((activeTool === 'image' || activeTool === 'stamp' || activeTool === 'handwriting') && pendingImage) {
                const pointer = fabricCanvas.getPointer(opt.e);

                FabricImage.fromURL(pendingImage).then((img) => {
                    img.set({
                        left: pointer.x,
                        top: pointer.y,
                        originX: 'center',
                        originY: 'center',
                        scaleX: 0.5, // Initial scale
                        scaleY: 0.5,
                    });
                    fabricCanvas.add(img);
                    fabricCanvas.setActiveObject(img);

                    // Keep state active for multiple placements
                    // setActiveTool('select');
                    // setPendingImage(null);
                }).catch((err) => {
                    // Fallback for v5 callback style if promise fails (Runtime check not easy here, but usually v6 is Promise)
                    // If v5, fromURL returns ref, ignores promise.
                    // We assume v6 for now given the import style. 
                    // If v5: FabricImage.fromURL(pendingImage, (img) => { ... })
                    // I'll stick to v6 assumption based on 'import { Canvas } from fabric' working.
                    console.error("Error loading image", err);
                });
            }
        };

        fabricCanvas.on('mouse:down', handleMouseDown);

        return () => {
            fabricCanvas.off('mouse:down', handleMouseDown);
        };
    }, [fabricCanvas, activeTool, pendingImage, setActiveTool, setPendingImage]);

    return (
        <div className="absolute inset-0 z-10 pointer-events-auto">
            <canvas ref={canvasRef} />
        </div>
    );
}
