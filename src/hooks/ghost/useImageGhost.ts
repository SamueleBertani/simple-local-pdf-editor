import { FabricImage } from 'fabric';
import type { FabricObject } from 'fabric';
import type { ToolType } from '../../store/useToolStore';
import { useToolStore } from '../../store/useToolStore';
import { TOOLS } from '../../constants/tools';

export function useImageGhost() {
    const createImageGhost = async (activeTool: ToolType, pendingImage: string | null): Promise<FabricObject | null> => {
        const allowedTools: ToolType[] = [TOOLS.IMAGE, TOOLS.STAMP, TOOLS.HANDWRITING];
        if (!allowedTools.includes(activeTool) || !pendingImage) return null;

        const img = await FabricImage.fromURL(pendingImage);

        // Access store state directly or pass as prop - accessing state here for cleaner signature
        const storedScale = activeTool === TOOLS.STAMP ? useToolStore.getState().stampScales[pendingImage] : null;

        img.set({
            opacity: 0.5,
            evented: false,
            selectable: false,
            originX: 'center',
            originY: 'center',
            scaleX: storedScale?.scaleX ?? 0.35,
            scaleY: storedScale?.scaleY ?? 0.35,
            data: { isGhost: true }
        });

        return img;
    };

    return { createImageGhost };
}
