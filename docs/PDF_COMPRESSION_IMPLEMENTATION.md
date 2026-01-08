# PDF Compression Optimization - Implementation Guide

## Overview

This document outlines the implementation strategy for improving PDF export compression in localPDFeditor. The goal is to significantly reduce exported file sizes while maintaining acceptable quality, with support for both desktop and mobile devices.

## Current State

### Existing Implementation
Location: `src/core/pdf/exporter.ts`

Current approach:
- Uses `pdf-lib` to load original PDF
- Converts Fabric.js canvas annotations to images (PNG/JPEG)
- Embeds images onto PDF pages
- Offers 3 presets: High (PNG), Medium (JPEG 85%), Low (JPEG 65%)

### Limitations
- No compression of original PDF images
- No font subsetting or metadata removal
- Limited to image format/quality adjustments only
- Typical reduction: 10-40%

## Target Goals

| Metric | Current | Target |
|--------|---------|--------|
| Compression ratio | 10-40% | 50-80% |
| Mobile support | N/A | Full |
| Processing time (10 pages) | ~2s | <5s |
| Memory usage | Low | <200MB |

---

## Implementation Strategy: Hybrid Approach

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Compression Manager                       │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Device    │  │  Strategy   │  │     Compressor      │  │
│  │  Detector   │──│  Selector   │──│     Registry        │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│                                              │               │
│                    ┌─────────────────────────┼───────────┐   │
│                    │                         │           │   │
│              ┌─────▼─────┐           ┌───────▼───┐ ┌─────▼─┐│
│              │Ghostscript│           │ JS-Native │ │ Basic ││
│              │   WASM    │           │ Re-encode │ │ JPEG  ││
│              │(Desktop)  │           │ (Mobile)  │ │(Fallbk││
│              └───────────┘           └───────────┘ └───────┘│
└─────────────────────────────────────────────────────────────┘
```

### Strategy Selection Logic

```typescript
function selectCompressionStrategy(): CompressionStrategy {
    const capabilities = detectDeviceCapabilities();

    if (capabilities.canUseWASM && capabilities.hasEnoughMemory) {
        return 'ghostscript-wasm';  // Best compression: 70-90%
    }

    if (capabilities.supportsOffscreenCanvas) {
        return 'js-reencode';       // Good compression: 50-70%
    }

    return 'basic-jpeg';            // Fallback: 30-50%
}
```

---

## Phase 1: Enhanced Basic Compression (Week 1)

### 1.1 Add Extreme Preset

**File:** `src/core/pdf/exporter.ts`

```typescript
export const EXPORT_QUALITY_PRESETS: Record<string, ExportQualityOptions> = {
    high: {
        format: 'png',
        quality: 1,
        multiplier: 2,
        label: 'High',
        description: 'Maximum quality, larger file size'
    },
    medium: {
        format: 'jpeg',
        quality: 0.85,
        multiplier: 1,
        label: 'Medium',
        description: 'Good balance of quality and size'
    },
    low: {
        format: 'jpeg',
        quality: 0.65,
        multiplier: 1,
        label: 'Low',
        description: 'Smaller file size'
    },
    // NEW
    extreme: {
        format: 'jpeg',
        quality: 0.45,
        multiplier: 0.75,
        label: 'Extreme',
        description: 'Maximum compression, noticeable quality loss'
    }
};
```

### 1.2 Add ObjectStreams Optimization

**File:** `src/core/pdf/exporter.ts`

```typescript
// In exportToPdf function, update save call:
const pdfBytes = await pdfDoc.save({
    useObjectStreams: true,  // Groups objects for better compression
});
```

### 1.3 Add Grayscale Option

**File:** `src/core/pdf/exporter.ts`

```typescript
export interface ExportQualityOptions {
    format: 'jpeg' | 'png';
    quality: number;
    multiplier: number;
    label: string;
    description: string;
    grayscale?: boolean;  // NEW
}

function applyGrayscale(canvas: HTMLCanvasElement): HTMLCanvasElement {
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        data[i] = data[i + 1] = data[i + 2] = gray;
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas;
}
```

**Expected Impact:** 15-25% additional reduction

---

## Phase 2: JS-Native Re-encoding (Week 2)

### 2.1 Create New Compression Module

**File:** `src/core/pdf/compressor.ts`

```typescript
import { PDFDocument } from 'pdf-lib';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { Canvas } from 'fabric';

export interface CompressionOptions {
    quality: 'screen' | 'ebook' | 'printer' | 'prepress';
    grayscale?: boolean;
    preserveText?: boolean;  // If false, re-encodes entire page as image
}

export interface CompressionResult {
    pdfBytes: Uint8Array;
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
    method: string;
}

const QUALITY_SETTINGS = {
    screen: { dpi: 72, jpegQuality: 0.4 },
    ebook: { dpi: 150, jpegQuality: 0.6 },
    printer: { dpi: 300, jpegQuality: 0.8 },
    prepress: { dpi: 300, jpegQuality: 0.9 }
};

/**
 * Re-encodes entire PDF pages as compressed JPEG images.
 * Maximum compression but loses text selectability.
 */
export async function reencodeCompression(
    pdfProxy: PDFDocumentProxy,
    canvases: Record<number, Canvas>,
    options: CompressionOptions
): Promise<CompressionResult> {
    const settings = QUALITY_SETTINGS[options.quality];
    const scale = settings.dpi / 72;  // PDF native is 72 DPI

    // Create new PDF from scratch
    const newPdfDoc = await PDFDocument.create();
    const originalBytes = await pdfProxy.getData();
    const originalSize = originalBytes.byteLength;

    for (let i = 1; i <= pdfProxy.numPages; i++) {
        const page = await pdfProxy.getPage(i);
        const viewport = page.getViewport({ scale });

        // Create canvas for rendering
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d')!;

        // Render PDF page
        await page.render({ canvasContext: ctx, viewport }).promise;

        // Render overlay annotations if any
        const overlay = canvases[i];
        if (overlay && overlay.getObjects().length > 0) {
            const overlayData = overlay.toDataURL({ format: 'png', multiplier: scale });
            const img = new Image();
            img.src = overlayData;
            await new Promise(resolve => { img.onload = resolve; });
            ctx.drawImage(img, 0, 0, viewport.width, viewport.height);
        }

        // Apply grayscale if requested
        if (options.grayscale) {
            applyGrayscaleToCanvas(canvas);
        }

        // Convert to JPEG
        const jpegDataUrl = canvas.toDataURL('image/jpeg', settings.jpegQuality);
        const jpegImage = await newPdfDoc.embedJpg(jpegDataUrl);

        // Add page with image
        const pdfPage = newPdfDoc.addPage([
            viewport.width / scale,  // Original PDF dimensions
            viewport.height / scale
        ]);

        pdfPage.drawImage(jpegImage, {
            x: 0,
            y: 0,
            width: pdfPage.getWidth(),
            height: pdfPage.getHeight()
        });
    }

    const pdfBytes = await newPdfDoc.save({ useObjectStreams: true });

    return {
        pdfBytes,
        originalSize,
        compressedSize: pdfBytes.byteLength,
        compressionRatio: 1 - (pdfBytes.byteLength / originalSize),
        method: 'js-reencode'
    };
}

function applyGrayscaleToCanvas(canvas: HTMLCanvasElement): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        data[i] = data[i + 1] = data[i + 2] = gray;
    }

    ctx.putImageData(imageData, 0, 0);
}
```

**Expected Impact:** 50-70% reduction

---

## Phase 3: Ghostscript WASM Integration (Week 3-4)

### 3.1 Install Dependencies

```bash
npm install @aspect-build/aspect-workflows  # For WASM support if needed
```

### 3.2 Create WASM Loader

**File:** `src/core/pdf/ghostscript/loader.ts`

```typescript
let gsModule: GhostscriptModule | null = null;
let loadingPromise: Promise<GhostscriptModule> | null = null;

