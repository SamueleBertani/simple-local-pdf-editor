import { Object as FabricObject } from 'fabric';
import type { TEvent } from 'fabric';

/**
 * Common settings shared across different tools.
 */
export interface ToolSettings {
    color: string;
    width: number;
    opacity: number;
    fontSize: number;
    fontFamily: string;
}

/**
 * Represents a serialized Fabric.js object (result of toObject()).
 * Used for clipboard, history, and storage.
 */
export interface SerializedFabricObject {
    id?: string;
    type: string;
    left: number;
    top: number;
    width?: number;
    height?: number;
    scaleX?: number;
    scaleY?: number;
    fill?: string | object;
    stroke?: string | object;
    strokeWidth?: number;
    text?: string;
    fontFamily?: string;
    fontSize?: number;
    angle?: number;
    opacity?: number;
    [key: string]: unknown; // Allow other fabric properties
}

/**
 * Extended Fabric Object with custom properties.
 */
export interface CustomFabricObject extends FabricObject {
    id?: string;
    data?: {
        isGhost?: boolean;
        stampUrl?: string;
        [key: string]: unknown;
    };
}

/**
 * Typed Fabric Event.
 * Provides better type safety than basic IEvent.
 */
export interface FabricCanvasEvent extends TEvent {
    target?: CustomFabricObject;
    selected?: CustomFabricObject[];
}

/**
 * Type guard to check if a FabricObject is a CustomFabricObject.
 * CustomFabricObject extends FabricObject with optional id and data properties.
 */
export function isCustomFabricObject(obj: FabricObject | undefined | null): obj is CustomFabricObject {
    return obj !== null && obj !== undefined;
}

/**
 * Safely cast a FabricObject to CustomFabricObject.
 * Returns undefined if the object is null/undefined.
 */
export function asCustomFabricObject(obj: FabricObject | undefined | null): CustomFabricObject | undefined {
    return isCustomFabricObject(obj) ? obj : undefined;
}

/**
 * Cast an array of FabricObjects to CustomFabricObjects.
 */
export function asCustomFabricObjects(objects: FabricObject[]): CustomFabricObject[] {
    return objects as CustomFabricObject[];
}
