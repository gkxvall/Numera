import { describe, expect, it } from "vitest";
import { validateMoveAmount } from "./move-validator";

describe("validateMoveAmount", () => {
  it("accepts amounts within [1, maxMove]", () => {
    expect(validateMoveAmount(1, 3).valid).toBe(true);
    expect(validateMoveAmount(3, 3).valid).toBe(true);
  });

  it("rejects zero and negative amounts", () => {
    expect(validateMoveAmount(0, 3).valid).toBe(false);
    expect(validateMoveAmount(-1, 3).valid).toBe(false);
  });

  it("rejects amounts above maxMove", () => {
    expect(validateMoveAmount(4, 3).valid).toBe(false);
  });

  it("rejects non-integer amounts", () => {
    expect(validateMoveAmount(1.5, 3).valid).toBe(false);
  });

  it("returns a human-readable error message when invalid", () => {
    const result = validateMoveAmount(10, 3);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/cannot exceed/i);
  });
});
