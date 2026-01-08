import { HandwritingInput } from './HandwritingInput';
import { TextInput } from './TextInput';
import { RectangleInput } from './RectangleInput';
import { StampInput } from './StampInput';
import type { ToolType } from '../../store/useToolStore';
import { ChevronDown } from 'lucide-react';

interface ToolSettingsProps {
    activeTool: ToolType;
    onClose?: () => void;
}

const toolComponents: Record<string, React.FC> = {
    handwriting: HandwritingInput,
    text: TextInput,
    rectangle: RectangleInput,
    stamp: StampInput,
};

const toolTitles: Record<string, string> = {
    handwriting: 'Signature Settings',
    text: 'Text Settings',
    rectangle: 'Cover Settings',
    stamp: 'Choose Stamp',
};

export function ToolSettings({ activeTool, onClose }: ToolSettingsProps) {
    const ActiveComponent = toolComponents[activeTool];

    if (!ActiveComponent) return null;

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {toolTitles[activeTool] || 'Settings'}
                </h3>
                {onClose && (
                    <button onClick={onClose} className="p-1 -mr-2 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors" title="Hide Settings">
                        <ChevronDown className="w-5 h-5" />
                    </button>
                )}
            </div>
            <div className="flex-1 overflow-y-auto p-4">
                <ActiveComponent />
            </div>
        </div>
    );
}
