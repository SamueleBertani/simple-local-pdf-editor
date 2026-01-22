import { IText } from 'fabric';
import type { FabricObject } from 'fabric';
import type { ToolSettings } from '../../types';
import type { ToolType } from '../../store/useToolStore';
import { TOOLS } from '../../constants/tools';



export function useTextGhost() {
    const createTextGhost = (activeTool: ToolType, toolSettings: ToolSettings): FabricObject | null => {
        if (activeTool !== TOOLS.TEXT) return null;

        return new IText('Type here', {
            fontFamily: toolSettings.fontFamily,
            fontSize: toolSettings.fontSize,
            fill: toolSettings.color,
            opacity: 0.5,
            evented: false,
            selectable: false,
            originX: 'left',
            originY: 'top',
            data: { isGhost: true }
        });
    };

    return { createTextGhost };
}
