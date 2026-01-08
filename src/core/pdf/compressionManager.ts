/**
 * Unified PDF Compression Manager
 *
 * Provides a single entry point for PDF compression that automatically
 * selects the best compression strategy based on device capabilities.
 *
 * Strategy Selection:
 * - Desktop (>4GB RAM): Ghostscript WASM (70-90% compression)
 * - Mobile/Low-end: JS Re-encoding (50-70% compression)
 * - Fallback: Basic JPEG compression (30-50% compression)
 */

import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { Canvas } from 'fabric';
import { canUseGhostscriptWASM, getDeviceCapabilities } from './ghostscript';
import { compressWithWorker, type CompressionProgress } from './ghostscript/workerClient';
import type { GhostscriptPreset } from './ghostscript/compressor';
import { reencodeCompression, type CompressionQuality } from './compressor';
import { exportToPdf, type ExportQualityOptions } from './exporter';

/**
 * Compression strategy types
 */
export type CompressionStrategy = 'ghostscript' | 'reencode' | 'basic';

/**
 * Unified compression level
 */
export type CompressionLevel = 'light' | 'medium' | 'heavy' | 'extreme';

/**
 * Unified compression options
 */
export interface UnifiedCompressionOptions {
    /** Desired compression level */
    level: CompressionLevel;
    /** Force a specific strategy (optional, auto-selected if not specified) */
    forceStrategy?: CompressionStrategy;
    /** Convert to grayscale for additional compression */
    grayscale?: boolean;
    /** Progress callback */
    onProgress?: (progress: number, stage: string) => void;
}

/**
 * Unified compression result
 */
export interface UnifiedCompressionResult {
    /** Compressed PDF bytes */
    pdfBytes: Uint8Array;
    /** Original file size in bytes */
    originalSize: number;
    /** Compressed file size in bytes */
    compressedSize: number;
    /** Compression ratio (0-1, higher = more compression) */
    compressionRatio: number;
    /** Strategy used */
    strategy: CompressionStrategy;
    /** Detailed method identifier */
    method: string;
    /** Any warnings generated during compression */
    warnings: string[];
}

/**
 * Maps compression levels to strategy-specific settings
 */
const LEVEL_CONFIGS: Record<CompressionLevel, {
    ghostscript: GhostscriptPreset;
    reencode: CompressionQuality;
    basic: ExportQualityOptions;
}> = {
    light: {
        ghostscript: 'printer',
        reencode: 'printer',
        basic: {
            format: 'jpeg',
            quality: 0.85,
            multiplier: 1.5,
            label: 'Light',
            description: ''
        }
    },
    medium: {
        ghostscript: 'ebook',
        reencode: 'ebook',
        basic: {
            format: 'jpeg',
            quality: 0.75,
            multiplier: 1,
            label: 'Medium',
            description: ''
        }
    },
    heavy: {
        ghostscript: 'ebook',
        reencode: 'ebook',
        basic: {
            format: 'jpeg',
            quality: 0.6,
            multiplier: 1,
            label: 'Heavy',
            description: ''
        }
    },
    extreme: {
        ghostscript: 'screen',
        reencode: 'screen',
        basic: {
            format: 'jpeg',
            quality: 0.45,
            multiplier: 0.75,
            label: 'Extreme',
            description: ''
        }
    }
};

/**
 * Selects the best compression strategy based on device capabilities.
 */
export function selectStrategy(forceStrategy?: CompressionStrategy): CompressionStrategy {
    if (forceStrategy) {
        return forceStrategy;
    }

    // Check if Ghostscript WASM can be used
    if (canUseGhostscriptWASM()) {
        return 'ghostscript';
    }

    // Default to re-encoding (works everywhere)
    return 'reencode';
}

/**
 * Gets information about available compression strategies on this device.
 */
export function getAvailableStrategies(): {
    strategy: CompressionStrategy;
    available: boolean;
    label: string;
    description: string;
    expectedCompression: string;
}[] {
    const capabilities = getDeviceCapabilities();

    return [
        {
            strategy: 'ghostscript',
            available: capabilities.canUseGhostscript,
            label: 'Ghostscript (Best)',
            description: 'Professional-grade compression using Ghostscript WASM',
            expectedCompression: '70-90%'
        },
        {
            strategy: 'reencode',
            available: true, // Always available
            label: 'Re-encode',
            description: 'Re-renders PDF pages as optimized images',
            expectedCompression: '50-70%'
        },
        {
            strategy: 'basic',
            available: true, // Always available
            label: 'Basic',
            description: 'Compresses only annotation overlays',
            expectedCompression: '30-50%'
        }
    ];
}

