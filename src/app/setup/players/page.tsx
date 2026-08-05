"use client";

import { useRouter } from "next/navigation";
import { Container } from "@/components";
import { PlayerSetupScreen } from "@/features/players/PlayerSetupScreen";

export default function PlayerSetupPage() {
  const router = useRouter();

  return (
    <Container maxWidth="sm" className="py-8">
      <PlayerSetupScreen onContinue={() => router.push("/setup/match")} />
    </Container>
  );
}
