/**
 * Generates a unique ID.
 * Uses `crypto.randomUUID()` if available for high collision resistance.
 * Fallbacks to a robust `Math.random()` implementation if necessary.
 * 
 * Note: The 'length' parameter is ignored when using native UUIDs as they have a fixed format,
 * but is kept for compatibility if we ever switch strategies or need specific lengths.
 */
export function generateId(length: number = 9): string {
    // Modern, secure, standard way (UUID v4)
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }

    // Fallback for older environments or non-secure contexts
    // Generates a random string of specified length using base-36
    return Math.random().toString(36).substring(2, 2 + length);
}
