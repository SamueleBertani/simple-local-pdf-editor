import { create } from 'zustand';

export type ToolType = 'select' | 'handwriting' | 'image' | 'stamp';

interface ToolState {
    activeTool: ToolType;
    pendingImage: string | null;
    toolSettings: {
        color: string;
        width: number;
        opacity: number;
    };
    setActiveTool: (tool: ToolType) => void;
    setPendingImage: (image: string | null) => void;
    setToolSettings: (settings: Partial<ToolState['toolSettings']>) => void;
}

export const useToolStore = create<ToolState>((set) => ({
    activeTool: 'select',
    pendingImage: null,
    toolSettings: {
        color: '#000000',
        width: 2,
        opacity: 1,
    },
    setActiveTool: (tool) => set({ activeTool: tool }),
    setPendingImage: (image) => set({ pendingImage: image }),
    setToolSettings: (settings) =>
        set((state) => ({ toolSettings: { ...state.toolSettings, ...settings } })),
}));
