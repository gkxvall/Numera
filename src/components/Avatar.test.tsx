import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Avatar } from "./Avatar";
import { AVATARS } from "@/config/avatars";

describe("Avatar", () => {
  it("renders every defined avatar id without throwing", () => {
    for (const avatar of AVATARS) {
      const { unmount } = render(
        <Avatar avatarId={avatar.id} colorId="blue" title={avatar.label} />,
      );
      expect(screen.getByRole("img", { name: avatar.label })).toBeInTheDocument();
      unmount();
    }
  });

  it("falls back gracefully for an unknown avatar id", () => {
    render(<Avatar avatarId="not-a-real-avatar" colorId="blue" title="Unknown" />);
    expect(screen.getByRole("img", { name: "Unknown" })).toBeInTheDocument();
  });

  it("is decorative (no accessible name) when no title is given", () => {
    const { container } = render(<Avatar avatarId="spike" colorId="blue" />);
    expect(container.querySelector('svg[role="presentation"]')).toBeInTheDocument();
  });
});
