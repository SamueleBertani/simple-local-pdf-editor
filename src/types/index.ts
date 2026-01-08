import { Object as FabricObject, IEvent } from 'fabric';

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
    [key: string]: any; // Allow other fabric properties
}

/**
 * Extended Fabric Object with custom properties.
 */
export interface CustomFabricObject extends FabricObject {
    id?: string;
    data?: {
        isGhost?: boolean;
        stampUrl?: string;
        [key: string]: any;
    };
}

/**
 * Typed Fabric Event.
 * Provides better type safety than basic IEvent.
 */
export interface FabricCanvasEvent extends IEvent {
    target?: CustomFabricObject;
    selected?: CustomFabricObject[];
}
