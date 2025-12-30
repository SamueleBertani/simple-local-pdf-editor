import { HandwritingInput } from '../toolbar/HandwritingInput';
import { TextInput } from '../toolbar/TextInput';
import { RectangleInput } from '../toolbar/RectangleInput';
import { StampInput } from '../toolbar/StampInput';
import type { ToolType } from '../../store/useToolStore';

interface SettingsSidebarProps {
    activeTool: ToolType;
    visible: boolean;
}

export function SettingsSidebar({ activeTool, visible }: SettingsSidebarProps) {
    if (!visible) return null;

    return (
        <div className="w-80 bg-white border-l border-slate-200 flex flex-col z-10 shrink-0 h-full animate-in slide-in-from-right-10 duration-200 relative">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-sm font-semibold text-slate-900">
                    {activeTool === 'handwriting' && 'Signature Settings'}
                    {activeTool === 'text' && 'Text Settings'}
                    {activeTool === 'rectangle' && 'Cover Settings'}
                    {activeTool === 'stamp' && 'Choose Stamp'}
                </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
                <HandwritingInput />
                <TextInput />
                <RectangleInput />
                <StampInput />
            </div>
        </div>
    );
}
