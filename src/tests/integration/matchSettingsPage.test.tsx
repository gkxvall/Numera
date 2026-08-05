import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useMatchSetupStore } from "@/stores/matchSetupStore";
import { useActiveMatchStore } from "@/stores/activeMatchStore";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

beforeEach(() => {
  localStorage.clear();
  push.mockClear();
  useMatchSetupStore.getState().resetToDefaults();
  useActiveMatchStore.setState({ match: null, lastEvents: [], lastError: null, dangerLevel: null });
});

describe("MatchSettingsPage — Start match", () => {
  it("creates the match using the just-edited settings, not a stale pre-edit snapshot (regression: page read settings from a render-time closure)", async () => {
    const user = userEvent.setup();
    const { default: MatchSettingsPage } = await import("@/app/setup/match/page");
    render(<MatchSettingsPage />);

    const minTarget = screen.getByLabelText("Min target");
    const maxTarget = screen.getByLabelText("Max target");
    await user.clear(minTarget);
    await user.type(minTarget, "5");
    await user.clear(maxTarget);
    await user.type(maxTarget, "8");

    await user.click(screen.getByRole("button", { name: "Start match" }));

    const match = useActiveMatchStore.getState().match;
    expect(match).not.toBeNull();
    expect(match!.settings.targetRange).toEqual({ min: 5, max: 8 });
    expect(match!.target).toBeGreaterThanOrEqual(5);
    expect(match!.target).toBeLessThanOrEqual(8);
    expect(push).toHaveBeenCalledWith("/play");
  });
});
