import type { GhostscriptPreset } from '../core/pdf/ghostscript/compressor';
import type { CompressionQuality } from '../core/pdf/compressor';
import type { ExportQualityOptions } from '../core/pdf/exporter';
import type { CompressionLevel } from '../core/pdf/compressionManager';

/**
 * Configuration for each compression level across different strategies.
 */
export interface LevelConfig {
    ghostscript: GhostscriptPreset;
    reencode: CompressionQuality;
    basic: ExportQualityOptions;
}

/**
 * Maps compression levels to strategy-specific settings.
 */
export const COMPRESSION_LEVEL_CONFIGS: Record<CompressionLevel, LevelConfig> = {
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
