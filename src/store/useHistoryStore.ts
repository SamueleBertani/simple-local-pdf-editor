import { create } from 'zustand';
import { usePDFStore } from './usePDFStore';
import * as fabric from 'fabric';
import { SerializedFabricObject } from '../types';

export type ActionType = 'add' | 'remove' | 'modify';

export interface HistoryAction {
    type: ActionType;
    pageIndex: number;
    objectId: string;
    data: SerializedFabricObject; // Serialized object
    previousData?: SerializedFabricObject; // For modify
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

// Helper to find an object on a canvas by its custom ID property
function FindObjectById(canvas: any, id?: string) {
    if (!id) return null;
    // @ts-ignore
    return canvas.getObjects().find(o => o.id === id);
}

// ... existing applies ...
async function applyUndo(canvas: any, action: HistoryAction) {
    if (action.type === 'add') {
        const obj = FindObjectById(canvas, action.objectId);
        if (obj) {
            canvas.remove(obj);
        }
    } else if (action.type === 'remove') {
        const objects = await fabric.util.enlivenObjects([action.data], {});
        objects.forEach((o: any) => {
            canvas.add(o);
        });
    } else if (action.type === 'modify') {
        const obj = FindObjectById(canvas, action.objectId);
        if (obj && action.previousData) {
            obj.set(action.previousData);
            obj.setCoords();
        }
    }
}

async function applyRedo(canvas: any, action: HistoryAction) {
    if (action.type === 'add') {
        const objects = await fabric.util.enlivenObjects([action.data], {});
        objects.forEach((o: any) => {
            canvas.add(o);
        });
    } else if (action.type === 'remove') {
        const obj = FindObjectById(canvas, action.objectId);
        if (obj) {
            canvas.remove(obj);
        }
    } else if (action.type === 'modify') {
        const obj = FindObjectById(canvas, action.objectId);
        if (obj) {
            obj.set(action.data);
            obj.setCoords();
        }
    }
}
