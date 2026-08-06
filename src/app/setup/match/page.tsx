"use client";

import { useRouter } from "next/navigation";
import { Container } from "@/components";
import { MatchSettingsForm } from "@/features/game/MatchSettingsForm";
import { buildMatchFromCurrentSetup } from "@/features/game/createMatchFromSetup";
import { startNewMatch } from "@/stores/activeMatchStore";

export default function MatchSettingsPage() {
  const router = useRouter();

  function handleStartMatch() {
    const match = buildMatchFromCurrentSetup();
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
