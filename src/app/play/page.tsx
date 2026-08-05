"use client";

import Link from "next/link";
import { Container, Card, Button, PlayerChip, Badge } from "@/components";
import { useActiveMatchStore } from "@/stores/activeMatchStore";

export default function PlayPage() {
  const match = useActiveMatchStore((state) => state.match);
  const abandonAndClear = useActiveMatchStore((state) => state.abandonAndClear);

  if (!match) {
    return (
      <Container maxWidth="sm" className="flex flex-col items-center gap-4 py-16 text-center">
        <h1 className="font-display text-foreground text-2xl">No match in progress</h1>
        <p className="text-foreground/70">Set up players and match settings to start one.</p>
        <Link href="/setup/players">
          <Button>Set up a match</Button>
        </Link>
      </Container>
    );
  }

  const activePlayer = match.players.find(
    (player) => player.id === match.playerOrder[match.activePlayerIndex],
  );

  return (
    <Container maxWidth="sm" className="flex flex-col gap-6 py-8">
      <Badge tone="blue">Round {match.currentRound}</Badge>
      <h1 className="font-display text-foreground text-3xl">Match created</h1>
      <p className="text-foreground/70 text-sm">
        The engine and match setup are fully working — the full gameplay screen (counter, move
        buttons, pass-the-phone flow) arrives in Stage 5. This page only confirms the pipeline works
        end to end.
      </p>

      <Card className="flex flex-col items-center gap-3">
        <span className="text-foreground/60 text-xs font-semibold uppercase">Current turn</span>
        {activePlayer && (
          <PlayerChip
            name={activePlayer.name}
            colorId={activePlayer.colorId}
            avatarId={activePlayer.avatarId}
            lives={activePlayer.lives}
            maxLives={activePlayer.maxLives}
            isActive
            size="lg"
          />
        )}
      </Card>

      <Card className="flex flex-col gap-2">
        <span className="text-foreground/60 text-xs font-semibold uppercase">Players</span>
        <div className="flex flex-wrap gap-4">
          {match.players.map((player) => (
            <PlayerChip
              key={player.id}
              name={player.name}
              colorId={player.colorId}
              avatarId={player.avatarId}
              lives={player.lives}
              maxLives={player.maxLives}
              isEliminated={player.isEliminated}
              size="sm"
            />
          ))}
        </div>
      </Card>

      <Button
        variant="danger"
        onClick={() => {
          abandonAndClear();
        }}
      >
        Abandon match
      </Button>
    </Container>
  );
}
