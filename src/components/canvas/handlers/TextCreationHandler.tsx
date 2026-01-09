import { useEffect } from 'react';
import { IText, Canvas, type TPointerEventInfo, type TPointerEvent } from 'fabric';
import type { ToolSettings, CustomFabricObject } from '../../../types';

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

        fabricCanvas.on('mouse:down', handleMouseDown);

        return () => {
            fabricCanvas.off('mouse:down', handleMouseDown);
        };
    }, [fabricCanvas, activeTool, toolSettings]);

    return null;
};
