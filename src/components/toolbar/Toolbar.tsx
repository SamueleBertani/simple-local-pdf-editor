import { MousePointer2, Pen, Image as ImageIcon, Stamp, Type, Square } from 'lucide-react';
import { useRef, useState } from 'react';
import type { ToolType } from '../../store/useToolStore';
import { useToolStore } from '../../store/useToolStore';
import { STAMPS } from '../../constants/stamps';
import { clsx } from 'clsx';

export function Toolbar() {
    const { activeTool, setActiveTool, setPendingImage } = useToolStore();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showStamps, setShowStamps] = useState(false);

    const handleToolClick = (tool: ToolType) => {
        if (tool === 'image') {
            fileInputRef.current?.click();
            setShowStamps(false);
        } else if (tool === 'stamp') {
            if (activeTool === 'stamp') {
                setShowStamps(!showStamps);
            } else {
                setActiveTool('stamp');
                setShowStamps(true);
            }
        } else {
            setActiveTool(tool);
            setShowStamps(false);
        }
    };

    const ToolBtn = ({ tool, icon: Icon, label }: { tool: ToolType, icon: React.ElementType, label: string }) => (
        <button
            onClick={() => handleToolClick(tool)}
            className={clsx(
                "flex items-center gap-3 w-full p-3 rounded-lg transition-colors text-left",
                activeTool === tool
                    ? "bg-indigo-50 text-indigo-700 font-medium shadow-sm ring-1 ring-indigo-200"
                    : "text-slate-600 hover:bg-slate-50 hover:text-indigo-600"
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
            <ToolBtn tool="select" icon={MousePointer2} label="Select" />
            <ToolBtn tool="handwriting" icon={Pen} label="Handwriting" />
            <ToolBtn tool="text" icon={Type} label="Text" />
            <ToolBtn tool="rectangle" icon={Square} label="Cover" />
            <ToolBtn tool="image" icon={ImageIcon} label="Image" />
            <ToolBtn tool="stamp" icon={Stamp} label="Stamp" />

            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
            />

            {/* Stamp Popover */}
            {showStamps && (
                <div className="absolute left-full top-0 ml-4 bg-white p-2 rounded-xl shadow-xl border border-slate-200 w-48 grid grid-cols-2 gap-2 z-50">
                    {STAMPS.map(stamp => (
                        <button
                            key={stamp.id}
                            onClick={() => {
                                setPendingImage(stamp.url);
                                setActiveTool('stamp');
                                setShowStamps(false);
                            }}
                            className="p-2 hover:bg-slate-50 rounded border border-transparent hover:border-slate-200 transition-all flex flex-col items-center"
                        >
                            <img src={stamp.url} alt={stamp.label} className="w-8 h-8 opacity-80" />
                            <span className="text-[10px] text-slate-500 mt-1">{stamp.label}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
