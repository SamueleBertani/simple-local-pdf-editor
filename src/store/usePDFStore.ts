import { create } from 'zustand';
import * as pdfjsLib from 'pdfjs-dist';

interface PDFState {
    pdfDocument: pdfjsLib.PDFDocumentProxy | null;
    pages: { viewport: pdfjsLib.PageViewport; pageNumber: number }[];
    scale: number;
    canvases: Record<number, any>; // using any for fabric.Canvas to avoid circular dep or complex types here
    setPdfDocument: (doc: pdfjsLib.PDFDocumentProxy) => void;
    setPages: (pages: { viewport: pdfjsLib.PageViewport; pageNumber: number }[]) => void;
    setScale: (scale: number) => void;
    registerCanvas: (pageIndex: number, canvas: any) => void;
    unregisterCanvas: (pageIndex: number) => void;
}

export const usePDFStore = create<PDFState>((set) => ({
    pdfDocument: null,
    pages: [],
    scale: 1,
    canvases: {},
    setPdfDocument: (doc) => set({ pdfDocument: doc }),
    setPages: (pages) => set({ pages }),
    setScale: (scale) => set({ scale }),
    registerCanvas: (pageIndex, canvas) =>
        set((state) => ({ canvases: { ...state.canvases, [pageIndex]: canvas } })),
    unregisterCanvas: (pageIndex) =>
        set((state) => {
            const newCanvases = { ...state.canvases };
            delete newCanvases[pageIndex];
            return { canvases: newCanvases };
        }),
}));
