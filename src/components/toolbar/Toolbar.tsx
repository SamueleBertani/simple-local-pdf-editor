import { MousePointer2, Image as ImageIcon, Stamp, PenTool } from 'lucide-react';
import { useRef, useState } from 'react';
import type { ToolType } from '../../store/useToolStore';
import { useToolStore } from '../../store/useToolStore';
import { clsx } from 'clsx';
import { STAMPS } from '../../constants/stamps';

export function Toolbar() {
    const { activeTool, setActiveTool, setPendingImage } = useToolStore();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showStamps, setShowStamps] = useState(false);

    const handleToolClick = (toolId: ToolType) => {
        if (toolId === 'image') {
            fileInputRef.current?.click();
            setShowStamps(false);
        } else if (toolId === 'stamp') {
            setShowStamps(!showStamps);
            // Don't set active tool immediately, wait for selection
        } else {
            setActiveTool(toolId);
            setShowStamps(false);
        }
    };

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target?.result as string;
                setPendingImage(result);
                setActiveTool('image');
            };
            reader.readAsDataURL(file);
        }
        if (event.target) event.target.value = '';
    };

    const handleStampSelect = (url: string) => {
        setPendingImage(url);
        setActiveTool('image'); // Use image tool logic for placement
        setShowStamps(false);
    };

    const tools: { id: ToolType; icon: React.ElementType; label: string }[] = [
        { id: 'select', icon: MousePointer2, label: 'Select' },
        { id: 'handwriting', icon: PenTool, label: 'Handwriting' },
        { id: 'image', icon: ImageIcon, label: 'Image' },
        { id: 'stamp', icon: Stamp, label: 'Stamp' },
    ];

    return (
        <div className="flex flex-col gap-2 w-full p-2 relative">
            <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleImageUpload}
            />

            {tools.map((tool) => {
                const Icon = tool.icon;
                const isActive = activeTool === tool.id || (tool.id === 'stamp' && showStamps);

                return (
                    <button
                        key={tool.id}
                        onClick={() => handleToolClick(tool.id)}
                        className={clsx(
                            "w-12 h-12 flex flex-col items-center justify-center rounded-xl transition-all duration-200",
                            isActive
                                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-105"
                                : "bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 border border-slate-200"
                        )}
                        title={tool.label}
                    >
                        <Icon className="w-5 h-5 mb-0.5" />
                        <span className="text-[9px] font-medium">{tool.label}</span>
                    </button>
                );
            })}

            {/* Stamp Popover */}
            {showStamps && (
                <div className="absolute left-full top-32 ml-4 bg-white p-3 rounded-xl shadow-xl border border-slate-200 w-48 z-50 animate-in fade-in slide-in-from-left-2">
                    <h3 className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Select Stamp</h3>
                    <div className="grid grid-cols-1 gap-2">
                        {STAMPS.map(stamp => (
                            <button
                                key={stamp.id}
                                onClick={() => handleStampSelect(stamp.url)}
                                className="flex items-center p-2 rounded hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors"
                            >
                                <img src={stamp.url} alt={stamp.label} className="h-8 w-auto object-contain" />
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
