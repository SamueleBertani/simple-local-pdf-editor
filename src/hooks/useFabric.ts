import { useEffect, useRef, useState } from 'react';
import { Canvas } from 'fabric';

interface UseFabricProps {
    width: number;
    height: number;
    scale: number;
}

/**
 * Custom hook to initialize and manage a Fabric.js canvas instance.
 * Handles canvas creation, resizing, and cleanup.
 * 
 * @param props.width Output width of the canvas
 * @param props.height Output height of the canvas
 * @param props.scale Current zoom scale to apply
 * @returns Object containing the canvas DOM ref and the initialized fabric instance
 */
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

        return () => {
            try {
                canvas.dispose();
            } catch (e) {
                // Ignore errors during disposal
            }
            setFabricCanvas(null);
        };
    }, []); // Run once on mount (dimensions handled in separate effect to avoid full recreation if possible)

    // Handle Dimension/Scale Updates
    useEffect(() => {
        if (!fabricCanvas) return;

        fabricCanvas.setDimensions({ width, height });
        fabricCanvas.setZoom(scale); // Optional: Match zoom if we want vector scaling behavior
        fabricCanvas.requestRenderAll();

    }, [fabricCanvas, width, height, scale]);

    return { canvasRef, fabricCanvas };
}
