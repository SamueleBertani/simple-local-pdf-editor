/**
 * Ghostscript WASM Loader
 *
 * Provides lazy loading of Ghostscript WebAssembly module.
 * The ~20MB WASM file is only downloaded when compression is actually requested.
 */

export interface GhostscriptModule {
    FS: {
        writeFile: (path: string, data: Uint8Array) => void;
        readFile: (path: string) => Uint8Array;
        unlink: (path: string) => void;
    };
    callMain: (args: string[]) => number;
}

let gsModule: GhostscriptModule | null = null;
let loadingPromise: Promise<GhostscriptModule | null> | null = null;

/**
 * CDN URL for Ghostscript WASM module.
 * Using jsDelivr for reliable CDN delivery.
 */
const GS_WASM_CDN_URL = 'https://cdn.jsdelivr.net/npm/@aspect-build/aspect-js@0.0.2/gs.mjs';

/**
 * Alternative CDN URL (backup)
 */
const GS_WASM_CDN_BACKUP = 'https://unpkg.com/@aspect-build/aspect-js@0.0.2/gs.mjs';

/**
 * Lazy-loads the Ghostscript WASM module.
 * Only downloads the ~20MB WASM file when actually needed.
 * Subsequent calls return the cached module.
 *
 * @returns Promise resolving to the Ghostscript module
 * @throws Error if WASM loading fails
 */
export async function loadGhostscript(): Promise<GhostscriptModule> {
    // Return cached module if available
    if (gsModule) {
        return gsModule;
    }

    // Return existing loading promise if already loading
    if (loadingPromise) {
        const result = await loadingPromise;
        if (result) return result;
        throw new Error('Ghostscript module failed to load');
    }

    loadingPromise = (async (): Promise<GhostscriptModule | null> => {
        try {
            // Try primary CDN
            const initGhostscript = await import(
                /* webpackIgnore: true */
                /* @vite-ignore */
                GS_WASM_CDN_URL
            );
            gsModule = await initGhostscript.default();
            return gsModule;
        } catch (primaryError) {
            console.warn('Primary Ghostscript CDN failed, trying backup...', primaryError);

            try {
                // Try backup CDN
                const initGhostscript = await import(
                    /* webpackIgnore: true */
                    /* @vite-ignore */
                    GS_WASM_CDN_BACKUP
                );
                gsModule = await initGhostscript.default();
                return gsModule;
            } catch (backupError) {
                loadingPromise = null;
                throw new Error(
                    `Failed to load Ghostscript WASM from CDN. ` +
                    `Primary error: ${primaryError}. Backup error: ${backupError}`
                );
            }
        }
    })();

    const result = await loadingPromise;
    if (result) return result;
    throw new Error('Ghostscript module failed to load');
}

/**
 * Checks if the current device can handle Ghostscript WASM compression.
 * Returns false for mobile devices and low-memory systems.
 *
 * @returns true if Ghostscript WASM is recommended for this device
 */
export function canUseGhostscriptWASM(): boolean {
    // Check WebAssembly support
    if (typeof WebAssembly !== 'object') {
        return false;
    }

    // Check available memory (need at least 4GB device memory)
    const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    if (deviceMemory !== undefined && deviceMemory < 4) {
        return false;
    }

    // Check if mobile device (WASM is too heavy for mobile)
    const isMobile = /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
    );
    if (isMobile) {
        return false;
    }

    // Check if running in a worker-capable environment
    if (typeof Worker === 'undefined') {
        return false;
    }

    return true;
}

/**
 * Gets device capability information for debugging/display purposes.
 */
export function getDeviceCapabilities(): {
    hasWebAssembly: boolean;
    deviceMemory: number | undefined;
    isMobile: boolean;
    hasWorkerSupport: boolean;
    canUseGhostscript: boolean;
} {
    const hasWebAssembly = typeof WebAssembly === 'object';
    const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    const isMobile = /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
    );
    const hasWorkerSupport = typeof Worker !== 'undefined';

    return {
        hasWebAssembly,
        deviceMemory,
        isMobile,
        hasWorkerSupport,
        canUseGhostscript: canUseGhostscriptWASM()
    };
}

/**
 * Resets the cached module (useful for testing or error recovery).
 */
export function resetGhostscriptCache(): void {
    gsModule = null;
    loadingPromise = null;
}
