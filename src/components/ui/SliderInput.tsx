interface SliderInputProps {
    /** Label text displayed above the slider */
    label: string;
    /** Current value */
    value: number;
    /** Minimum value */
    min: number;
    /** Maximum value */
    max: number;
    /** Step increment */
    step: number;
    /** Callback when value changes */
    onChange: (value: number) => void;
    /** Optional function to format the displayed value */
    formatValue?: (value: number) => string;
    /** Optional variant for different styling contexts */
    variant?: 'default' | 'compact';
}

/**
 * Reusable slider input component with label and value display.
 * Used for settings like opacity, thickness, effects, etc.
 */
export function SliderInput({
    label,
    value,
    min,
    max,
    step,
    onChange,
    formatValue,
    variant = 'default'
}: SliderInputProps) {
    const displayValue = formatValue ? formatValue(value) : String(value);

    const labelClasses = variant === 'compact'
        ? 'text-xs font-medium text-slate-500 dark:text-slate-400'
        : 'text-sm font-medium text-slate-700 dark:text-slate-200';

    const valueClasses = variant === 'compact'
        ? 'text-xs text-slate-400 dark:text-slate-500'
        : 'text-xs text-slate-500 dark:text-slate-400';

    const sliderClasses = variant === 'compact'
        ? 'w-full accent-indigo-600 h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer'
        : 'w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600';

    return (
        <div>
            <div className="flex justify-between mb-1">
                <label className={labelClasses}>
                    {label}
                </label>
                <span className={valueClasses}>
                    {displayValue}
                </span>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                className={sliderClasses}
            />
        </div>
    );
}
