import { MousePointer2, Pen, Image as ImageIcon, Stamp, Type, Square } from 'lucide-react';
import { useRef } from 'react';
import type { ToolType } from '../../store/useToolStore';
import { useToolStore } from '../../store/useToolStore';
import { clsx } from 'clsx';

export function Toolbar() {
    const { activeTool, setActiveTool, setPendingImage } = useToolStore();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleToolClick = (tool: ToolType) => {
        if (tool === 'image') {
            fileInputRef.current?.click();
        } else {
            setActiveTool(tool);
        }
    };

    const ToolBtn = ({ tool, icon: Icon, label, title }: { tool: ToolType, icon: React.ElementType, label: string, title?: string }) => (
        <button
            onClick={() => handleToolClick(tool)}
            title={title} // Add title attribute
            className={clsx(
                "flex items-center gap-3 w-full p-3 rounded-lg transition-colors text-left",
                activeTool === tool
                    ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 font-medium shadow-sm ring-1 ring-indigo-200 dark:ring-indigo-800"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400"
            )}
        >
            <Icon className={clsx("w-5 h-5", activeTool === tool && "fill-indigo-100")} />
            <span className="text-sm">{label}</span>
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
        <div className="flex flex-col gap-2 w-full px-4 relative">
            <ToolBtn tool="select" icon={MousePointer2} label="Select" title="Select (S)" />
            <ToolBtn tool="handwriting" icon={Pen} label="Handwriting" title="Handwriting (H)" />
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
