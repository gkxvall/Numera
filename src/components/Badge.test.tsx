import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "./Badge";

describe("Badge", () => {
  it("always renders a readable text label, not color alone", () => {
    render(<Badge tone="red">Danger</Badge>);
    expect(screen.getByText("Danger")).toBeInTheDocument();
  });
});
