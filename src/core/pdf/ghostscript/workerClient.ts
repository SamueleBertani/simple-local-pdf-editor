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

/** Timeout for compression operations (5 minutes) */
const COMPRESSION_TIMEOUT_MS = 5 * 60 * 1000;

/** Time to keep idle worker alive before terminating (2 minutes) */
const WORKER_IDLE_TIMEOUT_MS = 2 * 60 * 1000;

/**
 * Cached worker instance for reuse between compressions.
 * Avoids reloading the ~20MB WASM module for each operation.
 */
let cachedWorker: Worker | null = null;
let workerIdleTimer: ReturnType<typeof setTimeout> | null = null;
let isWorkerBusy = false;

/**
 * Gets or creates a cached compression worker.
 * The worker is reused between compressions to avoid WASM reload overhead.
 */
function getOrCreateWorker(): Worker {
    // Clear any pending idle timeout since we're using the worker
    if (workerIdleTimer) {
        clearTimeout(workerIdleTimer);
        workerIdleTimer = null;
    }

    if (!cachedWorker) {
        cachedWorker = new Worker(
            new URL('./worker.ts', import.meta.url),
            { type: 'module' }
        );
    }

    return cachedWorker;
}

/**
 * Schedules the cached worker for termination after idle timeout.
 * Called when compression completes to free resources if not used again.
 */
function scheduleWorkerCleanup(): void {
    if (workerIdleTimer) {
        clearTimeout(workerIdleTimer);
    }

    workerIdleTimer = setTimeout(() => {
        if (cachedWorker && !isWorkerBusy) {
            cachedWorker.terminate();
            cachedWorker = null;
        }
        workerIdleTimer = null;
    }, WORKER_IDLE_TIMEOUT_MS);
}

/**
 * Forces immediate termination of the cached worker.
 * Useful for error recovery or when the app is closing.
 */
export function terminateCachedWorker(): void {
    if (workerIdleTimer) {
        clearTimeout(workerIdleTimer);
        workerIdleTimer = null;
    }
    if (cachedWorker) {
        cachedWorker.terminate();
        cachedWorker = null;
    }
    isWorkerBusy = false;
}

/**
 * Creates a new Ghostscript compression worker instance.
 * @deprecated Use getOrCreateWorker() for better performance
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
        // Use cached worker for better performance (avoids WASM reload)
        const worker = getOrCreateWorker();
        const requestId = generateRequestId();
        let timeoutId: ReturnType<typeof setTimeout> | null = null;

        isWorkerBusy = true;

        timeoutId = setTimeout(() => {
            // On timeout, terminate and clear the cached worker
            terminateCachedWorker();
            reject(new Error('Ghostscript compression timed out after 5 minutes'));
        }, COMPRESSION_TIMEOUT_MS);

        const cleanup = (terminateWorker: boolean = false) => {
            if (timeoutId) {
                clearTimeout(timeoutId);
                timeoutId = null;
            }
            isWorkerBusy = false;

            if (terminateWorker) {
                // Terminate on error to ensure clean state
                terminateCachedWorker();
            } else {
                // Schedule cleanup after idle period
                scheduleWorkerCleanup();
            }
        };

        const handleMessage = (event: MessageEvent<WorkerResponse>) => {
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
                    worker.removeEventListener('message', handleMessage);
                    worker.removeEventListener('error', handleError);
                    cleanup(false);
                    resolve({
                        pdfBytes: result.pdfBytes,
                        originalSize: result.originalSize,
                        compressedSize: result.compressedSize,
                        compressionRatio: result.compressionRatio
                    });
                    break;
                }

                case 'error':
                    worker.removeEventListener('message', handleMessage);
                    worker.removeEventListener('error', handleError);
                    cleanup(true);
                    reject(new Error(response.error));
                    break;
            }
        };

        const handleError = (error: ErrorEvent) => {
            worker.removeEventListener('message', handleMessage);
            worker.removeEventListener('error', handleError);
            cleanup(true);
            reject(new Error(`Worker error: ${error.message}`));
        };

        worker.addEventListener('message', handleMessage);
        worker.addEventListener('error', handleError);

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
