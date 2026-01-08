import { useState } from 'react';
import { Button } from '../ui/Button';
import { EXPORT_QUALITY_PRESETS, DEFAULT_EXPORT_QUALITY } from '../../core/pdf/exporter';
import type { ExportQualityOptions } from '../../core/pdf/exporter';

interface ExportQualityModalProps {
    isOpen: boolean;
    onClose: () => void;
    onExport: (options: ExportQualityOptions) => void;
    isProcessing: boolean;
}

const PRESET_KEYS = ['high', 'medium', 'low'] as const;

/**
 * Modal for selecting PDF export quality before download.
 * Offers presets for balancing file size vs visual quality.
 */
export function ExportQualityModal({ isOpen, onClose, onExport, isProcessing }: ExportQualityModalProps) {
    const [selectedPreset, setSelectedPreset] = useState<string>('high');

    if (!isOpen) return null;

    const selectedOptions = EXPORT_QUALITY_PRESETS[selectedPreset] || DEFAULT_EXPORT_QUALITY;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 animate-in fade-in zoom-in-95 duration-200">
                <div className="mb-6">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Qualità Export</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Scegli il livello di compressione del PDF
                    </p>
                </div>

                <div className="space-y-3 mb-6">
                    {PRESET_KEYS.map((key) => {
                        const preset = EXPORT_QUALITY_PRESETS[key];
                        const isSelected = selectedPreset === key;

                        return (
                            <button
                                key={key}
                                onClick={() => setSelectedPreset(key)}
                                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                                    isSelected
                                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className={`font-semibold ${
                                        isSelected
                                            ? 'text-indigo-700 dark:text-indigo-300'
                                            : 'text-slate-700 dark:text-slate-200'
                                    }`}>
                                        {preset.label}
                                    </span>
                                    <span className={`text-xs px-2 py-1 rounded-full ${
                                        isSelected
                                            ? 'bg-indigo-100 dark:bg-indigo-800 text-indigo-600 dark:text-indigo-300'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                                    }`}>
                                        {preset.format.toUpperCase()}
                                        {preset.format === 'jpeg' && ` ${Math.round(preset.quality * 100)}%`}
                                    </span>
                                </div>
                                <p className={`text-sm mt-1 ${
                                    isSelected
                                        ? 'text-indigo-600 dark:text-indigo-400'
                                        : 'text-slate-500 dark:text-slate-400'
                                }`}>
                                    {preset.description}
                                </p>
                            </button>
                        );
                    })}
                </div>

                <div className="flex flex-col gap-3">
                    <Button
                        onClick={() => onExport(selectedOptions)}
                        disabled={isProcessing}
                        className="w-full"
                    >
                        {isProcessing ? 'Esportazione...' : 'Scarica PDF'}
                    </Button>
                    <button
                        onClick={onClose}
                        className="w-full py-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                    >
                        Annulla
                    </button>
                </div>
            </div>
        </div>
    );
}
