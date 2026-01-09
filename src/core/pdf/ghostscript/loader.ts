/**
 * Ghostscript WASM Loader
 *
 * Provides lazy loading of Ghostscript WebAssembly module.
 * The ~20MB WASM file is only downloaded when compression is actually requested.
 */

import { GS_WASM_CDN_PRIMARY, GS_WASM_CDN_BACKUP } from './config';

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
                GS_WASM_CDN_PRIMARY
            );
            gsModule = await initGhostscript.default();
            return gsModule;
        } catch (primaryError) {
            const primaryErrorMsg = primaryError instanceof Error ? primaryError.message : String(primaryError);
            console.warn('Primary Ghostscript CDN failed, trying backup...', primaryErrorMsg);

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
                const backupErrorMsg = backupError instanceof Error ? backupError.message : String(backupError);
                loadingPromise = null;
                throw new Error(
                    `Failed to load Ghostscript WASM from CDN. ` +
                    `Primary error: ${primaryErrorMsg}. Backup error: ${backupErrorMsg}`
                );
            }
        }
    })();

    const result = await loadingPromise;
    if (result) return result;
    throw new Error('Ghostscript module failed to load');
}

/**
 * Detects if the current device is a mobile/touch device.
 * Uses multiple detection methods for better accuracy.
 */
function detectMobileDevice(): boolean {
    // Method 1: Touch capability (most reliable)
    const hasCoarsePointer = window.matchMedia?.('(pointer: coarse)')?.matches ?? false;
    const hasTouchScreen = navigator.maxTouchPoints > 0;

    // Method 2: Screen size heuristic (tablets and phones typically < 1024px width)
    const isSmallScreen = window.screen?.width < 1024;

    // Method 3: User-Agent fallback (less reliable but catches edge cases)
    const mobileUserAgentPattern = /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i;
    const hasMobileUserAgent = mobileUserAgentPattern.test(navigator.userAgent);

    // Consider mobile if:
    // - Has coarse pointer (touch-primary device) AND touch screen
    // - OR has mobile user agent AND small screen
    return (hasCoarsePointer && hasTouchScreen) || (hasMobileUserAgent && isSmallScreen);
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
    if (detectMobileDevice()) {
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
    const isMobile = detectMobileDevice();
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
