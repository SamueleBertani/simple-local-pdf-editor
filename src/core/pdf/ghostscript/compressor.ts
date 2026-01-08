/**
 * Ghostscript WASM PDF Compressor
 *
 * Provides professional-grade PDF compression using Ghostscript
 * compiled to WebAssembly. Achieves 70-90% compression ratios.
 */

import { loadGhostscript, type GhostscriptModule } from './loader';

/**
 * Ghostscript compression preset levels.
 * Maps to PDF optimization settings.
 */
export type GhostscriptPreset = 'screen' | 'ebook' | 'printer' | 'prepress';

/**
 * Compression preset configurations
 */
export const GHOSTSCRIPT_PRESETS: Record<GhostscriptPreset, {
    label: string;
    description: string;
    expectedCompression: string;
    dpi: number;
}> = {
    screen: {
        label: 'Screen',
        description: 'Lowest file size, for screen viewing only',
        expectedCompression: '70-90%',
        dpi: 72
    },
    ebook: {
        label: 'E-book',
        description: 'Good for digital reading and sharing',
        expectedCompression: '50-70%',
        dpi: 150
    },
    printer: {
        label: 'Printer',
        description: 'Standard quality for home/office printing',
        expectedCompression: '30-50%',
        dpi: 300
    },
    prepress: {
        label: 'Prepress',
        description: 'Professional print quality, minimal compression',
        expectedCompression: '10-30%',
        dpi: 300
    }
};

export interface GhostscriptCompressionOptions {
    /** Compression preset level */
    preset: GhostscriptPreset;
    /** PDF compatibility level (default: 1.4) */
    compatibilityLevel?: string;
    /** Progress callback */
    onProgress?: (progress: number, stage: string) => void;
}

export interface GhostscriptCompressionResult {
    /** Compressed PDF bytes */
    pdfBytes: Uint8Array;
    /** Original file size in bytes */
    originalSize: number;
    /** Compressed file size in bytes */
    compressedSize: number;
    /** Compression ratio (0-1, higher = more compression) */
    compressionRatio: number;
    /** Compression method identifier */
    method: string;
}

/**
 * Compresses a PDF using Ghostscript WASM.
 * Provides maximum compression (70-90%) with professional-grade algorithms.
 *
 * Features:
 * - Image downsampling and recompression
 * - Font subsetting
 * - Metadata optimization
 * - Structure optimization
 *
 * @param pdfBytes - Source PDF as Uint8Array
 * @param options - Compression options
 * @returns Compression result with PDF bytes and statistics
 */
export async function ghostscriptCompress(
    pdfBytes: Uint8Array,
    options: GhostscriptCompressionOptions
): Promise<GhostscriptCompressionResult> {
    const { preset, compatibilityLevel = '1.4', onProgress } = options;
    const originalSize = pdfBytes.byteLength;

    onProgress?.(5, 'Loading Ghostscript...');

    // Load Ghostscript WASM module
    const gs = await loadGhostscript();

    onProgress?.(20, 'Preparing files...');

    const inputPath = '/input.pdf';
    const outputPath = '/output.pdf';

    try {
        // Write input PDF to virtual filesystem
        gs.FS.writeFile(inputPath, pdfBytes);

        onProgress?.(30, 'Compressing...');

        // Build Ghostscript command arguments
        const args = buildGhostscriptArgs(inputPath, outputPath, preset, compatibilityLevel);

        // Execute Ghostscript
        const exitCode = gs.callMain(args);

        if (exitCode !== 0) {
            throw new Error(`Ghostscript compression failed with exit code ${exitCode}`);
        }

        onProgress?.(90, 'Reading result...');

        // Read compressed output
        const compressedBytes = gs.FS.readFile(outputPath);
        const compressedSize = compressedBytes.byteLength;

        onProgress?.(100, 'Complete');

        return {
            pdfBytes: compressedBytes,
            originalSize,
            compressedSize,
            compressionRatio: 1 - (compressedSize / originalSize),
            method: `ghostscript-${preset}`
        };
    } finally {
        // Cleanup virtual filesystem
        cleanupFiles(gs, [inputPath, outputPath]);
    }
}

/**
 * Builds the Ghostscript command-line arguments for compression.
 */
function buildGhostscriptArgs(
    inputPath: string,
    outputPath: string,
    preset: GhostscriptPreset,
    compatibilityLevel: string
): string[] {
    return [
        // Output device
        '-sDEVICE=pdfwrite',

        // Compression preset
        `-dPDFSETTINGS=/${preset}`,

        // PDF version compatibility
        `-dCompatibilityLevel=${compatibilityLevel}`,

        // Batch mode options
        '-dNOPAUSE',
        '-dQUIET',
        '-dBATCH',

        // Optimization options
        '-dDetectDuplicateImages=true',
        '-dCompressFonts=true',
        '-dSubsetFonts=true',
        '-dEmbedAllFonts=true',

        // Color handling
        '-dColorConversionStrategy=/LeaveColorUnchanged',
        '-dDownsampleColorImages=true',
        '-dDownsampleGrayImages=true',
        '-dDownsampleMonoImages=true',

        // Output file
        `-sOutputFile=${outputPath}`,

        // Input file
        inputPath
    ];
}

/**
 * Cleans up temporary files from the virtual filesystem.
 */
function cleanupFiles(gs: GhostscriptModule, paths: string[]): void {
    for (const path of paths) {
        try {
            gs.FS.unlink(path);
        } catch {
            // Ignore cleanup errors
        }
    }
}

/**
 * Estimates compression result based on preset without actually compressing.
 * Useful for showing expected results in UI.
 */
export function estimateCompression(
    originalSize: number,
    preset: GhostscriptPreset
): { minSize: number; maxSize: number; avgSize: number } {
    const estimates: Record<GhostscriptPreset, { min: number; max: number }> = {
        screen: { min: 0.1, max: 0.3 },     // 70-90% reduction
        ebook: { min: 0.3, max: 0.5 },      // 50-70% reduction
        printer: { min: 0.5, max: 0.7 },    // 30-50% reduction
        prepress: { min: 0.7, max: 0.9 }    // 10-30% reduction
    };

    const { min, max } = estimates[preset];
    return {
        minSize: Math.round(originalSize * min),
        maxSize: Math.round(originalSize * max),
        avgSize: Math.round(originalSize * (min + max) / 2)
    };
}
