import { ToolSettings } from '../toolbar/ToolSettings';
import type { ToolType } from '../../store/useToolStore';
import { Z_INDEX } from '../../constants/zIndex';

interface SettingsSidebarProps {
    activeTool: ToolType;
    visible: boolean;
}

export function SettingsSidebar({ activeTool, visible }: SettingsSidebarProps) {
    if (!visible) return null;

    return (
        <div
            className="w-80 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col shrink-0 h-full animate-in slide-in-from-right-full duration-300 ease-in-out relative"
            style={{ zIndex: Z_INDEX.UI.SETTINGS_DRAWER }}
        >
            <ToolSettings activeTool={activeTool} />
        </div>
    );
}
