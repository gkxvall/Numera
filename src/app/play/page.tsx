"use client";

import { useRouter } from "next/navigation";
import { Container } from "@/components";
import { GameplayScreen } from "@/features/game/GameplayScreen";

export default function PlayPage() {
  const router = useRouter();

  return (
    <Container maxWidth="sm" className="flex flex-1 flex-col py-6">
      <GameplayScreen onExit={() => router.push("/setup/players")} />
    </Container>
  );
}
