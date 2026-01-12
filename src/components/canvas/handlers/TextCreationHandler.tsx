import { useEffect } from 'react';
import { IText, Canvas, type TPointerEventInfo, type TPointerEvent, type FabricObject } from 'fabric';
import type { ToolSettings, CustomFabricObject } from '../../../types';
import { useToolStore } from '../../../store/useToolStore';

interface TextCreationHandlerProps {
    fabricCanvas: Canvas | null;
    activeTool: string;
    toolSettings: ToolSettings;
}

export const TextCreationHandler = ({
    fabricCanvas,
    activeTool,
    toolSettings
}: TextCreationHandlerProps) => {

    useEffect(() => {
        if (!fabricCanvas) return;

        const handleMouseDown = (opt: TPointerEventInfo<TPointerEvent>) => {
            if (activeTool !== 'text') return;

            // Ignore if clicking an existing non-ghost object
            const target = opt.target as CustomFabricObject | undefined;
            if (target && !target.data?.isGhost) return;

            const pointer = fabricCanvas.getPointer(opt.e);

            const text = new IText('Type here', {
                left: pointer.x, top: pointer.y,
                fontFamily: toolSettings.fontFamily,
                fontSize: toolSettings.fontSize,
                fill: toolSettings.color
            });
            fabricCanvas.add(text);
            fabricCanvas.setActiveObject(text);
            text.enterEditing();
            text.selectAll();
        };

        const handleObjectModified = (e: { target: FabricObject }) => {
            const target = e.target;
            if (!(target instanceof IText)) return;

            // Calculate effective font size after scaling, clamped to slider range
            const rawFontSize = (target.fontSize || 20) * (target.scaleX || 1);
            const effectiveFontSize = Math.round(Math.min(72, Math.max(10, rawFontSize)));

            // Save the new font size for future text objects
            useToolStore.getState().setToolSettings({ fontSize: effectiveFontSize });
        };

        fabricCanvas.on('mouse:down', handleMouseDown);
        fabricCanvas.on('object:modified', handleObjectModified);

        return () => {
            fabricCanvas.off('mouse:down', handleMouseDown);
            fabricCanvas.off('object:modified', handleObjectModified);
        };
    }, [fabricCanvas, activeTool, toolSettings]);

    return null;
};
