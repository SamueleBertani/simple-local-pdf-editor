import { create } from 'zustand';
import type { SerializedFabricObject } from '../types';

/**
 * State interface for clipboard management.
 */
interface ClipboardState {
    /** Currently copied object data, null if clipboard is empty */
    clipboard: SerializedFabricObject | null;
    /** Page index where the last interaction occurred (for paste positioning) */
    lastActivePageIndex: number | null;
    /** Stores a serialized object in the clipboard */
    setClipboard: (obj: SerializedFabricObject | null) => void;
    /** Updates the last active page index */
    setLastActivePageIndex: (index: number) => void;
}

/**
 * Zustand store for managing clipboard operations across canvas pages.
 * Enables copy/paste functionality for Fabric.js objects between pages.
 */
export const useClipboardStore = create<ClipboardState>((set) => ({
    clipboard: null,
    lastActivePageIndex: null,
    setClipboard: (obj) => set({ clipboard: obj }),
    setLastActivePageIndex: (index) => set({ lastActivePageIndex: index }),
}));
