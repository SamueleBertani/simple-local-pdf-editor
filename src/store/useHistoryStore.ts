import { create } from 'zustand';
import { usePDFStore } from './usePDFStore';
import * as fabric from 'fabric';

export type HistoryActionType = 'add' | 'remove' | 'modify';

export interface HistoryAction {
    type: HistoryActionType;
    pageIndex: number;
    objectId?: string;
    data: any; // Serialized object
    previousData?: any; // For modify
}

interface HistoryState {
    past: HistoryAction[];
    future: HistoryAction[];
    isUndoRedoOperation: boolean; // Flag to prevent events during undo/redo

    addToHistory: (action: HistoryAction) => void;
    undo: () => void;
    redo: () => void;
    setIsUndoRedoOperation: (is: boolean) => void;
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
    past: [],
    future: [],
    isUndoRedoOperation: false,

    addToHistory: (action) => {
        if (get().isUndoRedoOperation) return;

        set((state) => ({
            past: [...state.past, action],
            future: [] // Clear future on new action
        }));
    },

    setIsUndoRedoOperation: (is) => set({ isUndoRedoOperation: is }),

    undo: async () => {
        const { past, future, setIsUndoRedoOperation } = get();
        if (past.length === 0) return;

        const action = past[past.length - 1];
        const newPast = past.slice(0, -1);

        setIsUndoRedoOperation(true);

        try {
            const canvases = usePDFStore.getState().canvases;
            const canvas = canvases[action.pageIndex];

            if (canvas) {
                await applyUndo(canvas, action);
                canvas.requestRenderAll();
            }

            set({
                past: newPast,
                future: [action, ...future]
            });
        } finally {
            // We need to wait for events to fire/settle before enabling flag? 
            // Fabric events are often synchronous.
            setIsUndoRedoOperation(false);
        }
    },

    redo: async () => {
        const { past, future, setIsUndoRedoOperation } = get();
        if (future.length === 0) return;

        const action = future[0];
        const newFuture = future.slice(1);

        setIsUndoRedoOperation(true);

        try {
            const canvases = usePDFStore.getState().canvases;
            const canvas = canvases[action.pageIndex];

            if (canvas) {
                await applyRedo(canvas, action);
                canvas.requestRenderAll();
            }

            set({
                past: [...past, action],
                future: newFuture
            });
        } finally {
            setIsUndoRedoOperation(false);
        }
    }
}));

async function applyUndo(canvas: any, action: HistoryAction) {
    if (action.type === 'add') {
        // Undo Add = Remove
        // We need to find the object. It might have a different ID reference if reloaded, 
        // but typically valid in session. Ideally we use a custom ID or verify via properties.
        // Fabric objects don't have stable IDs by default unless we set them.
        // For this V1, we try to match by strict equality if object is same instance (unlikely if page reloaded)
        // or by a custom ID we should assign on creation.

        // BETTER: We will rely on our own ID property 'id' if we start setting it.
        // For now, let's try to match by data content or assume session persistence.

        // Actually, 'add' stored the DATA. 
        // To remove, we need to find the object on canvas that matches.
        // For robust undo/redo, we SHOULD assign IDs to everything.
        // But for "lazy" implementation, we might just look for the object that was added.
        // However, we don't store the live reference in history (bad for memory).

        // STRATEGY: Find object by custom ID.
        // If we don't have IDs, this is hard.

        // Let's assume we modify useCanvasHistory to assign IDs on add.
        const obj = FindObjectById(canvas, action.objectId);
        if (obj) {
            canvas.remove(obj);
        }
    } else if (action.type === 'remove') {
        // Undo Remove = Add back
        const objects = await fabric.util.enlivenObjects([action.data], {});
        objects.forEach((o: any) => {
            canvas.add(o);
        });
    } else if (action.type === 'modify') {
        // Undo Modify = Restore previous data
        const obj = FindObjectById(canvas, action.objectId);
        if (obj && action.previousData) {
            obj.set(action.previousData);
            obj.setCoords();
        }
    }
}

async function applyRedo(canvas: any, action: HistoryAction) {
    if (action.type === 'add') {
        // Redo Add = Add again
        const objects = await fabric.util.enlivenObjects([action.data], {});
        objects.forEach((o: any) => {
            canvas.add(o);
        });
    } else if (action.type === 'remove') {
        // Redo Remove = Remove again
        const obj = FindObjectById(canvas, action.objectId);
        if (obj) {
            canvas.remove(obj);
        }
    } else if (action.type === 'modify') {
        // Redo Modify = Restore new data
        const obj = FindObjectById(canvas, action.objectId);
        if (obj) {
            obj.set(action.data);
            obj.setCoords();
        }
    }
}

function FindObjectById(canvas: any, id?: string) {
    if (!id) return null;
    // @ts-ignore
    return canvas.getObjects().find(o => o.id === id);
}
