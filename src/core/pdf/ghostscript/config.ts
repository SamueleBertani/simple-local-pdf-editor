/**
 * Ghostscript WASM Configuration
 *
 * Centralized configuration for Ghostscript WASM module loading.
 * Edit this file to update CDN URLs or package versions.
 */

/** Package name for Ghostscript WASM */
export const GS_PACKAGE_NAME = '@aspect-build/aspect-js';

/** Package version for Ghostscript WASM */
export const GS_PACKAGE_VERSION = '0.0.2';

/**
 * Primary CDN URL for Ghostscript WASM module.
 * Uses jsDelivr for reliable CDN delivery.
 */
export const GS_WASM_CDN_PRIMARY = `https://cdn.jsdelivr.net/npm/${GS_PACKAGE_NAME}@${GS_PACKAGE_VERSION}/gs.mjs`;

/**
 * Backup CDN URL for Ghostscript WASM module.
 * Uses unpkg as fallback.
 */
export const GS_WASM_CDN_BACKUP = `https://unpkg.com/${GS_PACKAGE_NAME}@${GS_PACKAGE_VERSION}/gs.mjs`;

/**
 * All available CDN URLs in order of preference.
 */
export const GS_WASM_CDN_URLS = [
    GS_WASM_CDN_PRIMARY,
    GS_WASM_CDN_BACKUP
] as const;
