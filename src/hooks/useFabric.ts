import { useEffect, useRef, useState } from 'react';
import { Canvas } from 'fabric';

interface UseFabricProps {
    width: number;
    height: number;
    scale: number;
}

export function useFabric({ width, height, scale }: UseFabricProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [fabricCanvas, setFabricCanvas] = useState<Canvas | null>(null);

    useEffect(() => {
        if (!canvasRef.current) return;

        // Initialize Fabric Canvas
        const canvas = new Canvas(canvasRef.current, {
            height,
            width,
            selection: true, // Enable multiple selection
            preserveObjectStacking: true, // Keep stacking order
        });

        setFabricCanvas(canvas);

        // Initial scale match (if needed, though mostly we just match dimensions)
        // fabric handles internal scaling if we want, but for now we just size the canvas 1:1 with pixels

        return () => {
            canvas.dispose();
            setFabricCanvas(null);
        };
    }, []); // Run once on mount (dimensions handled in separate effect to avoid full recreation if possible)

    // Handle Dimension/Scale Updates
    useEffect(() => {
        if (!fabricCanvas) return;

        fabricCanvas.setDimensions({ width, height });
        fabricCanvas.setZoom(scale); // Optional: Match zoom if we want vector scaling behavior
        fabricCanvas.renderAll();

    }, [fabricCanvas, width, height, scale]);

    return { canvasRef, fabricCanvas };
}
