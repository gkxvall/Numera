import { AVATARS } from "@/config/avatars";
import { Avatar } from "@/components/Avatar";
import { cn } from "@/lib/cn";

export interface AvatarPickerProps {
  colorId: string;
  selectedAvatarId: string;
  onSelect: (avatarId: string) => void;
  label: string;
}

export function AvatarPicker({ colorId, selectedAvatarId, onSelect, label }: AvatarPickerProps) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
      {AVATARS.map((avatar) => {
        const isSelected = avatar.id === selectedAvatarId;
        return (
          <button
            key={avatar.id}
            type="button"
            onClick={() => onSelect(avatar.id)}
            aria-pressed={isSelected}
            aria-label={avatar.label}
            className={cn(
              "rounded-full transition-transform",
              "focus-visible:ring-numera-blue focus-visible:ring-4 focus-visible:outline-none",
              isSelected
                ? "ring-numera-outline scale-110 ring-4 ring-offset-2"
                : "opacity-70 hover:opacity-100",
            )}
          >
            <Avatar avatarId={avatar.id} colorId={colorId} size={40} />
          </button>
        );
      })}
    </div>
  );
}
