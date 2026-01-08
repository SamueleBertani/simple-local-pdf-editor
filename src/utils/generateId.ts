/**
 * Generates a unique ID.
 * Uses `crypto.randomUUID()` if available for high collision resistance.
 * Falls back to a `Math.random()` implementation for older environments.
 */
export function generateId(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return Math.random().toString(36).substring(2, 11);
}
