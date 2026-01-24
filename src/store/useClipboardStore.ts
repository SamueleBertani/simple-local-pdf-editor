import { create } from 'zustand';
import type { SerializedFabricObject } from '../types';

/** Default offset for first duplication (Figma-style) */
const DEFAULT_DUPLICATE_OFFSET = { x: 10, y: 10 };

/** Context for tracking duplication to calculate dynamic offset */
interface DuplicationContext {
    /** ID of the source object that was duplicated */
    sourceObjectId: string;
    /** Position of the source object at the time of duplication */
    sourcePosition: { left: number; top: number };
    /** ID of the newly created duplicate object */
    duplicatedObjectId: string;
}

/**
 * State interface for clipboard management.
 */
interface ClipboardState {
    /** Currently copied object data, null if clipboard is empty */
    clipboard: SerializedFabricObject | null;
    /** Page index where the last interaction occurred (for paste positioning) */
    lastActivePageIndex: number | null;
    /** Current offset for duplication (Figma-style dynamic offset) */
    duplicateOffset: { x: number; y: number };
    /** Context of the last duplication for tracking movement */
    duplicationContext: DuplicationContext | null;
    /** Stores a serialized object in the clipboard */
    setClipboard: (obj: SerializedFabricObject | null) => void;
    /** Updates the last active page index */
    setLastActivePageIndex: (index: number) => void;
    /** Updates the duplicate offset */
    setDuplicateOffset: (offset: { x: number; y: number }) => void;
    /** Updates the duplication context */
    setDuplicationContext: (context: DuplicationContext | null) => void;
}

/**
 * Zustand store for managing clipboard operations across canvas pages.
 * Enables copy/paste functionality for Fabric.js objects between pages.
 */
export const useClipboardStore = create<ClipboardState>((set) => ({
    clipboard: null,
    lastActivePageIndex: null,
    duplicateOffset: DEFAULT_DUPLICATE_OFFSET,
    duplicationContext: null,
    setClipboard: (obj) => set({ clipboard: obj }),
    setLastActivePageIndex: (index) => set({ lastActivePageIndex: index }),
    setDuplicateOffset: (offset) => set({ duplicateOffset: offset }),
    setDuplicationContext: (context) => set({ duplicationContext: context }),
}));
