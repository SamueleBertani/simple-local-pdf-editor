import { useUndoRedoShortcuts } from './shortcuts/useUndoRedoShortcuts';
import { useCopyPasteShortcuts } from './shortcuts/useCopyPasteShortcuts';
import { useObjectManipulationShortcuts } from './shortcuts/useObjectManipulationShortcuts';
import { useToolShortcuts } from './shortcuts/useToolShortcuts';
import { useExportShortcuts, type ExportCallbacks } from './shortcuts/useExportShortcuts';

export function useShortcuts(exportCallbacks?: ExportCallbacks) {
    useUndoRedoShortcuts();
    useCopyPasteShortcuts();
    useObjectManipulationShortcuts();
    useToolShortcuts();
    useExportShortcuts(exportCallbacks);
}

