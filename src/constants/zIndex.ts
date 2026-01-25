/**
 * Centralized Z-Index management.
 * 
 * STRATEGY: Isolation & Semantic Layers
 * -------------------------------------
 * We use `isolation: isolate` on the PDFViewer to create a new Stacking Context.
 * This effectively "traps" the high z-indices of dragged items (50) inside the viewer,
 * preventing them from leaking out and covering Modals.
 * 
 * GLOBAL CONTEXT (App Root):
 * - UI Elements (Sidebars, Toolbars): 10-30
 * - Modals: 50+
 * - Notifications: 100+
 * 
 * LOCAL CONTEXT (Inside Isolated PDFViewer):
 * - Canvas Layers: 0-10
 * - Dragged Items: 50 (Contained)
 */
export const Z_INDEX = {
    // Local Context (inside isolated viewer)
    CANVAS: {
        BASE: 0,
        OVERLAY: 10,
        DRAG_PREVIEW: 50,
    },
    // Global Context
    UI: {
        SIDEBAR: 10,
        SETTINGS_DRAWER: 10,
        MOBILE_HEADER: 20,
        MOBILE_TOOLBAR: 20,
        FLOATING_CONTROLS: 30,
        NOTIFICATIONS: 100,
    },
    MODAL: {
        BACKDROP: 50,
        CONTENT: 60,
    }
} as const;
