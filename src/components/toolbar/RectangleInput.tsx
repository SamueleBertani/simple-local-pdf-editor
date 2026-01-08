import { useToolStore } from '../../store/useToolStore';
import { ColorPicker } from './ColorPicker';

export function RectangleInput() {
    const { activeTool, toolSettings, setToolSettings } = useToolStore();

    if (activeTool !== 'rectangle') return null;

    return (
        <div className="w-full flex flex-col gap-6">
            <div className="space-y-6">
                <ColorPicker
                    label="Fill Color"
                    colors={['#FFFFFF', '#000000', '#F3F4F6', '#EF4444', '#3B82F6', '#F59E0B']}
                    value={toolSettings.color}
                    onChange={(color) => setToolSettings({ color })}
                />

                <p className="text-xs text-slate-400 text-center mt-4">
                    Click and drag on canvas to cover
                </p>
            </div>
        </div>
    );
}
