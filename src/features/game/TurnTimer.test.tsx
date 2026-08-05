import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TurnTimer } from "./TurnTimer";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

/** Advances one second at a time so React can flush the effect between each chained setTimeout. */
function advanceSeconds(count: number) {
  for (let i = 0; i < count; i++) {
    act(() => {
      vi.advanceTimersByTime(1000);
    });
  }
}

describe("TurnTimer", () => {
  it("renders nothing when disabled", () => {
    const { container } = render(
      <TurnTimer seconds={null} turnKey="t1" paused={false} onTimeout={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("counts down once per second", () => {
    render(<TurnTimer seconds={10} turnKey="t1" paused={false} onTimeout={vi.fn()} />);
    expect(screen.getByText("10s")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText("9s")).toBeInTheDocument();
  });

  it("fires onTimeout exactly once when it reaches zero", () => {
    const onTimeout = vi.fn();
    render(<TurnTimer seconds={2} turnKey="t1" paused={false} onTimeout={onTimeout} />);

    advanceSeconds(2);
    expect(onTimeout).toHaveBeenCalledTimes(1);

    // Advancing further must not re-fire it.
    advanceSeconds(5);
    expect(onTimeout).toHaveBeenCalledTimes(1);
  });

  it("does not tick while paused", () => {
    render(<TurnTimer seconds={10} turnKey="t1" paused onTimeout={vi.fn()} />);

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.getByText("10s")).toBeInTheDocument();
  });

  it("resets the clock when turnKey changes", () => {
    const { rerender } = render(
      <TurnTimer seconds={10} turnKey="t1" paused={false} onTimeout={vi.fn()} />,
    );
    advanceSeconds(4);
    expect(screen.getByText("6s")).toBeInTheDocument();

    rerender(<TurnTimer seconds={10} turnKey="t2" paused={false} onTimeout={vi.fn()} />);
    expect(screen.getByText("10s")).toBeInTheDocument();
  });

  it("does not fire a stale timeout for the previous turn after turnKey changes", () => {
    const firstOnTimeout = vi.fn();
    const { rerender } = render(
      <TurnTimer seconds={2} turnKey="t1" paused={false} onTimeout={firstOnTimeout} />,
    );

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    // Player moved before timeout fired — a new turn begins.
    const secondOnTimeout = vi.fn();
    rerender(<TurnTimer seconds={5} turnKey="t2" paused={false} onTimeout={secondOnTimeout} />);

    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(firstOnTimeout).not.toHaveBeenCalled();
    expect(secondOnTimeout).not.toHaveBeenCalled();
  });
});
