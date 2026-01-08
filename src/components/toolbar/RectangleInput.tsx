import { useToolStore } from '../../store/useToolStore';
import { ColorPicker } from './ColorPicker';

const RECTANGLE_COLORS = ['#FFFFFF', '#000000', '#F3F4F6', '#EF4444', '#3B82F6', '#F59E0B'] as const;

export function RectangleInput() {
    const { toolSettings, setToolSettings } = useToolStore();

    return (
        <div className="w-full flex flex-col gap-6">
            <div className="space-y-6">
                <ColorPicker
                    label="Fill Color"
                    colors={RECTANGLE_COLORS}
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
