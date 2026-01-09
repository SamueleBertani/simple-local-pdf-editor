import { useEffect, useRef, useState } from 'react';
import { Button } from '../ui/Button';
import { BaseModal, ModalCancelButton } from '../ui/BaseModal';
import { DEFAULT_SCANNER_OPTIONS, applyScannerEffect } from '../../core/image/scannerEffect';
import type { ScannerOptions } from '../../core/image/scannerEffect';

interface ScannerEffectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onDownload: (options: ScannerOptions) => void;
    previewCanvas: HTMLCanvasElement | null;
    isProcessing: boolean;
}

interface SliderConfig {
    key: keyof ScannerOptions;
    label: string;
    min: number;
    max: number;
    step: number;
    format: (value: number) => string;
}

const SLIDER_CONFIGS: SliderConfig[] = [
    { key: 'noise', label: 'Noise', min: 0, max: 0.5, step: 0.01, format: (v) => `${Math.round(v * 100)}%` },
    { key: 'tilt', label: 'Tilt', min: -10, max: 10, step: 0.5, format: (v) => `${v.toFixed(1)}°` },
    { key: 'shadow', label: 'Shadow', min: -1, max: 5, step: 0.5, format: (v) => `${v}px` },
    { key: 'distortion', label: 'Distortion', min: 0, max: 10, step: 0.5, format: (v) => (v || 0).toFixed(1) },
    { key: 'chromaticAberration', label: 'Chromatic Aberration', min: 0, max: 5, step: 0.5, format: (v) => `${(v || 0).toFixed(1)}px` },
    { key: 'contrast', label: 'Contrast', min: 0.5, max: 2, step: 0.1, format: (v) => `${v.toFixed(1)}x` },
    { key: 'brightness', label: 'Brightness', min: 0.5, max: 2, step: 0.1, format: (v) => `${v.toFixed(1)}x` },
];

/**
 * Reusable slider input component for scanner effect settings.
 */
function EffectSlider({
    config,
    value,
    onChange
}: {
    config: SliderConfig;
    value: number;
    onChange: (value: number) => void;
}) {
    return (
        <div>
            <div className="flex justify-between mb-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {config.label}
                </label>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                    {config.format(value)}
                </span>
            </div>
            <input
                type="range"
                min={config.min}
                max={config.max}
                step={config.step}
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
        </div>
    );
}

/**
 * Modal component ("Scanner Studio") that allows users to configure and preview scanner effects.
 * Provides real-time preview of the effect applied to the first page of the PDF.
 */
export function ScannerEffectModal({ isOpen, onClose, onDownload, previewCanvas, isProcessing }: ScannerEffectModalProps) {
    const [options, setOptions] = useState<ScannerOptions>(DEFAULT_SCANNER_OPTIONS);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Apply effect to preview
    useEffect(() => {
        if (!isOpen || !previewCanvas || !canvasRef.current) return;

        let active = true;
        const renderPreview = async () => {
            const processed = await applyScannerEffect(previewCanvas, options);
            if (!active || !canvasRef.current) return;

            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
                canvasRef.current.width = processed.width;
                canvasRef.current.height = processed.height;
                ctx.drawImage(processed, 0, 0);
            }
        };

        renderPreview();
        return () => { active = false; };
    }, [isOpen, previewCanvas, options]);

    const updateOption = (key: keyof ScannerOptions, value: number | boolean) => {
        setOptions(prev => ({ ...prev, [key]: value }));
    };

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={onClose}
            title="Scanner Studio"
            maxWidth="max-w-4xl"
            customLayout
            ariaLabelId="scanner-modal-title"
        >
            {/* Preview Area */}
            <div className="flex-1 bg-slate-100 dark:bg-slate-950 p-8 flex items-center justify-center overflow-auto relative">
                <div className="shadow-lg bg-white relative">
                    <canvas
                        ref={canvasRef}
                        className="max-h-[600px] max-w-full object-contain"
                    />
                </div>
            </div>

            {/* Settings Panel */}
            <div className="w-80 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-6 flex flex-col gap-6">
                <div>
                    <h2 id="scanner-modal-title" className="text-xl font-bold text-slate-800 dark:text-slate-100">
                        Scanner Studio
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Make it look scanned.
                    </p>
                </div>

                <div className="space-y-4 flex-1 overflow-y-auto pr-2">
                    {/* Grayscale Toggle */}
                    <div className="flex gap-4">
                        <div className="flex-1 flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                Grayscale
                            </label>
                            <input
                                type="checkbox"
                                checked={options.grayscale}
                                onChange={e => updateOption('grayscale', e.target.checked)}
                                className="h-5 w-5 accent-indigo-600"
                            />
                        </div>
                    </div>

                    {/* Effect Sliders */}
                    {SLIDER_CONFIGS.map(config => (
                        <EffectSlider
                            key={config.key}
                            config={config}
                            value={(options[config.key] as number) ?? 0}
                            onChange={(value) => updateOption(config.key, value)}
                        />
                    ))}
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-3">
                    <Button
                        onClick={() => onDownload(options)}
                        disabled={isProcessing}
                        className="w-full"
                    >
                        {isProcessing ? 'Processing...' : 'Download Scan'}
                    </Button>
                    <ModalCancelButton onClick={onClose} />
                </div>
            </div>
        </BaseModal>
    );
}
