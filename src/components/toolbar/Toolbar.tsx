import { MousePointer2, Pen, Image as ImageIcon, Stamp, Type, Square } from 'lucide-react';
import { useRef } from 'react';
import type { ToolType } from '../../store/useToolStore';
import { useToolStore } from '../../store/useToolStore';
import { clsx } from 'clsx';

/**
 * Main toolbar for the editor.
 * Houses tools for editing (Handwriting, Text, Shapes) and the Image uploader.
 * 
 * Manages the active tool state in `useToolStore`.
 */
interface ToolbarProps {
    orientation?: 'vertical' | 'horizontal';
}

export function Toolbar({ orientation = 'vertical' }: ToolbarProps) {
    const { activeTool, setActiveTool, setPendingImage, toggleSettings } = useToolStore();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleToolClick = (tool: ToolType) => {
        if (tool === 'image') {
            fileInputRef.current?.click();
        } else {
            if (activeTool === tool) {
                // If clicking active tool, toggle settings drawer
                toggleSettings();
            } else {
                setActiveTool(tool);
            }
        }
    };

    const ToolBtn = ({ tool, icon: Icon, label, title }: { tool: ToolType, icon: React.ElementType, label: string, title?: string }) => (
        <button
            onClick={() => handleToolClick(tool)}
            title={title}
            className={clsx(
                "flex items-center gap-3 p-3 rounded-lg transition-colors text-left shrink-0",
                orientation === 'vertical' ? "w-full" : "flex-1 justify-center flex-col gap-1 p-2",
                activeTool === tool
                    ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 font-medium shadow-sm ring-1 ring-indigo-200 dark:ring-indigo-800"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400"
            )}
        >
            <Icon className={clsx("w-5 h-5", activeTool === tool && "fill-indigo-100")} />
            <span className={clsx("text-sm", orientation === 'horizontal' && "text-[10px]")}>{label}</span>
        </button>
    );

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (f) => {
                setPendingImage(f.target?.result as string);
                setActiveTool('image');
            };
            reader.readAsDataURL(file);
        }
        if (e.target) e.target.value = '';
    };

    return (
        <div className={clsx(
            "flex w-full px-4 relative",
            orientation === 'vertical' ? "flex-col gap-2" : "flex-row gap-2 overflow-x-auto no-scrollbar py-2"
        )}>
            <ToolBtn tool="select" icon={MousePointer2} label="Select" title="Select (S)" />
            <ToolBtn tool="handwriting" icon={Pen} label="Sign" title="Handwriting (H)" />
            <ToolBtn tool="text" icon={Type} label="Text" title="Text (T)" />
            <ToolBtn tool="rectangle" icon={Square} label="Cover" title="Cover (R)" />
            <ToolBtn tool="image" icon={ImageIcon} label="Image" title="Image (I)" />
            <ToolBtn tool="stamp" icon={Stamp} label="Stamp" title="Stamp (P)" />

            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
            />
        </div>
    );
}
