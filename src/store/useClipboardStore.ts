import { create } from 'zustand';

interface ClipboardState {
    clipboard: any | null; // Serialized Fabric object
    lastActivePageIndex: number | null;
    setClipboard: (obj: any | null) => void;
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
