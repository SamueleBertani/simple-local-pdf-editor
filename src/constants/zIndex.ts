/**
 * Centralized Z-Index management to prevent layer conflicts.
 *
 * Hierarchy (lowest to highest):
 * - CANVAS.BASE: 0 (Canvas background)
 * - CANVAS.OVERLAY: 10 (Canvas overlays, annotations)
 * - UI.SIDEBAR / UI.SETTINGS_DRAWER: 10 (HTML sidebars - stacking context isolated)
 * - UI.MOBILE_HEADER: 20 (Mobile header bar)
 * - UI.MOBILE_TOOLBAR: 30 (Mobile bottom toolbar)
 * - UI.FLOATING_CONTROLS: 50 (ZoomControls, floating buttons)
 * - MODAL.BACKDROP: 50 (Modal backdrop overlay)
 * - CANVAS.DRAG_PREVIEW: 60 (Items being dragged - above floating controls)
 * - MODAL.CONTENT: 60 (Modal content)
 * - UI.NOTIFICATIONS: 100 (Toast notifications - always on top)
 */
export const Z_INDEX = {
    CANVAS: {
        BASE: 0,
        OVERLAY: 10,
        DRAG_PREVIEW: 60,
    },
    UI: {
        SIDEBAR: 10,
        SETTINGS_DRAWER: 10,
        MOBILE_HEADER: 20,
        MOBILE_TOOLBAR: 30,
        FLOATING_CONTROLS: 50,
        NOTIFICATIONS: 100,
    },
    MODAL: {
        BACKDROP: 50,
        CONTENT: 60,
    }
} as const;
