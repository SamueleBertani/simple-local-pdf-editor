import { useEffect, useRef } from 'react';
import { Canvas, type FabricObject } from 'fabric';
import { useHistoryStore } from '../store/useHistoryStore';
import { generateId } from '../utils/generateId';
import type { CustomFabricObject, SerializedFabricObject } from '../types';

/**
 * Hook that integrates a Fabric.js canvas with the undo/redo history system.
 * Tracks object additions, removals, and modifications for a specific page.
 *
 * @param canvas - The Fabric.js canvas instance to track
 * @param pageIndex - The 1-based page number this canvas belongs to
 */
export function useCanvasHistory(canvas: Canvas | null, pageIndex: number) {
    const { addToHistory, isUndoRedoOperation } = useHistoryStore();

    // We use a ref to track if an object is currently being modified (drag start -> drag end)
    const activeModification = useRef<{ target: string; previousData: SerializedFabricObject } | null>(null);

    useEffect(() => {
        if (!canvas) return;

        /** Ensures the object has a unique ID for tracking */
        const ensureId = (obj: CustomFabricObject): string => {
            if (!obj.id) {
                obj.set('id', generateId());
            }
            return obj.id!;
        };

        /** Handles object addition events */
        const handleAdd = (e: { target: FabricObject }) => {
            if (isUndoRedoOperation) return;
            const obj = e.target as CustomFabricObject;
            if (!obj) return;
            const id = ensureId(obj);

            addToHistory({
                type: 'add',
                pageIndex,
                objectId: id,
                data: obj.toObject(['id', 'left', 'top', 'width', 'height', 'scaleX', 'scaleY', 'fill', 'stroke', 'text']),
            });
        };

        /** Handles object removal events */
        const handleRemove = (e: { target: FabricObject }) => {
            if (isUndoRedoOperation) return;
            const obj = e.target as CustomFabricObject;
            if (!obj) return;
            const id = obj.id;

            addToHistory({
                type: 'remove',
                pageIndex,
                objectId: id!,
                data: obj.toObject(['id', 'left', 'top', 'width', 'height', 'scaleX', 'scaleY', 'fill', 'stroke', 'text']),
            });
        };

        /** Captures object state when selected for later comparison on modify */
        const handleSelectionCreated = (e: { selected: FabricObject[] }) => {
            const selected = e.selected;
            const obj = selected?.[0] as CustomFabricObject | undefined;
            if (!obj) return;
            ensureId(obj);

            // Only track single object modification for V1 simplicity
            if (selected.length === 1) {
                activeModification.current = {
                    target: obj.id!,
                    previousData: obj.toObject(['id', 'left', 'top', 'width', 'height', 'scaleX', 'scaleY', 'fill', 'stroke', 'text', 'angle'])
                };
            }
        };

        /**
         * Event handler for when an object is modified (moved, scaled, rotated).
         * Checks if the modification is valid (matched ID) and pushes to history.
         */
        const handleModified = (e: { target: FabricObject }) => {
            if (isUndoRedoOperation) return;
            const obj = e.target as CustomFabricObject;

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
