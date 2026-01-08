import { create } from 'zustand';
import type { ToolSettings } from '../types';

export type ToolType = 'select' | 'handwriting' | 'image' | 'stamp' | 'text' | 'rectangle';

/** Tools that have a settings panel */
const TOOLS_WITH_SETTINGS: ToolType[] = ['handwriting', 'text', 'rectangle', 'stamp'];

/** Check if a tool has settings */
export const hasToolSettings = (tool: ToolType): boolean => TOOLS_WITH_SETTINGS.includes(tool);

interface ToolState {
    activeTool: ToolType;
    pendingImage: string | null;
    toolSettings: ToolSettings;
    setActiveTool: (tool: ToolType) => void;
    setPendingImage: (image: string | null) => void;
    setToolSettings: (settings: Partial<ToolState['toolSettings']>) => void;

    // Stamp scaling persistence
    stampScales: Record<string, { scaleX: number; scaleY: number }>;
    setStampScale: (url: string, scale: { scaleX: number; scaleY: number }) => void;

    // Mobile Settings Drawer State
    isSettingsOpen: boolean;
    setSettingsOpen: (isOpen: boolean) => void;
    toggleSettings: () => void;
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
    isSettingsOpen: false, // Default closed

    setActiveTool: (tool) => set({ activeTool: tool, isSettingsOpen: true }), // Auto-open settings on tool change
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
    setSettingsOpen: (isOpen) => set({ isSettingsOpen: isOpen }),
    toggleSettings: () => set((state) => ({ isSettingsOpen: !state.isSettingsOpen })),
}));
