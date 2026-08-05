"use client";

import { useRouter } from "next/navigation";
import { Container } from "@/components";
import { MatchSettingsForm } from "@/features/game/MatchSettingsForm";
import { useMatchSetupStore, normalizeNamesForValidation } from "@/stores/matchSetupStore";
import { startNewMatch } from "@/stores/activeMatchStore";
import { createMatch, createPlayer } from "@/game-engine/engine";

export default function MatchSettingsPage() {
  const router = useRouter();
  const players = useMatchSetupStore((state) => state.players);
  const settings = useMatchSetupStore((state) => state.settings);

  function handleStartMatch() {
    const normalizedPlayers = normalizeNamesForValidation(players);
    const enginePlayers = normalizedPlayers.map((player) =>
      createPlayer({
        id: player.id,
        name: player.name,
        avatarId: player.avatarId,
        colorId: player.colorId,
        isBot: player.isBot,
      }),
    );
    const match = createMatch(crypto.randomUUID(), settings, enginePlayers);
    startNewMatch(match);
    router.push("/play");
  }

  return (
    <Container maxWidth="sm" className="py-8">
      <MatchSettingsForm
        onBack={() => router.push("/setup/players")}
        onStartMatch={handleStartMatch}
      />
    </Container>
  );
}