interface GhostscriptModule {
    FS: {
        writeFile: (path: string, data: Uint8Array) => void;
        readFile: (path: string) => Uint8Array;
        unlink: (path: string) => void;
    };
    callMain: (args: string[]) => number;
}

/**
 * Lazy-loads Ghostscript WASM module.
 * Only downloads the ~20MB WASM file when actually needed.
 */
export async function loadGhostscript(): Promise<GhostscriptModule> {
    if (gsModule) return gsModule;

    if (loadingPromise) return loadingPromise;

    loadingPromise = (async () => {
        // Dynamic import to avoid bundling WASM in main chunk
        const initGhostscript = await import(
            /* webpackIgnore: true */
            'https://cdn.jsdelivr.net/npm/@jspawn/ghostscript-wasm@0.0.2/gs.mjs'
        );

        gsModule = await initGhostscript.default();
        return gsModule;
    })();

    return loadingPromise;
}

/**
 * Checks if device can handle Ghostscript WASM
 */
export function canUseGhostscriptWASM(): boolean {
    // Check WebAssembly support
    if (typeof WebAssembly !== 'object') return false;

    // Check available memory (need at least 4GB device memory)
    const deviceMemory = (navigator as any).deviceMemory;
    if (deviceMemory && deviceMemory < 4) return false;

    // Check if mobile (WASM is heavy on mobile)
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) return false;

    return true;
}
```

### 3.3 Create Ghostscript Compressor

**File:** `src/core/pdf/ghostscript/compressor.ts`

```typescript
import { loadGhostscript } from './loader';
import type { CompressionResult } from '../compressor';

