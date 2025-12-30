import { useEffect, useRef } from 'react';
import { Canvas } from 'fabric';
import { useHistoryStore } from '../store/useHistoryStore';

// Simple ID generator if uuid not available
const generateId = () => Math.random().toString(36).substr(2, 9);

export function useCanvasHistory(canvas: Canvas | null, pageIndex: number) {
    const { addToHistory, isUndoRedoOperation } = useHistoryStore();

    // We use a ref to track if an object is currently being modified (drag start -> drag end)
    const activeModification = useRef<{ target: string, previousData: any } | null>(null);

    useEffect(() => {
        if (!canvas) return;

        // Helper to ensure object has ID
        const ensureId = (obj: any) => {
            if (!obj.id) {
                obj.set('id', generateId());
            }
            return obj.id;
        };

        const handleAdd = (e: any) => {
            if (isUndoRedoOperation) return;
            const obj = e.target;
            const id = ensureId(obj);

            addToHistory({
                type: 'add',
                pageIndex,
                objectId: id,
                data: obj.toObject(['id', 'left', 'top', 'width', 'height', 'scaleX', 'scaleY', 'fill', 'stroke', 'text']),
            });
        };

        const handleRemove = (e: any) => {
            if (isUndoRedoOperation) return;
            const obj = e.target;
            const id = obj.id; // Should have ID from add

            addToHistory({
                type: 'remove',
                pageIndex,
                objectId: id,
                data: obj.toObject(['id', 'left', 'top', 'width', 'height', 'scaleX', 'scaleY', 'fill', 'stroke', 'text']),
            });
        };

        // We'll capture state when an object becomes active (selected)
        // If it is modified later, we use that initial captured state as 'previous'.
        const handleSelectionCreated = (e: any) => {
            const obj = e.selected?.[0];
            if (!obj) return;
            ensureId(obj);

            // Only track single object modification for V1 simplicity
            if (e.selected.length === 1) {
                activeModification.current = {
                    target: obj.id,
                    previousData: obj.toObject(['id', 'left', 'top', 'width', 'height', 'scaleX', 'scaleY', 'fill', 'stroke', 'text', 'angle'])
                };
            }
        };

        /**
         * Event handler for when an object is modified (moved, scaled, rotated).
         * Checks if the modification is valid (matched ID) and pushes to history.
         */
        const handleModified = (e: any) => {
            if (isUndoRedoOperation) return;
            const obj = e.target;

            if (activeModification.current && activeModification.current.target === obj.id) {
                addToHistory({
                    type: 'modify',
                    pageIndex,
                    objectId: obj.id,
                    data: obj.toObject(['id', 'left', 'top', 'width', 'height', 'scaleX', 'scaleY', 'fill', 'stroke', 'text', 'angle', 'fontFamily', 'fontSize']),
                    previousData: activeModification.current.previousData
                });

                // Update active modification state to the new current state
                // This ensures subsequent modifications use the correct "previous" state relative to the last action
                activeModification.current = {
                    target: obj.id,
                    previousData: obj.toObject(['id', 'left', 'top', 'width', 'height', 'scaleX', 'scaleY', 'fill', 'stroke', 'text', 'angle', 'fontFamily', 'fontSize'])
                };
            }
        };

        canvas.on('object:added', handleAdd);
        canvas.on('object:removed', handleRemove);
        canvas.on('object:modified', handleModified);
        canvas.on('selection:created', handleSelectionCreated);
        canvas.on('selection:updated', handleSelectionCreated); // Handle switching selection

        return () => {
            canvas.off('object:added', handleAdd);
            canvas.off('object:removed', handleRemove);
            canvas.off('object:modified', handleModified);
            canvas.off('selection:created', handleSelectionCreated);
            canvas.off('selection:updated', handleSelectionCreated);
        };
    }, [canvas, pageIndex, addToHistory, isUndoRedoOperation]);
}
