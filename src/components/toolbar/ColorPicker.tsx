import { memo } from 'react';
import { clsx } from 'clsx';
import { Check } from 'lucide-react';

interface ColorPickerProps {
    colors: readonly string[];
    value: string;
    onChange: (color: string) => void;
    label?: string;
}

export const ColorPicker = memo(function ColorPicker({ colors, value, onChange, label = "Color" }: ColorPickerProps) {
    return (
        <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">{label}</label>
            <div className="flex gap-2 flex-wrap">
                {colors.map((c) => (
                    <button
                        key={c}
                        onClick={() => onChange(c)}
                        className={clsx(
                            "w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center",
                            value === c
                                ? "border-indigo-600 scale-110 ring-2 ring-indigo-200 dark:ring-indigo-900"
                                : "border-slate-200 dark:border-slate-700 hover:scale-105"
                        )}
                        style={{ backgroundColor: c }}
                        title={c}
                        aria-label={`Select color ${c}`}
                        aria-pressed={value === c}
                    >
                        {value === c && (
                            <Check className={clsx("w-4 h-4",
                                c === '#FFFFFF' ? "text-indigo-600" : "text-white drop-shadow-sm"
                            )} />
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
});