export type GhostscriptPreset = 'screen' | 'ebook' | 'printer' | 'prepress';

interface GhostscriptOptions {
    preset: GhostscriptPreset;
    compatibilityLevel?: string;  // e.g., '1.4', '1.5', '1.7'
}

/**
 * Compresses PDF using Ghostscript WASM.
 * Provides maximum compression (70-90%) with professional-grade algorithms.
 */
export async function ghostscriptCompress(
    pdfBytes: Uint8Array,
    options: GhostscriptOptions
): Promise<CompressionResult> {
    const gs = await loadGhostscript();
    const originalSize = pdfBytes.byteLength;

    const inputPath = '/input.pdf';
    const outputPath = '/output.pdf';

    try {
        // Write input PDF to virtual filesystem
        gs.FS.writeFile(inputPath, pdfBytes);

        // Build Ghostscript command
        const args = [
            '-sDEVICE=pdfwrite',
            `-dPDFSETTINGS=/${options.preset}`,
            `-dCompatibilityLevel=${options.compatibilityLevel || '1.4'}`,
            '-dNOPAUSE',
            '-dQUIET',
            '-dBATCH',
            '-dDetectDuplicateImages=true',
            '-dCompressFonts=true',
            '-dSubsetFonts=true',
            `-sOutputFile=${outputPath}`,
            inputPath
        ];

        // Run Ghostscript
        const exitCode = gs.callMain(args);

        if (exitCode !== 0) {
            throw new Error(`Ghostscript failed with exit code ${exitCode}`);
        }

        // Read compressed output
        const compressedBytes = gs.FS.readFile(outputPath);

        return {
            pdfBytes: compressedBytes,
            originalSize,
            compressedSize: compressedBytes.byteLength,
            compressionRatio: 1 - (compressedBytes.byteLength / originalSize),
            method: 'ghostscript-wasm'
        };
    } finally {
        // Cleanup virtual filesystem
        try {
            gs.FS.unlink(inputPath);
            gs.FS.unlink(outputPath);
        } catch {
            // Ignore cleanup errors
        }
    }
}
```

### 3.4 Web Worker for Non-blocking Compression

**File:** `src/core/pdf/ghostscript/worker.ts`

```typescript
// This file runs in a Web Worker context

