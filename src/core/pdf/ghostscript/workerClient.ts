/**
 * Ghostscript Worker Client
 *
 * Provides a clean API for communicating with the Ghostscript
 * compression Web Worker. Handles worker lifecycle, message passing,
 * and error recovery.
 */

import type { GhostscriptPreset } from './compressor';
import type {
    WorkerRequest,
    WorkerResponse,
    WorkerProgressResponse,
    WorkerResultResponse
} from './worker';

export interface CompressionProgress {
    progress: number;
    stage: string;
}

export interface WorkerCompressionResult {
    pdfBytes: Uint8Array;
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
}

/**
 * Creates a new Ghostscript compression worker instance.
 */
function createCompressionWorker(): Worker {
    return new Worker(
        new URL('./worker.ts', import.meta.url),
        { type: 'module' }
    );
}

/**
 * Generates a unique request ID.
 */
function generateRequestId(): string {
    return `gs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Compresses a PDF using Ghostscript in a Web Worker.
 * This prevents the compression from blocking the main UI thread.
 *
 * @param pdfBytes - Source PDF as Uint8Array
 * @param preset - Ghostscript compression preset
 * @param onProgress - Optional progress callback
 * @returns Promise resolving to compression result
 */
export function compressWithWorker(
    pdfBytes: Uint8Array,
    preset: GhostscriptPreset,
    onProgress?: (progress: CompressionProgress) => void
): Promise<WorkerCompressionResult> {
    return new Promise((resolve, reject) => {
        const worker = createCompressionWorker();
        const requestId = generateRequestId();
        let timeoutId: ReturnType<typeof setTimeout> | null = null;

        // Set a timeout for the entire operation (5 minutes max)
        const TIMEOUT_MS = 5 * 60 * 1000;
        timeoutId = setTimeout(() => {
            worker.terminate();
            reject(new Error('Ghostscript compression timed out after 5 minutes'));
        }, TIMEOUT_MS);

        const cleanup = () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
                timeoutId = null;
            }
            worker.terminate();
        };

        worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
            const response = event.data;

            // Ignore messages from other requests
            if (response.id !== requestId) return;

            switch (response.type) {
                case 'progress':
                    onProgress?.({
                        progress: (response as WorkerProgressResponse).progress,
                        stage: (response as WorkerProgressResponse).stage
                    });
                    break;

                case 'result': {
                    const result = response as WorkerResultResponse;
                    cleanup();
                    resolve({
                        pdfBytes: result.pdfBytes,
                        originalSize: result.originalSize,
                        compressedSize: result.compressedSize,
                        compressionRatio: result.compressionRatio
                    });
                    break;
                }

                case 'error':
                    cleanup();
                    reject(new Error(response.error));
                    break;
            }
        };

        worker.onerror = (error) => {
            cleanup();
            reject(new Error(`Worker error: ${error.message}`));
        };

        // Send compression request
        const request: WorkerRequest = {
            type: 'compress',
            id: requestId,
            pdfBytes,
            preset
        };

        worker.postMessage(request);
    });
}

/**
 * Manages a pool of workers for parallel compression tasks.
 * Useful for batch processing multiple PDFs.
 */
export class WorkerPool {
    private maxWorkers: number;
    private activeWorkers: Set<Worker> = new Set();
    private queue: Array<{
        pdfBytes: Uint8Array;
        preset: GhostscriptPreset;
        resolve: (result: WorkerCompressionResult) => void;
        reject: (error: Error) => void;
        onProgress?: (progress: CompressionProgress) => void;
    }> = [];

    constructor(maxWorkers: number = navigator.hardwareConcurrency || 2) {
        // Limit to reasonable number to avoid memory issues
        this.maxWorkers = Math.min(maxWorkers, 4);
    }

    /**
     * Adds a compression task to the pool.
     */
    compress(
        pdfBytes: Uint8Array,
        preset: GhostscriptPreset,
        onProgress?: (progress: CompressionProgress) => void
    ): Promise<WorkerCompressionResult> {
        return new Promise((resolve, reject) => {
            this.queue.push({ pdfBytes, preset, resolve, reject, onProgress });
            this.processQueue();
        });
    }

    /**
     * Processes the next item in the queue if workers are available.
     */
    private processQueue(): void {
        while (this.activeWorkers.size < this.maxWorkers && this.queue.length > 0) {
            const task = this.queue.shift()!;
            this.runTask(task);
        }
    }

    /**
     * Runs a single compression task.
     */
    private async runTask(task: {
        pdfBytes: Uint8Array;
        preset: GhostscriptPreset;
        resolve: (result: WorkerCompressionResult) => void;
        reject: (error: Error) => void;
        onProgress?: (progress: CompressionProgress) => void;
    }): Promise<void> {
        const worker = createCompressionWorker();
        this.activeWorkers.add(worker);

        try {
            const result = await compressWithWorker(
                task.pdfBytes,
                task.preset,
                task.onProgress
            );
            task.resolve(result);
        } catch (error) {
            task.reject(error instanceof Error ? error : new Error(String(error)));
        } finally {
            this.activeWorkers.delete(worker);
            worker.terminate();
            this.processQueue();
        }
    }

    /**
     * Terminates all active workers and clears the queue.
     */
    terminate(): void {
        for (const worker of this.activeWorkers) {
            worker.terminate();
        }
        this.activeWorkers.clear();

        // Reject all queued tasks
        for (const task of this.queue) {
            task.reject(new Error('Worker pool terminated'));
        }
        this.queue = [];
    }
}
