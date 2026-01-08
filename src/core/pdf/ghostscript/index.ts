/**
 * Ghostscript WASM Module
 *
 * Exports all Ghostscript-related functionality for PDF compression.
 */

export { loadGhostscript, canUseGhostscriptWASM, getDeviceCapabilities, resetGhostscriptCache } from './loader';
export type { GhostscriptModule } from './loader';

export { ghostscriptCompress, estimateCompression, GHOSTSCRIPT_PRESETS } from './compressor';
export type { GhostscriptPreset, GhostscriptCompressionOptions, GhostscriptCompressionResult } from './compressor';

export { compressWithWorker, WorkerPool } from './workerClient';
export type { CompressionProgress, WorkerCompressionResult } from './workerClient';