import { loadGhostscript } from './loader';

interface WorkerMessage {
    type: 'compress';
    pdfBytes: Uint8Array;
    preset: string;
}

interface WorkerResponse {
    type: 'result' | 'error' | 'progress';
    data?: Uint8Array;
    error?: string;
    progress?: number;
}

self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
    const { type, pdfBytes, preset } = event.data;

    if (type === 'compress') {
        try {
            // Report loading progress
            self.postMessage({ type: 'progress', progress: 10 } as WorkerResponse);

            const gs = await loadGhostscript();

            self.postMessage({ type: 'progress', progress: 30 } as WorkerResponse);

            gs.FS.writeFile('/input.pdf', pdfBytes);

            self.postMessage({ type: 'progress', progress: 50 } as WorkerResponse);

            gs.callMain([
                '-sDEVICE=pdfwrite',
                `-dPDFSETTINGS=/${preset}`,
                '-dCompatibilityLevel=1.4',
                '-dNOPAUSE',
                '-dQUIET',
                '-dBATCH',
                '-sOutputFile=/output.pdf',
                '/input.pdf'
            ]);

            self.postMessage({ type: 'progress', progress: 90 } as WorkerResponse);

            const result = gs.FS.readFile('/output.pdf');

            self.postMessage({
                type: 'result',
                data: result
            } as WorkerResponse);

        } catch (error) {
            self.postMessage({
                type: 'error',
                error: error instanceof Error ? error.message : 'Unknown error'
            } as WorkerResponse);
        }
    }
};
```

**File:** `src/core/pdf/ghostscript/workerClient.ts`

```typescript
export function createCompressionWorker(): Worker {
    return new Worker(
        new URL('./worker.ts', import.meta.url),
        { type: 'module' }
    );
}

export function compressWithWorker(
    pdfBytes: Uint8Array,
    preset: string,
    onProgress?: (progress: number) => void
): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
        const worker = createCompressionWorker();

        worker.onmessage = (event) => {
            const response = event.data;

            switch (response.type) {
                case 'progress':
                    onProgress?.(response.progress);
                    break;
                case 'result':
                    worker.terminate();
                    resolve(response.data);
                    break;
                case 'error':
                    worker.terminate();
                    reject(new Error(response.error));
                    break;
            }
        };

        worker.onerror = (error) => {
            worker.terminate();
            reject(error);
        };

        worker.postMessage({ type: 'compress', pdfBytes, preset });
    });
}
```

---

## Phase 4: Unified Compression Manager (Week 4)

### 4.1 Create Compression Manager

**File:** `src/core/pdf/compressionManager.ts`

```typescript
import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { Canvas } from 'fabric';
import { canUseGhostscriptWASM } from './ghostscript/loader';
import { compressWithWorker } from './ghostscript/workerClient';
import { reencodeCompression } from './compressor';
import { exportToPdf, type ExportQualityOptions } from './exporter';

export type CompressionLevel = 'none' | 'light' | 'medium' | 'heavy' | 'extreme';

export interface UnifiedCompressionOptions {
    level: CompressionLevel;
    preserveText?: boolean;
    grayscale?: boolean;
    onProgress?: (progress: number, stage: string) => void;
}

export interface UnifiedCompressionResult {
    pdfBytes: Uint8Array;
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
    method: string;
    warnings?: string[];
}

