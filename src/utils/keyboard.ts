/**
 * Checks if the keyboard event target is an input field.
 * Used to prevent shortcuts from firing when typing in inputs.
 */
export function isInputFocused(e: KeyboardEvent): boolean {
    return e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;
}
