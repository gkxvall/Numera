"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
import { Modal } from "@/components/Modal";
import { getPowerUpDefinition } from "@/config/powerUps";
import type { Player, PowerUpId } from "@/game-engine/types";

export interface PowerUpActivation {
  powerUpId: PowerUpId;
  targetPlayerId?: string;
  amount?: number;
}

export interface PowerUpInventoryProps {
  player: Player;
  otherActivePlayers: Player[];
  disabled: boolean;
  onActivate: (activation: PowerUpActivation) => void;
}

export function PowerUpInventory({
  player,
  otherActivePlayers,
  disabled,
  onActivate,
}: PowerUpInventoryProps) {
  const [openPowerUpId, setOpenPowerUpId] = useState<PowerUpId | null>(null);
  const [targetPlayerId, setTargetPlayerId] = useState<string | null>(null);
  const [amount, setAmount] = useState<number | null>(null);

  if (player.powerUps.length === 0) {
    return null;
  }

  const openDefinition = openPowerUpId ? getPowerUpDefinition(openPowerUpId) : null;

  function closeModal() {
    setOpenPowerUpId(null);
    setTargetPlayerId(null);
    setAmount(null);
  }

  function confirmActivation() {
    if (!openPowerUpId) return;
    onActivate({
      powerUpId: openPowerUpId,
      targetPlayerId: targetPlayerId ?? undefined,
      amount: amount ?? undefined,
    });
    closeModal();
  }

  const needsTarget = openDefinition?.needsTargetPlayer ?? false;
  const needsAmount = Boolean(openDefinition?.needsAmount);
  const canConfirm = (!needsTarget || targetPlayerId !== null) && (!needsAmount || amount !== null);

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-foreground/60 text-xs font-semibold uppercase">Power-ups</span>
      <div className="flex flex-wrap justify-center gap-2" role="group" aria-label="Your power-ups">
        {player.powerUps.map((entry) => {
          const definition = getPowerUpDefinition(entry.powerUpId);
          return (
            <Button
              key={entry.powerUpId}
              size="sm"
              variant="secondary"
              disabled={disabled}
              onClick={() => setOpenPowerUpId(entry.powerUpId)}
            >
              {definition.label}
              {entry.quantity > 1 && ` ×${entry.quantity}`}
            </Button>
          );
        })}
      </div>

      <Modal
        isOpen={openDefinition !== null}
        onClose={closeModal}
        title={openDefinition?.label ?? ""}
      >
        {openDefinition && (
          <div className="flex flex-col gap-4">
            <p className="text-foreground/80 text-sm">{openDefinition.description}</p>

            {openDefinition.needsTargetPlayer && (
              <div className="flex flex-col gap-2">
                <span className="text-foreground/60 text-xs font-semibold uppercase">
                  Choose a player
                </span>
                <div className="flex flex-wrap gap-2">
                  {otherActivePlayers.map((candidate) => (
                    <Button
                      key={candidate.id}
                      size="sm"
                      variant={targetPlayerId === candidate.id ? "primary" : "ghost"}
                      onClick={() => setTargetPlayerId(candidate.id)}
                    >
                      {candidate.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {openDefinition.needsAmount && (
              <div className="flex flex-col gap-2">
                <span className="text-foreground/60 text-xs font-semibold uppercase">
                  Choose an amount
                </span>
                <div className="flex gap-2">
                  {Array.from(
                    { length: openDefinition.needsAmount.max - openDefinition.needsAmount.min + 1 },
                    (_, i) => openDefinition.needsAmount!.min + i,
                  ).map((value) => (
                    <Button
                      key={value}
                      size="sm"
                      variant={amount === value ? "primary" : "ghost"}
                      onClick={() => setAmount(value)}
                    >
                      -{value}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <Button size="lg" onClick={confirmActivation} disabled={!canConfirm} fullWidth>
              Use {openDefinition.label}
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
