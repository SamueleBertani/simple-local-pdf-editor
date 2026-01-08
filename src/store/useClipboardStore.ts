import { create } from 'zustand';
import type { SerializedFabricObject } from '../types';

interface ClipboardState {
    clipboard: SerializedFabricObject | null;
    lastActivePageIndex: number | null;
    setClipboard: (obj: SerializedFabricObject | null) => void;
    setLastActivePageIndex: (index: number) => void;
}

/**
 * Store for managing clipboard state (Copy/Paste)
 */
export const useClipboardStore = create<ClipboardState>((set) => ({
    clipboard: null,
    lastActivePageIndex: null,
    setClipboard: (obj) => set({ clipboard: obj }),
    setLastActivePageIndex: (index) => set({ lastActivePageIndex: index }),
}));
