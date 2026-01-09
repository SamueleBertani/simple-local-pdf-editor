/**
 * Ghostscript Compression Web Worker
 *
 * Runs Ghostscript WASM compression in a separate thread
 * to avoid blocking the main UI thread.
 */

import type { GhostscriptPreset } from './compressor';
import { GS_WASM_CDN_PRIMARY } from './config';

// Worker message types
export interface WorkerRequest {
    type: 'compress';
    id: string;
    pdfBytes: Uint8Array;
    preset: GhostscriptPreset;
    compatibilityLevel?: string;
}

export interface WorkerProgressResponse {
    type: 'progress';
    id: string;
    progress: number;
    stage: string;
}

export interface WorkerResultResponse {
    type: 'result';
    id: string;
    pdfBytes: Uint8Array;
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
}

export interface WorkerErrorResponse {
    type: 'error';
    id: string;
    error: string;
}

export type WorkerResponse = WorkerProgressResponse | WorkerResultResponse | WorkerErrorResponse;

interface GhostscriptModule {
    FS: {
        writeFile: (path: string, data: Uint8Array) => void;
        readFile: (path: string) => Uint8Array;
        unlink: (path: string) => void;
    };
    callMain: (args: string[]) => number;
}

let gsModule: GhostscriptModule | null = null;

/**
 * Loads Ghostscript WASM module within worker context.
 */
async function loadGhostscriptInWorker(): Promise<GhostscriptModule> {
    if (gsModule) return gsModule;

    const initGhostscript = await import(
        /* webpackIgnore: true */
        /* @vite-ignore */
        GS_WASM_CDN_PRIMARY
    );
    const module = await initGhostscript.default();
    if (!module) {
        throw new Error('Failed to initialize Ghostscript module');
    }
    gsModule = module;
    return module;
}

/**
 * Handles compression requests from the main thread.
 */
async function handleCompression(request: WorkerRequest): Promise<void> {
    const { id, pdfBytes, preset, compatibilityLevel = '1.4' } = request;

    const sendProgress = (progress: number, stage: string) => {
        self.postMessage({
            type: 'progress',
            id,
            progress,
            stage
        } as WorkerProgressResponse);
    };

    try {
        sendProgress(5, 'Loading Ghostscript WASM...');

        const gs = await loadGhostscriptInWorker();

        sendProgress(20, 'Writing input file...');

        const inputPath = `/input_${id}.pdf`;
        const outputPath = `/output_${id}.pdf`;

        // Write input PDF to virtual filesystem
        gs.FS.writeFile(inputPath, pdfBytes);

        sendProgress(30, 'Compressing PDF...');

        // Build Ghostscript arguments
        const args = [
            '-sDEVICE=pdfwrite',
            `-dPDFSETTINGS=/${preset}`,
            `-dCompatibilityLevel=${compatibilityLevel}`,
            '-dNOPAUSE',
            '-dQUIET',
            '-dBATCH',
            '-dDetectDuplicateImages=true',
            '-dCompressFonts=true',
            '-dSubsetFonts=true',
            `-sOutputFile=${outputPath}`,
            inputPath
        ];

        // Execute Ghostscript
        const exitCode = gs.callMain(args);

        if (exitCode !== 0) {
            throw new Error(`Ghostscript failed with exit code ${exitCode}`);
        }

        sendProgress(85, 'Reading compressed file...');

        // Read compressed output
        const compressedBytes = gs.FS.readFile(outputPath);

        sendProgress(95, 'Cleaning up...');

        // Cleanup
        try {
            gs.FS.unlink(inputPath);
            gs.FS.unlink(outputPath);
        } catch {
            // Ignore cleanup errors
        }

        sendProgress(100, 'Complete');

        // Send result
        self.postMessage({
            type: 'result',
            id,
            pdfBytes: compressedBytes,
            originalSize: pdfBytes.byteLength,
            compressedSize: compressedBytes.byteLength,
            compressionRatio: 1 - (compressedBytes.byteLength / pdfBytes.byteLength)
        } as WorkerResultResponse);

    } catch (error) {
        self.postMessage({
            type: 'error',
            id,
            error: error instanceof Error ? error.message : 'Unknown compression error'
        } as WorkerErrorResponse);
    }
}

// Worker message handler
self.onmessage = (event: MessageEvent<WorkerRequest>) => {
    const request = event.data;

    if (request.type === 'compress') {
        handleCompression(request);
    }
};
