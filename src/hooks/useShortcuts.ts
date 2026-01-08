import { useUndoRedoShortcuts } from './shortcuts/useUndoRedoShortcuts';
import { useCopyPasteShortcuts } from './shortcuts/useCopyPasteShortcuts';
import { useObjectManipulationShortcuts } from './shortcuts/useObjectManipulationShortcuts';

export function useShortcuts() {
    useUndoRedoShortcuts();
    useCopyPasteShortcuts();
    useObjectManipulationShortcuts();
}

