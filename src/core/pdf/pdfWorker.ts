import * as pdfjsLib from 'pdfjs-dist';

// Configure the worker src
// In Vite, we can import the worker script as a URL
// This ensures it works in production build as well
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
).toString();

export const PDFJS = pdfjsLib;