const COMPRESSION_CONFIGS: Record<CompressionLevel, {
    ghostscript?: string;
    reencode?: { dpi: number; quality: number };
    basic?: ExportQualityOptions;
}> = {
    none: {
        basic: { format: 'png', quality: 1, multiplier: 2, label: 'None', description: '' }
    },
    light: {
        ghostscript: 'prepress',
        reencode: { dpi: 300, quality: 0.9 },
        basic: { format: 'jpeg', quality: 0.9, multiplier: 1.5, label: 'Light', description: '' }
    },
    medium: {
        ghostscript: 'printer',
        reencode: { dpi: 200, quality: 0.75 },
        basic: { format: 'jpeg', quality: 0.8, multiplier: 1, label: 'Medium', description: '' }
    },
    heavy: {
        ghostscript: 'ebook',
        reencode: { dpi: 150, quality: 0.6 },
        basic: { format: 'jpeg', quality: 0.65, multiplier: 1, label: 'Heavy', description: '' }
    },
    extreme: {
        ghostscript: 'screen',
        reencode: { dpi: 72, quality: 0.4 },
        basic: { format: 'jpeg', quality: 0.45, multiplier: 0.75, label: 'Extreme', description: '' }
    }
};

/**
 * Unified compression manager that automatically selects the best
 * compression strategy based on device capabilities.
 */
export async function compressPDF(
    pdfProxy: PDFDocumentProxy,
    canvases: Record<number, Canvas>,
    options: UnifiedCompressionOptions
): Promise<UnifiedCompressionResult> {
    const config = COMPRESSION_CONFIGS[options.level];
    const warnings: string[] = [];

    options.onProgress?.(5, 'Analyzing document...');

    // Strategy 1: Try Ghostscript WASM (best compression)
    if (config.ghostscript && canUseGhostscriptWASM() && options.preserveText !== false) {
        try {
            options.onProgress?.(10, 'Loading compression engine...');

            // First, export with annotations
            const annotatedPdf = await exportToPdf(pdfProxy, canvases, {
                format: 'jpeg',
                quality: 0.9,
                multiplier: 1,
                label: '',
                description: ''
            });

            options.onProgress?.(40, 'Compressing with Ghostscript...');

            const compressedBytes = await compressWithWorker(
                annotatedPdf.pdfBytes,
                config.ghostscript,
                (p) => options.onProgress?.(40 + p * 0.5, 'Compressing...')
            );

            options.onProgress?.(100, 'Complete');

            return {
                pdfBytes: compressedBytes,
                originalSize: annotatedPdf.originalSize,
                compressedSize: compressedBytes.byteLength,
                compressionRatio: 1 - (compressedBytes.byteLength / annotatedPdf.originalSize),
                method: 'ghostscript-wasm',
                warnings
            };
        } catch (error) {
            warnings.push(`Ghostscript unavailable: ${error}. Falling back to JS compression.`);
        }
    }

    // Strategy 2: JS Re-encoding (good compression, works everywhere)
    if (config.reencode && options.preserveText === false) {
        options.onProgress?.(10, 'Re-encoding pages...');

        const result = await reencodeCompression(pdfProxy, canvases, {
            quality: options.level === 'extreme' ? 'screen' : 'ebook',
            grayscale: options.grayscale
        });

        options.onProgress?.(100, 'Complete');

        return {
            ...result,
            warnings
        };
    }

    // Strategy 3: Basic JPEG compression (fallback)
    options.onProgress?.(10, 'Applying basic compression...');

    const basicResult = await exportToPdf(pdfProxy, canvases, config.basic!);

    options.onProgress?.(100, 'Complete');

    return {
        pdfBytes: basicResult.pdfBytes,
        originalSize: basicResult.originalSize,
        compressedSize: basicResult.exportedSize,
        compressionRatio: 1 - (basicResult.exportedSize / basicResult.originalSize),
        method: 'basic-jpeg',
        warnings
    };
}
```

---

## Phase 5: UI Updates (Week 5)

### 5.1 Update ExportQualityModal

**File:** `src/components/modals/ExportQualityModal.tsx`

Add new presets and options:

```typescript
const PRESET_KEYS = ['high', 'medium', 'low', 'extreme'] as const;

// Add advanced options toggle
const [showAdvanced, setShowAdvanced] = useState(false);
const [preserveText, setPreserveText] = useState(true);
const [grayscale, setGrayscale] = useState(false);

