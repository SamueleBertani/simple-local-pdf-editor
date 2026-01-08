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

export function ToolSettings({ activeTool, onClose }: ToolSettingsProps) {
    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {activeTool === 'handwriting' && 'Signature Settings'}
                    {activeTool === 'text' && 'Text Settings'}
                    {activeTool === 'rectangle' && 'Cover Settings'}
                    {activeTool === 'stamp' && 'Choose Stamp'}
                </h3>
                {onClose && (
                    <button onClick={onClose} className="p-1 -mr-2 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors" title="Hide Settings">
                        <ChevronDown className="w-5 h-5" />
                    </button>
                )}
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
