/**
 * Centralized Z-Index management.
 *
 * LAYER HIERARCHY (lowest to highest):
 * ------------------------------------
 * 1. Canvas layers (0-50) - PDF pages and annotations
 * 2. UI Elements (100-150) - Sidebars, toolbars, floating controls
 * 3. Modals (200-210) - Dialogs that block interaction
 * 4. Notifications (300) - Always on top
 *
 * Note: Modals use createPortal to document.body, so they are siblings
 * of #root and need explicit z-index higher than all app content.
 */
export const Z_INDEX = {
    // Canvas layers (inside PDFViewer)
    CANVAS: {
        BASE: 0,
        OVERLAY: 10,
        DRAG_PREVIEW: 50,
    },
    // UI Elements
    UI: {
        SIDEBAR: 100,
        SETTINGS_DRAWER: 100,
        MOBILE_HEADER: 110,
        MOBILE_TOOLBAR: 110,
        FLOATING_CONTROLS: 120,
        NOTIFICATIONS: 300,
    },
    // Modals (portaled to body, must be above all app content)
    MODAL: {
        BACKDROP: 200,
        CONTENT: 210,
    }
} as const;