// In render:
{showAdvanced && (
    <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
        <label className="flex items-center gap-2">
            <input
                type="checkbox"
                checked={preserveText}
                onChange={(e) => setPreserveText(e.target.checked)}
            />
            <span>Preserve text selectability</span>
        </label>
        <label className="flex items-center gap-2 mt-2">
            <input
                type="checkbox"
                checked={grayscale}
                onChange={(e) => setGrayscale(e.target.checked)}
            />
            <span>Convert to grayscale</span>
        </label>
    </div>
)}
```

### 5.2 Add Progress Indicator

Show compression progress during export with stage information.

---

## Testing Plan

### Unit Tests

```typescript
// src/core/pdf/__tests__/compressor.test.ts

describe('PDF Compression', () => {
    describe('reencodeCompression', () => {
        it('should reduce file size by at least 40%', async () => {
            const result = await reencodeCompression(mockPdf, {}, { quality: 'ebook' });
            expect(result.compressionRatio).toBeGreaterThan(0.4);
        });

        it('should apply grayscale when requested', async () => {
            // Test implementation
        });
    });

    describe('compressionManager', () => {
        it('should select ghostscript on desktop with sufficient memory', () => {
            // Mock navigator.deviceMemory = 8
            expect(canUseGhostscriptWASM()).toBe(true);
        });

        it('should fallback to JS compression on mobile', () => {
            // Mock mobile user agent
            expect(canUseGhostscriptWASM()).toBe(false);
        });
    });
});
```

### Manual Testing Checklist

- [ ] Test with text-heavy PDF (should preserve text with default settings)
- [ ] Test with image-heavy PDF (should achieve >50% compression)
- [ ] Test on mobile Safari
- [ ] Test on mobile Chrome
- [ ] Test with 50+ page document
- [ ] Test memory usage doesn't exceed 200MB
- [ ] Test progress indicator accuracy
- [ ] Test error handling when WASM fails to load

---

## File Structure

```
src/core/pdf/
├── exporter.ts              # Existing - update with new presets
├── compressor.ts            # NEW - JS re-encoding compression
├── compressionManager.ts    # NEW - Unified compression interface
└── ghostscript/
    ├── loader.ts            # NEW - WASM lazy loader
    ├── compressor.ts        # NEW - GS compression logic
    ├── worker.ts            # NEW - Web Worker for non-blocking
    └── workerClient.ts      # NEW - Worker communication
```

---

## Dependencies

### Required (install via npm)
None - all core functionality uses existing dependencies (pdf-lib, pdfjs-dist)

### Optional (loaded dynamically)
- `@jspawn/ghostscript-wasm` - Loaded from CDN only when needed on desktop

---

## Rollout Strategy

1. **Phase 1**: Deploy basic enhancements (extreme preset, objectStreams)
2. **Phase 2**: Deploy JS re-encoding with feature flag
3. **Phase 3**: Deploy Ghostscript WASM (desktop only)
4. **Phase 4**: Full rollout with unified compression manager

---

## Performance Benchmarks (Expected)

| Method | 10-page PDF | Compression | Time | Memory |
|--------|-------------|-------------|------|--------|
| Basic JPEG | 5MB → 3MB | 40% | 1s | 50MB |
| JS Re-encode | 5MB → 1.5MB | 70% | 3s | 100MB |
| Ghostscript | 5MB → 0.8MB | 84% | 5s | 150MB |

---

## References

- [Ghostscript WASM Demo](https://laurentmmeyer.github.io/ghostscript-pdf-compress.wasm/)
- [pdf-lib Documentation](https://pdf-lib.js.org/)
- [iLovePDF Compression Levels](https://www.ilovepdf.com/compress_pdf)
- [PDF Optimization Best Practices](https://www.adobe.com/acrobat/resources/document-files/pdf/optimize-pdf.html)