/**
 * Compresses a PDF using the best available strategy.
 *
 * @param pdfProxy - Source PDF document from PDF.js
 * @param canvases - Fabric.js overlay canvases with annotations
 * @param options - Compression options
 * @returns Compression result with PDF bytes and statistics
 */
export async function compressPDF(
    pdfProxy: PDFDocumentProxy,
    canvases: Record<number, Canvas>,
    options: UnifiedCompressionOptions
): Promise<UnifiedCompressionResult> {
    const { level, forceStrategy, grayscale, onProgress } = options;
    const config = LEVEL_CONFIGS[level];
    const warnings: string[] = [];

    // Select strategy
    const strategy = selectStrategy(forceStrategy);

    onProgress?.(5, 'Preparing...');

    // Strategy 1: Ghostscript WASM (best compression, desktop only)
    if (strategy === 'ghostscript') {
        try {
            onProgress?.(10, 'Getting PDF data...');

            // First, export PDF with annotations embedded
            const annotatedResult = await exportToPdf(pdfProxy, canvases, {
                format: 'jpeg',
                quality: 0.9,
                multiplier: 1,
                label: '',
                description: ''
            });

            onProgress?.(30, 'Loading Ghostscript...');

            // Compress with Ghostscript worker
            const gsResult = await compressWithWorker(
                annotatedResult.pdfBytes,
                config.ghostscript,
                (progress: CompressionProgress) => {
                    const scaledProgress = 30 + (progress.progress * 0.65);
                    onProgress?.(scaledProgress, progress.stage);
                }
            );

            onProgress?.(100, 'Complete');

            return {
                pdfBytes: gsResult.pdfBytes,
                originalSize: annotatedResult.originalSize,
                compressedSize: gsResult.compressedSize,
                compressionRatio: 1 - (gsResult.compressedSize / annotatedResult.originalSize),
                strategy: 'ghostscript',
                method: `ghostscript-${config.ghostscript}`,
                warnings
            };
        } catch (error) {
            warnings.push(`Ghostscript failed: ${error}. Falling back to re-encoding.`);
            // Fall through to re-encoding
        }
    }

    // Strategy 2: Re-encoding (good compression, works everywhere)
    if (strategy === 'reencode' || warnings.length > 0) {
        try {
            onProgress?.(10, 'Re-encoding pages...');

            const result = await reencodeCompression(pdfProxy, canvases, {
                quality: config.reencode,
                grayscale,
                onProgress: (progress, currentPage, totalPages) => {
                    const scaledProgress = 10 + (progress * 0.85);
                    onProgress?.(scaledProgress, `Page ${currentPage}/${totalPages}`);
                }
            });

            onProgress?.(100, 'Complete');

            return {
                pdfBytes: result.pdfBytes,
                originalSize: result.originalSize,
                compressedSize: result.compressedSize,
                compressionRatio: result.compressionRatio,
                strategy: 'reencode',
                method: result.method,
                warnings
            };
        } catch (error) {
            warnings.push(`Re-encoding failed: ${error}. Falling back to basic compression.`);
        }
    }

    // Strategy 3: Basic compression (fallback)
    onProgress?.(10, 'Applying basic compression...');

    const basicResult = await exportToPdf(pdfProxy, canvases, {
        ...config.basic,
        grayscale
    });

    onProgress?.(100, 'Complete');

    return {
        pdfBytes: basicResult.pdfBytes,
        originalSize: basicResult.originalSize,
        compressedSize: basicResult.exportedSize,
        compressionRatio: 1 - (basicResult.exportedSize / basicResult.originalSize),
        strategy: 'basic',
        method: `basic-jpeg-${Math.round(config.basic.quality * 100)}`,
        warnings
    };
}

/**
 * Downloads compressed PDF bytes as a file.
 */
export function downloadPDF(pdfBytes: Uint8Array, filename: string = 'compressed.pdf'): void {
    const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}
