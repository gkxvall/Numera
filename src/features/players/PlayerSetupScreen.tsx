"use client";

import { useMemo } from "react";
import { Bot, Shuffle, UserPlus } from "lucide-react";
import { Button } from "@/components/Button";
import { useMatchSetupStore } from "@/stores/matchSetupStore";
import { MAX_PLAYERS, MIN_PLAYERS, playerRosterSchema } from "./schemas";
import { PlayerCard } from "./PlayerCard";

export interface PlayerSetupScreenProps {
  onContinue: () => void;
}

export function PlayerSetupScreen({ onContinue }: PlayerSetupScreenProps) {
  const players = useMatchSetupStore((state) => state.players);
  const addPlayer = useMatchSetupStore((state) => state.addPlayer);
  const addBot = useMatchSetupStore((state) => state.addBot);
  const removePlayer = useMatchSetupStore((state) => state.removePlayer);
  const updatePlayer = useMatchSetupStore((state) => state.updatePlayer);
  const duplicatePlayer = useMatchSetupStore((state) => state.duplicatePlayer);
  const reorderPlayers = useMatchSetupStore((state) => state.reorderPlayers);
  const randomizeAll = useMatchSetupStore((state) => state.randomizeAll);

  const validation = useMemo(() => playerRosterSchema.safeParse(players), [players]);
  const fieldErrors = useMemo(() => {
    if (validation.success) return new Map<string, string>();
    const map = new Map<string, string>();
    for (const issue of validation.error.issues) {
      const index = issue.path[0];
      if (typeof index === "number" && issue.path[1] === "name") {
        const player = players[index];
        if (player) map.set(player.id, issue.message);
      }
    }
    return map;
  }, [validation, players]);

  const rosterError =
    !validation.success && fieldErrors.size === 0
      ? validation.error.issues.find((issue) => issue.path.length === 0)?.message
      : undefined;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-foreground text-3xl">Add players</h1>
        <span className="text-foreground/60 text-sm font-semibold">
          {players.length} / {MAX_PLAYERS}
        </span>
      </div>

      <div className="flex flex-col gap-4">
        {players.map((player, index) => (
          <PlayerCard
            key={player.id}
            player={player}
            index={index}
            canMoveUp={index > 0}
            canMoveDown={index < players.length - 1}
            canRemove={players.length > MIN_PLAYERS}
            onUpdate={(updates) => updatePlayer(player.id, updates)}
            onRemove={() => removePlayer(player.id)}
            onDuplicate={() => duplicatePlayer(player.id)}
            onMoveUp={() => reorderPlayers(index, index - 1)}
            onMoveDown={() => reorderPlayers(index, index + 1)}
            nameError={fieldErrors.get(player.id)}
          />
        ))}
      </div>

      {rosterError && (
        <p role="alert" className="text-numera-red text-sm font-semibold">
          {rosterError}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<UserPlus size={16} />}
          onClick={addPlayer}
          disabled={players.length >= MAX_PLAYERS}
        >
          Add player
        </Button>
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<Bot size={16} />}
          onClick={() => addBot()}
          disabled={players.length >= MAX_PLAYERS}
        >
          Add bot
        </Button>
        <Button variant="ghost" size="sm" leftIcon={<Shuffle size={16} />} onClick={randomizeAll}>
          Randomize all
        </Button>
      </div>

      <Button size="lg" onClick={onContinue} disabled={!validation.success} fullWidth>
        Continue
      </Button>
    </div>
  );
}
