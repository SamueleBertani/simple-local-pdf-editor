/**
 * Tool identifiers used across the application.
 */
export const TOOLS = {
    SELECT: 'select',
    HANDWRITING: 'handwriting',
    TEXT: 'text',
    RECTANGLE: 'rectangle',
    IMAGE: 'image',
    STAMP: 'stamp',
} as const;

export type ToolType = typeof TOOLS[keyof typeof TOOLS];

/**
 * List of tools that require a ghost object preview.
 */
export const GHOST_TOOLS = [TOOLS.TEXT, TOOLS.IMAGE, TOOLS.STAMP, TOOLS.HANDWRITING];

/**
 * List of tools that have sidebar settings.
 */
export const HAS_SETTINGS_TOOLS = [TOOLS.HANDWRITING, TOOLS.TEXT, TOOLS.RECTANGLE, TOOLS.STAMP];
