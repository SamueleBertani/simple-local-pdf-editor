import { useEffect, useState } from 'react';
import { useFabric } from '../../hooks/useFabric';
import { useToolStore } from '../../store/useToolStore';
import { usePDFStore } from '../../store/usePDFStore';
import { useCanvasHistory } from '../../hooks/useCanvasHistory';
import { useClipboardStore } from '../../store/useClipboardStore';
import { useGhostObject } from '../../hooks/useGhostObject';
import { useImagePlacement } from '../../hooks/useImagePlacement';
import { RectangleDrawingHandler } from './handlers/RectangleDrawingHandler';
import { TextCreationHandler } from './handlers/TextCreationHandler';
import { ObjectDragDropHandler } from './handlers/ObjectDragDropHandler';

/**
 * Props for the CanvasOverlay component.
 */
interface CanvasOverlayProps {
    /** Canvas width in pixels */
    width: number;
    /** Canvas height in pixels */
    height: number;
    /** Current zoom scale factor */
    scale: number;
    /** 1-based page number this overlay belongs to */
    pageIndex: number;
}

/**
 * The core overlay component for each PDF page.
 * Manages the Fabric.js canvas instance relative to the PDF page coordinates.
 * 
 * Responsibilities:
 * - Initializes and scales the Fabric canvas.
 * - Handles user input (Drawing, Text, Rectangle, Stamps).
 * - Manages object placement and drag-and-drop between pages.
 * - Integrates with shared stores (History, Clipboard, PDF).
 */
export function CanvasOverlay({ width, height, scale, pageIndex }: CanvasOverlayProps) {
    const { canvasRef, fabricCanvas } = useFabric({ width, height, scale });
    const { activeTool, pendingImage, toolSettings } = useToolStore();
    const { registerCanvas, unregisterCanvas } = usePDFStore();
    const { setLastActivePageIndex } = useClipboardStore();

    const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);

    useCanvasHistory(fabricCanvas, pageIndex);
    useGhostObject({ fabricCanvas, activeTool, toolSettings, pendingImage });
    useImagePlacement({ fabricCanvas, activeTool, toolSettings, pendingImage, setIsDraggingCanvas });

    /** Register canvas with global store and track page interactions */
    useEffect(() => {
        if (fabricCanvas) {
            registerCanvas(pageIndex, fabricCanvas);

            // Track active page for paste operations
            const handleInteraction = () => {
                setLastActivePageIndex(pageIndex);
            };

            fabricCanvas.on('mouse:down', handleInteraction);
            fabricCanvas.on('mouse:over', handleInteraction);

            return () => {
                unregisterCanvas(pageIndex);
                fabricCanvas.off('mouse:down', handleInteraction);
                fabricCanvas.off('mouse:over', handleInteraction);
            };
        }
    }, [fabricCanvas, pageIndex, registerCanvas, unregisterCanvas, setLastActivePageIndex]);

    return (
        <div
            className="absolute inset-0 pointer-events-auto"
            style={{ zIndex: isDraggingCanvas ? 50 : 10 }}
        >
            <canvas ref={canvasRef} />

            <RectangleDrawingHandler
                fabricCanvas={fabricCanvas}
                activeTool={activeTool}
                toolSettings={toolSettings}
                setIsDraggingCanvas={setIsDraggingCanvas}
            />

            <TextCreationHandler
                fabricCanvas={fabricCanvas}
                activeTool={activeTool}
                toolSettings={toolSettings}
            />

            <ObjectDragDropHandler
                fabricCanvas={fabricCanvas}
                pageIndex={pageIndex}
            />
        </div>
    );
}
