import { useEffect } from 'react';
import type { FabricObject } from 'fabric';
import { usePDFStore } from '../store/usePDFStore';
import { useClipboardStore } from '../store/useClipboardStore';
import type { CustomFabricObject } from '../types';

/**
 * Hook that tracks movement of duplicated objects to calculate dynamic offset.
 * Implements Figma-style duplication where the offset of the next duplicate
 * matches the displacement of the previous duplicate from its source.
 */
export function useDuplicationOffsetTracker() {
    const { canvases } = usePDFStore();
    const { duplicationContext, setDuplicateOffset, setDuplicationContext } =
        useClipboardStore();

    useEffect(() => {
        /**
         * Handles object modification to update duplication offset.
         * When the duplicated object is moved, calculates new offset as:
         * offset = current_position - source_position
         */
        const handleModified = (e: { target: FabricObject }) => {
            if (!duplicationContext) return;

            const obj = e.target as CustomFabricObject;
            if (obj.id !== duplicationContext.duplicatedObjectId) return;

            // Calculate new offset based on displacement from source position
            const newOffset = {
                x: (obj.left ?? 0) - duplicationContext.sourcePosition.left,
                y: (obj.top ?? 0) - duplicationContext.sourcePosition.top,
            };

            setDuplicateOffset(newOffset);
        };

        /**
         * Handles selection changes to reset duplication context.
         * When user selects a different object, we clear the context
         * but keep the offset for the next duplication.
         */
        const handleSelectionChange = (e: { selected?: FabricObject[] }) => {
            if (!duplicationContext) return;

            const selectedObj = e.selected?.[0] as CustomFabricObject | undefined;

            // If selection changed to a different object, clear context
            if (selectedObj?.id !== duplicationContext.duplicatedObjectId) {
                setDuplicationContext(null);
            }
        };

        // Subscribe to all canvases
        Object.values(canvases).forEach((canvas) => {
            canvas.on('object:modified', handleModified);
            canvas.on('selection:created', handleSelectionChange);
            canvas.on('selection:updated', handleSelectionChange);
        });

        return () => {
            Object.values(canvases).forEach((canvas) => {
                canvas.off('object:modified', handleModified);
                canvas.off('selection:created', handleSelectionChange);
                canvas.off('selection:updated', handleSelectionChange);
            });
        };
    }, [canvases, duplicationContext, setDuplicateOffset, setDuplicationContext]);
}
