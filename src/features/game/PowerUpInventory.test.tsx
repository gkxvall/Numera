import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PowerUpInventory } from "./PowerUpInventory";
import { createPlayer } from "@/game-engine/engine";

function withPowerUps(...ids: Array<[import("@/game-engine/types").PowerUpId, number]>) {
  const player = createPlayer({ id: "p1", name: "Maya", avatarId: "spike", colorId: "blue" });
  return { ...player, powerUps: ids.map(([powerUpId, quantity]) => ({ powerUpId, quantity })) };
}

describe("PowerUpInventory", () => {
  it("renders nothing when the player has no power-ups", () => {
    const player = createPlayer({ id: "p1", name: "Maya", avatarId: "spike", colorId: "blue" });
    const { container } = render(
      <PowerUpInventory
        player={player}
        otherActivePlayers={[]}
        disabled={false}
        onActivate={vi.fn()}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("activates a simple power-up (no extra params) after opening its modal", async () => {
    const user = userEvent.setup();
    const onActivate = vi.fn();
    const player = withPowerUps(["reverse", 1]);
    render(
      <PowerUpInventory
        player={player}
        otherActivePlayers={[]}
        disabled={false}
        onActivate={onActivate}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Reverse" }));
    expect(screen.getByText(/Reverses the turn order/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Use Reverse" }));

    expect(onActivate).toHaveBeenCalledWith({
      powerUpId: "reverse",
      targetPlayerId: undefined,
      amount: undefined,
    });
  });

  it("requires a target player to be chosen before Swap can be confirmed", async () => {
    const user = userEvent.setup();
    const onActivate = vi.fn();
    const player = withPowerUps(["swap", 1]);
    const target = createPlayer({ id: "p2", name: "Theo", avatarId: "grin", colorId: "red" });
    render(
      <PowerUpInventory
        player={player}
        otherActivePlayers={[target]}
        disabled={false}
        onActivate={onActivate}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Swap" }));
    expect(screen.getByRole("button", { name: "Use Swap" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Theo" }));
    expect(screen.getByRole("button", { name: "Use Swap" })).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "Use Swap" }));
    expect(onActivate).toHaveBeenCalledWith({
      powerUpId: "swap",
      targetPlayerId: "p2",
      amount: undefined,
    });
  });

  it("requires an amount to be chosen before Counter Pushback can be confirmed", async () => {
    const user = userEvent.setup();
    const onActivate = vi.fn();
    const player = withPowerUps(["counterPushback", 1]);
    render(
      <PowerUpInventory
        player={player}
        otherActivePlayers={[]}
        disabled={false}
        onActivate={onActivate}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Pushback" }));
    expect(screen.getByRole("button", { name: "Use Pushback" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "-2" }));
    await user.click(screen.getByRole("button", { name: "Use Pushback" }));

    expect(onActivate).toHaveBeenCalledWith({
      powerUpId: "counterPushback",
      targetPlayerId: undefined,
      amount: 2,
    });
  });

  it("disables the inventory buttons while disabled", () => {
    const player = withPowerUps(["reverse", 1]);
    render(
      <PowerUpInventory player={player} otherActivePlayers={[]} disabled onActivate={vi.fn()} />,
    );
    expect(screen.getByRole("button", { name: "Reverse" })).toBeDisabled();
  });

  it("shows the remaining quantity when a power-up has more than one charge", () => {
    const player = withPowerUps(["shield", 2]);
    render(
      <PowerUpInventory
        player={player}
        otherActivePlayers={[]}
        disabled={false}
        onActivate={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "Shield ×2" })).toBeInTheDocument();
  });
});
