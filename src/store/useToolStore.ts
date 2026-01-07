import { create } from 'zustand';

export type ToolType = 'select' | 'handwriting' | 'image' | 'stamp' | 'text' | 'rectangle';

interface ToolState {
    activeTool: ToolType;
    pendingImage: string | null;
    toolSettings: {
        color: string;
        width: number;
        opacity: number;
        fontSize: number;
        fontFamily: string;
    };
    setActiveTool: (tool: ToolType) => void;
    setPendingImage: (image: string | null) => void;
    setToolSettings: (settings: Partial<ToolState['toolSettings']>) => void;

    // Stamp scaling persistence
    stampScales: Record<string, { scaleX: number; scaleY: number }>;
    setStampScale: (url: string, scale: { scaleX: number; scaleY: number }) => void;
}

/**
 * Store for managing the active tool (select, draw, stamp, etc.) and its settings.
 */
export const useToolStore = create<ToolState>((set) => ({
    activeTool: 'select',
    pendingImage: null,
    toolSettings: {
        color: '#000000',
        width: 2,
        opacity: 1,
        fontSize: 20,
        fontFamily: 'sans-serif',
    },
    stampScales: {},
    setActiveTool: (tool) => set({ activeTool: tool }),
    setPendingImage: (image) => set({ pendingImage: image }),
    setToolSettings: (settings) =>
        set((state) => ({ toolSettings: { ...state.toolSettings, ...settings } })),
    setStampScale: (url, scale) =>
        set((state) => ({
            stampScales: {
                ...state.stampScales,
                [url]: scale
            }
        })),
}));
