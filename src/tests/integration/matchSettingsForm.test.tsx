import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MatchSettingsForm } from "@/features/game/MatchSettingsForm";
import { useMatchSetupStore } from "@/stores/matchSetupStore";

beforeEach(() => {
  localStorage.clear();
  useMatchSetupStore.getState().resetToDefaults();
});

describe("MatchSettingsForm", () => {
  it("shows the plan's default settings (§6.2)", () => {
    render(<MatchSettingsForm onBack={vi.fn()} onStartMatch={vi.fn()} />);
    expect(screen.getByLabelText("Starting lives")).toHaveValue(1);
    expect(screen.getByLabelText("Min target")).toHaveValue(20);
    expect(screen.getByLabelText("Max target")).toHaveValue(40);
    expect(screen.getByLabelText("Maximum move (+1 to +N)")).toHaveValue(3);
    expect(screen.getByLabelText("Turn timer")).toBeChecked();
    expect(screen.getByLabelText("Timer seconds")).toHaveValue(10);
    expect(screen.getByLabelText("Power-ups")).toBeChecked();
  });

  it("applying the Sudden Death preset updates the visible form fields", async () => {
    const user = userEvent.setup();
    render(<MatchSettingsForm onBack={vi.fn()} onStartMatch={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Sudden Death" }));

    expect(await screen.findByLabelText("Min target")).toHaveValue(8);
    expect(screen.getByLabelText("Max target")).toHaveValue(15);
    expect(screen.getByLabelText("Timer seconds")).toHaveValue(5);
  });

  it("unchecking the turn timer clears it (disabled mode, plan §21)", async () => {
    const user = userEvent.setup();
    render(<MatchSettingsForm onBack={vi.fn()} onStartMatch={vi.fn()} />);

    await user.click(screen.getByLabelText("Turn timer"));
    expect(screen.queryByLabelText("Timer seconds")).not.toBeInTheDocument();
  });

  it("calls onStartMatch with valid settings persisted to the store", async () => {
    const user = userEvent.setup();
    const onStartMatch = vi.fn();
    render(<MatchSettingsForm onBack={vi.fn()} onStartMatch={onStartMatch} />);

    await user.click(screen.getByRole("button", { name: "Start match" }));

    expect(onStartMatch).toHaveBeenCalledTimes(1);
    expect(useMatchSetupStore.getState().settings.startingLives).toBe(1);
  });

  it("disables Start match when the target range is invalid", async () => {
    const user = userEvent.setup();
    render(<MatchSettingsForm onBack={vi.fn()} onStartMatch={vi.fn()} />);

    const maxTarget = screen.getByLabelText("Max target");
    await user.clear(maxTarget);
    await user.type(maxTarget, "5"); // less than min target (20) -> invalid

    expect(await screen.findByRole("button", { name: "Start match" })).toBeDisabled();
  });

  it("calls onBack when Back is clicked", async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    render(<MatchSettingsForm onBack={onBack} onStartMatch={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("does not wipe in-progress edits when the store's settings object is replaced without a preset change (regression: persist rehydration used to reset the form)", async () => {
    const user = userEvent.setup();
    render(<MatchSettingsForm onBack={vi.fn()} onStartMatch={vi.fn()} />);

    const maxTarget = screen.getByLabelText("Max target");
    await user.clear(maxTarget);
    await user.type(maxTarget, "8");
    expect(maxTarget).toHaveValue(8);

    // Simulate the store's settings object getting a new reference for an unrelated
    // reason (e.g. the persist middleware's async rehydration) without the user having
    // touched a preset. selectedPresetId is unchanged.
    act(() => {
      useMatchSetupStore.setState((state) => ({ settings: { ...state.settings } }));
    });

    expect(screen.getByLabelText("Max target")).toHaveValue(8);
  });
});
