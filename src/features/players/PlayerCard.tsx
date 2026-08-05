import { Bot, ChevronDown, ChevronUp, Copy, Trash2 } from "lucide-react";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import type { BotDifficulty } from "@/game-engine/types";
import type { PlayerDraft } from "./schemas";
import { AvatarPicker } from "./AvatarPicker";
import { ColorPicker } from "./ColorPicker";

const BOT_DIFFICULTIES: BotDifficulty[] = [
  "random",
  "careful",
  "balanced",
  "aggressive",
  "trickster",
];

export interface PlayerCardProps {
  player: PlayerDraft;
  index: number;
  canMoveUp: boolean;
  canMoveDown: boolean;
  canRemove: boolean;
  onUpdate: (updates: Partial<Omit<PlayerDraft, "id">>) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  nameError?: string;
}

export function PlayerCard({
  player,
  index,
  canMoveUp,
  canMoveDown,
  canRemove,
  onUpdate,
  onRemove,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  nameError,
}: PlayerCardProps) {
  const nameFieldId = `player-name-${player.id}`;
  const errorId = `player-name-error-${player.id}`;

  return (
    <Card className="flex flex-col gap-3" padding="md">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-1 flex-col gap-1">
          <label
            htmlFor={nameFieldId}
            className="text-foreground/70 text-xs font-semibold uppercase"
          >
            Player {index + 1}
          </label>
          <input
            id={nameFieldId}
            type="text"
            value={player.name}
            maxLength={16}
            onChange={(event) => onUpdate({ name: event.target.value })}
            aria-invalid={Boolean(nameError)}
            aria-describedby={nameError ? errorId : undefined}
            className="border-numera-outline focus-visible:ring-numera-blue h-11 rounded-xl border-2 px-3 text-base focus-visible:ring-4 focus-visible:outline-none"
            placeholder={`Player ${index + 1}`}
          />
          {nameError && (
            <p id={errorId} className="text-numera-red text-xs font-semibold">
              {nameError}
            </p>
          )}
        </div>

        <div className="flex flex-col items-end gap-1">
          <div className="flex gap-1">
            <button
              type="button"
              onClick={onMoveUp}
              disabled={!canMoveUp}
              aria-label={`Move ${player.name || `Player ${index + 1}`} up`}
              className="border-numera-outline flex h-9 w-9 items-center justify-center rounded-full border-2 disabled:opacity-30"
            >
              <ChevronUp size={16} />
            </button>
            <button
              type="button"
              onClick={onMoveDown}
              disabled={!canMoveDown}
              aria-label={`Move ${player.name || `Player ${index + 1}`} down`}
              className="border-numera-outline flex h-9 w-9 items-center justify-center rounded-full border-2 disabled:opacity-30"
            >
              <ChevronDown size={16} />
            </button>
          </div>
          {player.isBot && (
            <Badge tone="purple" icon={<Bot size={12} />}>
              Bot
            </Badge>
          )}
        </div>
      </div>

      <AvatarPicker
        colorId={player.colorId}
        selectedAvatarId={player.avatarId}
        onSelect={(avatarId) => onUpdate({ avatarId })}
        label={`Avatar for ${player.name || `Player ${index + 1}`}`}
      />

      <ColorPicker
        selectedColorId={player.colorId}
        onSelect={(colorId) => onUpdate({ colorId })}
        label={`Color for ${player.name || `Player ${index + 1}`}`}
      />

      {player.isBot && (
        <div className="flex flex-col gap-1">
          <label
            htmlFor={`bot-difficulty-${player.id}`}
            className="text-foreground/70 text-xs font-semibold uppercase"
          >
            Bot personality
          </label>
          <select
            id={`bot-difficulty-${player.id}`}
            value={player.botDifficulty ?? "balanced"}
            onChange={(event) => onUpdate({ botDifficulty: event.target.value as BotDifficulty })}
            className="border-numera-outline h-11 rounded-xl border-2 px-3 text-base capitalize"
          >
            {BOT_DIFFICULTIES.map((difficulty) => (
              <option key={difficulty} value={difficulty}>
                {difficulty}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onDuplicate}
          className="border-numera-outline flex items-center gap-1 rounded-full border-2 px-3 py-1.5 text-sm font-semibold"
        >
          <Copy size={14} /> Duplicate
        </button>
        <button
          type="button"
          onClick={onRemove}
          disabled={!canRemove}
          className="border-numera-outline text-numera-red flex items-center gap-1 rounded-full border-2 px-3 py-1.5 text-sm font-semibold disabled:opacity-30"
        >
          <Trash2 size={14} /> Remove
        </button>
      </div>
    </Card>
  );
}
