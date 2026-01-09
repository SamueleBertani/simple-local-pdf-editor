import { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/Button';
import { BaseModal, ModalActions, ModalCancelButton } from '../ui/BaseModal';
import { EXPORT_QUALITY_PRESETS, DEFAULT_EXPORT_QUALITY } from '../../core/pdf/exporter';
import type { ExportQualityOptions } from '../../core/pdf/exporter';
import { COMPRESSION_QUALITY_SETTINGS, type CompressionQuality } from '../../core/pdf/compressor';
import { selectStrategy, getAvailableStrategies } from '../../core/pdf/compressionManager';

interface ExportQualityModalProps {
    isOpen: boolean;
    onClose: () => void;
    onExport: (options: ExportQualityOptions) => void;
    isProcessing: boolean;
    progress?: number;
    progressStage?: string;
}

const PRESET_KEYS = ['high', 'medium', 'low', 'extreme'] as const;
const REENCODE_QUALITY_KEYS: CompressionQuality[] = ['ebook', 'screen'];

/**
 * Progress bar component for showing compression progress.
 */
function ProgressBar({ progress, stage }: { progress: number; stage?: string }) {
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-400">
                    {stage || 'Processing...'}
                </span>
                <span className="font-medium text-indigo-600 dark:text-indigo-400">
                    {Math.round(progress)}%
                </span>
            </div>
            <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                />
            </div>
        </div>
    );
}

/**
 * Shows which compression strategy will be used based on device capabilities.
 */
function StrategyIndicator() {
    const strategy = selectStrategy();
    const strategies = getAvailableStrategies();
    const activeStrategy = strategies.find(s => s.strategy === strategy);

    const isGhostscript = strategy === 'ghostscript';

    return (
        <div className={`p-3 rounded-lg border ${
            isGhostscript
                ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800'
                : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
        }`}>
            <div className="flex items-center gap-2">
                <span className={`text-xs font-medium ${
                    isGhostscript
                        ? 'text-emerald-700 dark:text-emerald-300'
                        : 'text-slate-600 dark:text-slate-400'
                }`}>
                    {isGhostscript ? 'Ghostscript WASM' : 'JS Re-encoding'}
                </span>
                {isGhostscript && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-800 text-emerald-600 dark:text-emerald-300">
                        70-90%
                    </span>
                )}
            </div>
            <p className={`text-xs mt-1 ${
                isGhostscript
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-500 dark:text-slate-400'
            }`}>
                {activeStrategy?.description || 'Auto-selected based on device'}
            </p>
        </div>
    );
}

/**
 * Modal for selecting PDF export quality before download.
 * Offers presets for balancing file size vs visual quality.
 */
export function ExportQualityModal({ isOpen, onClose, onExport, isProcessing, progress = 0, progressStage }: ExportQualityModalProps) {
    const [selectedPreset, setSelectedPreset] = useState<string>('medium');
    const [useReencode, setUseReencode] = useState(false);
    const [reencodeQuality, setReencodeQuality] = useState<CompressionQuality>('ebook');
    const firstFocusableRef = useRef<HTMLButtonElement>(null);

    // Focus first preset button when modal opens
    useEffect(() => {
        if (isOpen) {
            firstFocusableRef.current?.focus();
        }
    }, [isOpen]);

    const selectedOptions = EXPORT_QUALITY_PRESETS[selectedPreset] || DEFAULT_EXPORT_QUALITY;

    const handleExport = () => {
        const options: ExportQualityOptions = {
            ...selectedOptions,
            useReencode,
            reencodeQuality: useReencode ? reencodeQuality : undefined
        };
        onExport(options);
    };

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={onClose}
            title="Export Quality"
            subtitle="Choose the PDF compression level"
            disableClose={isProcessing}
            ariaLabelId="export-modal-title"
        >
            {/* Standard presets */}
            <div className="space-y-3 mb-6">
                {PRESET_KEYS.map((key) => {
                    const preset = EXPORT_QUALITY_PRESETS[key];
                    const isSelected = selectedPreset === key && !useReencode;

                    return (
                        <button
                            key={key}
                            ref={key === 'high' ? firstFocusableRef : undefined}
                            onClick={() => {
                                setSelectedPreset(key);
                                setUseReencode(false);
                            }}
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

            {/* Maximum Compression (Re-encode) section */}
            <div className="mb-6">
                <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mb-3">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                        Maximum Compression
                    </p>
                </div>

                {REENCODE_QUALITY_KEYS.map((key) => {
                    const settings = COMPRESSION_QUALITY_SETTINGS[key];
                    const isSelected = useReencode && reencodeQuality === key;

                    return (
                        <button
                            key={key}
                            onClick={() => {
                                setUseReencode(true);
                                setReencodeQuality(key);
                            }}
                            className={`w-full p-4 rounded-xl border-2 text-left transition-all mb-3 ${
                                isSelected
                                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <span className={`font-semibold ${
                                    isSelected
                                        ? 'text-amber-700 dark:text-amber-300'
                                        : 'text-slate-700 dark:text-slate-200'
                                }`}>
                                    {settings.label}
                                </span>
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                    isSelected
                                        ? 'bg-amber-100 dark:bg-amber-800 text-amber-600 dark:text-amber-300'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                                }`}>
                                    {settings.dpi} DPI
                                </span>
                            </div>
                            <p className={`text-sm mt-1 ${
                                isSelected
                                    ? 'text-amber-600 dark:text-amber-400'
                                    : 'text-slate-500 dark:text-slate-400'
                            }`}>
                                {settings.description}
                            </p>
                        </button>
                    );
                })}

                {useReencode && (
                    <div className="space-y-2">
                        <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800">
                            <p className="text-xs text-amber-700 dark:text-amber-300">
                                Text will not be selectable after re-encoding. Best compression ratio (50-70%).
                            </p>
                        </div>
                        <StrategyIndicator />
                    </div>
                )}
            </div>

            <ModalActions>
                {isProcessing ? (
                    <div className="py-2">
                        <ProgressBar progress={progress} stage={progressStage} />
                    </div>
                ) : (
                    <Button
                        onClick={handleExport}
                        disabled={isProcessing}
                        className="w-full"
                    >
                        Download PDF
                    </Button>
                )}
                <ModalCancelButton onClick={onClose} disabled={isProcessing} />
            </ModalActions>
        </BaseModal>
    );
}
