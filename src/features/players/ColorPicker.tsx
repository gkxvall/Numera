import { PLAYER_COLORS } from "@/config/playerColors";
import { cn } from "@/lib/cn";

export interface ColorPickerProps {
  selectedColorId: string;
  onSelect: (colorId: string) => void;
  label: string;
}

export function ColorPicker({ selectedColorId, onSelect, label }: ColorPickerProps) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
      {PLAYER_COLORS.map((color) => {
        const isSelected = color.id === selectedColorId;
        return (
          <button
            key={color.id}
            type="button"
            onClick={() => onSelect(color.id)}
            aria-pressed={isSelected}
            aria-label={color.label}
            className={cn(
              "border-numera-outline h-9 w-9 rounded-full border-4 transition-transform",
              "focus-visible:ring-numera-blue focus-visible:ring-4 focus-visible:outline-none",
              color.bgClassName,
              isSelected ? "scale-110 ring-4 ring-offset-2" : "opacity-70 hover:opacity-100",
            )}
          >
            {isSelected && <span className="sr-only">Selected</span>}
          </button>
        );
      })}
    </div>
  );
}
