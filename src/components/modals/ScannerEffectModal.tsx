import { useEffect, useRef, useState } from 'react';
import { Button } from '../ui/Button';
import { DEFAULT_SCANNER_OPTIONS, applyScannerEffect } from '../../core/image/scannerEffect';
import type { ScannerOptions } from '../../core/image/scannerEffect';

interface ScannerEffectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onDownload: (options: ScannerOptions) => void;
    previewCanvas: HTMLCanvasElement | null;
    isProcessing: boolean;
}

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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex overflow-hidden">
                {/* Preview Area */}
                <div className="flex-1 bg-slate-100 p-8 flex items-center justify-center overflow-auto relative">
                    <div className="shadow-lg bg-white relative">
                        <canvas
                            ref={canvasRef}
                            className="max-h-[600px] max-w-full object-contain"
                        />
                    </div>
                </div>

                {/* Settings Panel */}
                <div className="w-80 bg-white border-l border-slate-200 p-6 flex flex-col gap-6">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Scanner Studio</h2>
                        <p className="text-sm text-slate-500">Make it look scanned.</p>
                    </div>

                    <div className="space-y-4 flex-1 overflow-y-auto pr-2">
                        {/* Toggles */}
                        <div className="flex gap-4">
                            <div className="flex-1 flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                <label className="text-sm font-medium text-slate-700">Grayscale</label>
                                <input
                                    type="checkbox"
                                    checked={options.grayscale}
                                    onChange={e => setOptions({ ...options, grayscale: e.target.checked })}
                                    className="h-5 w-5 accent-indigo-600"
                                />
                            </div>
                        </div>

                        {/* Noise Slider */}
                        <div>
                            <div className="flex justify-between mb-1">
                                <label className="text-sm font-medium text-slate-700">Noise</label>
                                <span className="text-xs text-slate-500">{Math.round(options.noise * 100)}%</span>
                            </div>
                            <input
                                type="range" min="0" max="0.5" step="0.01"
                                value={options.noise}
                                onChange={e => setOptions({ ...options, noise: parseFloat(e.target.value) })}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                        </div>

                        {/* Tilt Slider */}
                        <div>
                            <div className="flex justify-between mb-1">
                                <label className="text-sm font-medium text-slate-700">Tilt</label>
                                <span className="text-xs text-slate-500">{options.tilt.toFixed(1)}°</span>
                            </div>
                            <input
                                type="range" min="-10" max="10" step="0.5"
                                value={options.tilt}
                                onChange={e => setOptions({ ...options, tilt: parseFloat(e.target.value) })}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                        </div>

                        {/* Shadow Slider */}
                        <div>
                            <div className="flex justify-between mb-1">
                                <label className="text-sm font-medium text-slate-700">Shadow</label>
                                <span className="text-xs text-slate-500">{options.shadow}px</span>
                            </div>
                            <input
                                type="range" min="-1" max="5" step="0.5"
                                value={options.shadow}
                                onChange={e => setOptions({ ...options, shadow: parseFloat(e.target.value) })}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                        </div>

                        {/* Distortion Slider */}
                        <div>
                            <div className="flex justify-between mb-1">
                                <label className="text-sm font-medium text-slate-700">Distortion</label>
                                <span className="text-xs text-slate-500">{options.distortion?.toFixed(1) || 0}</span>
                            </div>
                            <input
                                type="range" min="0" max="10" step="0.5"
                                value={options.distortion || 0}
                                onChange={e => setOptions({ ...options, distortion: parseFloat(e.target.value) })}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                        </div>

                        {/* Chromatic Aberration Slider */}
                        <div>
                            <div className="flex justify-between mb-1">
                                <label className="text-sm font-medium text-slate-700">Chromatic Aberration</label>
                                <span className="text-xs text-slate-500">{options.chromaticAberration?.toFixed(1) || 0}px</span>
                            </div>
                            <input
                                type="range" min="0" max="5" step="0.5"
                                value={options.chromaticAberration || 0}
                                onChange={e => setOptions({ ...options, chromaticAberration: parseFloat(e.target.value) })}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                        </div>

                        {/* Contrast Slider */}
                        <div>
                            <div className="flex justify-between mb-1">
                                <label className="text-sm font-medium text-slate-700">Contrast</label>
                                <span className="text-xs text-slate-500">{options.contrast.toFixed(1)}x</span>
                            </div>
                            <input
                                type="range" min="0.5" max="2" step="0.1"
                                value={options.contrast}
                                onChange={e => setOptions({ ...options, contrast: parseFloat(e.target.value) })}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                        </div>

                        {/* Brightness Slider */}
                        <div>
                            <div className="flex justify-between mb-1">
                                <label className="text-sm font-medium text-slate-700">Brightness</label>
                                <span className="text-xs text-slate-500">{options.brightness.toFixed(1)}x</span>
                            </div>
                            <input
                                type="range" min="0.5" max="2" step="0.1"
                                value={options.brightness}
                                onChange={e => setOptions({ ...options, brightness: parseFloat(e.target.value) })}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
                        <Button
                            onClick={() => onDownload(options)}
                            disabled={isProcessing}
                            className="w-full"
                        >
                            {isProcessing ? 'Processing...' : 'Download Scan'}
                        </Button>
                        <button
                            onClick={onClose}
                            className="w-full py-2 text-sm text-slate-500 hover:text-slate-800"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
