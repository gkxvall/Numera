import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "./Button";

describe("Button", () => {
  it("renders its label and responds to clicks", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<Button onClick={onClick}>Play</Button>);

    const button = screen.getByRole("button", { name: "Play" });
    await user.click(button);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("does not fire onClick when disabled", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(
      <Button onClick={onClick} disabled>
        Play
      </Button>,
    );

    await user.click(screen.getByRole("button", { name: "Play" }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("is focusable and activatable via keyboard", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<Button onClick={onClick}>Play</Button>);

    await user.tab();
    expect(screen.getByRole("button", { name: "Play" })).toHaveFocus();

    await user.keyboard("{Enter}");
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("defaults to type=button so it never submits a form by accident", () => {
    render(<Button>Play</Button>);
    expect(screen.getByRole("button", { name: "Play" })).toHaveAttribute("type", "button");
  });
});
