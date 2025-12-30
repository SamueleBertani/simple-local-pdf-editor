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

        // Modification is tricky. We need 'before' state.
        // event 'object:modified' fires at end of transform.
        // We can capture state on 'mouse:down' or 'object:scaling/moving' start? 
        // Fabric doesn't have a clean 'transform:start', but we have 'before:transform'?
        // Actually 'object:modified' provides target. We just need to know what it WAS.
        // We can use a map of objects? Or use the store.

        // Better strategy: On selection created, save state? 
        // But invalid if we select -> wait -> modify.

        // Fabric has 'object:modified'.
        // We can try to capture 'previous' state by listening to 'mouse:down' on an object?

        // Let's use 'before:transform' if available in v6? Checked docs: object:modifying?
        // Standard pattern: preserve state on selection, or on transform start.

        // Simpler: use a map of known object states for the page?

        // Let's rely on `transform` events?
        // Actually, just capturing on 'mouse:down' (if target exists) is a decent proxy for "start of potentical action".

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

        const handleModified = (e: any) => {
            if (isUndoRedoOperation) return;
            const obj = e.target;

            if (activeModification.current && activeModification.current.target === obj.id) {
                addToHistory({
                    type: 'modify',
                    pageIndex,
                    objectId: obj.id,
                    data: obj.toObject(['id', 'left', 'top', 'width', 'height', 'scaleX', 'scaleY', 'fill', 'stroke', 'text', 'angle']),
                    previousData: activeModification.current.previousData
                });

                // Update current as new base for next modification
                activeModification.current = {
                    target: obj.id,
                    previousData: obj.toObject(['id', 'left', 'top', 'width', 'height', 'scaleX', 'scaleY', 'fill', 'stroke', 'text', 'angle'])
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
