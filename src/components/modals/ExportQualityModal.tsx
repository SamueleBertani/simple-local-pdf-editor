import { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/Button';
import { BaseModal, ModalActions, ModalCancelButton } from '../ui/BaseModal';
import type { ExportQualityOptions } from '../../core/pdf/exporter';
import { COMPRESSION_QUALITY_SETTINGS, type CompressionQuality } from '../../core/pdf/compressor';

interface ExportQualityModalProps {
    isOpen: boolean;
    onClose: () => void;
    onExport: (options: ExportQualityOptions) => void;
    isProcessing: boolean;
    progress?: number;
    progressStage?: string;
}

const COMPRESSION_KEYS: CompressionQuality[] = ['prepress', 'printer', 'ebook', 'screen'];

/** Options that use re-encoding (text becomes non-selectable) */
const REENCODE_OPTIONS: CompressionQuality[] = ['ebook', 'screen'];

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
 * Modal for selecting PDF export quality before download.
 * Offers 4 compression levels for balancing file size vs visual quality.
 */
export function ExportQualityModal({ isOpen, onClose, onExport, isProcessing, progress = 0, progressStage }: ExportQualityModalProps) {
    const [selectedQuality, setSelectedQuality] = useState<CompressionQuality>('printer');
    const firstFocusableRef = useRef<HTMLButtonElement>(null);

    const usesReencode = REENCODE_OPTIONS.includes(selectedQuality);

    // Focus first preset button when modal opens
    useEffect(() => {
        if (isOpen) {
            firstFocusableRef.current?.focus();
        }
    }, [isOpen]);

    const handleExport = () => {
        const settings = COMPRESSION_QUALITY_SETTINGS[selectedQuality];
        const options: ExportQualityOptions = {
            format: 'jpeg',
            quality: settings.jpegQuality,
            multiplier: settings.dpi / 72,
            label: settings.label,
            description: settings.description,
            useReencode: usesReencode,
            reencodeQuality: usesReencode ? selectedQuality : undefined
        };
        onExport(options);
    };

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={onClose}
            title="Download con Minimizzazione"
            subtitle="Scegli il livello di compressione"
            disableClose={isProcessing}
            ariaLabelId="export-modal-title"
        >
            <div className="space-y-3 mb-6">
                {COMPRESSION_KEYS.map((key, index) => {
                    const settings = COMPRESSION_QUALITY_SETTINGS[key];
                    const isSelected = selectedQuality === key;
                    const isReencodeOption = REENCODE_OPTIONS.includes(key);

                    return (
                        <button
                            key={key}
                            ref={index === 0 ? firstFocusableRef : undefined}
                            onClick={() => setSelectedQuality(key)}
                            className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                                isSelected
                                    ? isReencodeOption
                                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                                        : 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <span className={`font-semibold ${
                                    isSelected
                                        ? isReencodeOption
                                            ? 'text-amber-700 dark:text-amber-300'
                                            : 'text-indigo-700 dark:text-indigo-300'
                                        : 'text-slate-700 dark:text-slate-200'
                                }`}>
                                    {settings.label}
                                </span>
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                    isSelected
                                        ? isReencodeOption
                                            ? 'bg-amber-100 dark:bg-amber-800 text-amber-600 dark:text-amber-300'
                                            : 'bg-indigo-100 dark:bg-indigo-800 text-indigo-600 dark:text-indigo-300'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                                }`}>
                                    {isReencodeOption ? 'Flattened text' : 'Selectable text'}
                                </span>
                            </div>
                            <p className={`text-sm mt-1 ${
                                isSelected
                                    ? isReencodeOption
                                        ? 'text-amber-600 dark:text-amber-400'
                                        : 'text-indigo-600 dark:text-indigo-400'
                                    : 'text-slate-500 dark:text-slate-400'
                            }`}>
                                {settings.description}
                            </p>
                        </button>
                    );
                })}
            </div>

            {usesReencode && (
                <div className="mb-6 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800">
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                        Il testo non sarà più selezionabile dopo la compressione.
                    </p>
                </div>
            )}

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
