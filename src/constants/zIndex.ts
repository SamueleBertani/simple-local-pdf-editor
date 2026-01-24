/**
 * Centralized Z-Index management to prevent layer conflicts.
 * 
 * Layers:
 * - BASE: 0-9 (Canvas, background)
 * - OVERLAY: 10-19 (Canvas overlays, annotations)
 * - DRAGGING: 50 (Items being dragged)
 * - UI: 20-49 (Floating UI in canvas)
 * - SIDEBAR: 10 (HTML Sidebars - low because they are usually naturally strictly stacked context)
 * - HEADER: 20 (Mobile header)
 * - TOOLBAR: 30 (Mobile bottom toolbar)
 * - MODAL: 50+ (Dialogs)
 */
export const Z_INDEX = {
    CANVAS: {
        BASE: 0,
        OVERLAY: 10,
        DRAG_PREVIEW: 50,
    },
    UI: {
        SIDEBAR: 10,
        MOBILE_HEADER: 20,
        MOBILE_TOOLBAR: 30,
        SETTINGS_DRAWER: 10,
        NOTIFICATIONS: 100,
        FLOATING_CONTROLS: 50, // For ZoomControls etc.
    },
    MODAL: {
        BACKDROP: 40,
        CONTENT: 50,
    }
} as const;
