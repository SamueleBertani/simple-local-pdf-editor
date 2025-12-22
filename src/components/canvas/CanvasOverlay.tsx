import { useEffect } from 'react';
import { Image as FabricImage } from 'fabric';
import { useFabric } from '../../hooks/useFabric';
import { useToolStore } from '../../store/useToolStore';

import { usePDFStore } from '../../store/usePDFStore';

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

    useEffect(() => {
        if (fabricCanvas) {
            registerCanvas(pageIndex, fabricCanvas);
            return () => unregisterCanvas(pageIndex);
        }
    }, [fabricCanvas, pageIndex, registerCanvas, unregisterCanvas]);

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

                    // Reset state
                    setActiveTool('select');
                    setPendingImage(null);
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
