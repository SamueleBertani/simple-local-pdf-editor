import { useEffect } from 'react';
import { useToolStore, type ToolType } from '../../store/useToolStore';
import { isInputFocused } from '../../utils/keyboard';

const TOOL_SHORTCUTS: Record<string, ToolType> = {
    s: 'select',
    h: 'handwriting',
    t: 'text',
    r: 'rectangle',
    i: 'image',
    p: 'stamp',
};

export function useToolShortcuts() {
    const { setActiveTool } = useToolStore();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isInputFocused(e)) return;
            if (e.metaKey || e.ctrlKey || e.altKey) return;

            const key = e.key.toLowerCase();
            const tool = TOOL_SHORTCUTS[key];

            if (tool) {
                e.preventDefault();

                if (tool === 'image') {
                    // Trigger file input click for image tool
                    const fileInput = document.querySelector<HTMLInputElement>('input[type="file"][accept*="image"]');
                    fileInput?.click();
                } else {
                    setActiveTool(tool);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [setActiveTool]);
}
