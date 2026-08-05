import { describe, expect, it } from "vitest";
import { createSeededRandomSource, createSecureRandomSource } from "./random";

describe("createSeededRandomSource", () => {
  it("produces the same sequence for the same seed", () => {
    const a = createSeededRandomSource(42);
    const b = createSeededRandomSource(42);

    const sequenceA = Array.from({ length: 20 }, () => a.nextInt(1, 100));
    const sequenceB = Array.from({ length: 20 }, () => b.nextInt(1, 100));

    expect(sequenceA).toEqual(sequenceB);
  });

  it("produces different sequences for different seeds", () => {
    const a = createSeededRandomSource(1);
    const b = createSeededRandomSource(2);

    const sequenceA = Array.from({ length: 20 }, () => a.nextInt(1, 1000));
    const sequenceB = Array.from({ length: 20 }, () => b.nextInt(1, 1000));

    expect(sequenceA).not.toEqual(sequenceB);
  });

  it("stays within the requested inclusive range", () => {
    const random = createSeededRandomSource(7);
    for (let i = 0; i < 500; i++) {
      const value = random.nextInt(5, 5);
      expect(value).toBe(5);
    }
    for (let i = 0; i < 500; i++) {
      const value = random.nextInt(1, 3);
      expect(value).toBeGreaterThanOrEqual(1);
      expect(value).toBeLessThanOrEqual(3);
    }
  });

  it("returns floats in [0, 1)", () => {
    const random = createSeededRandomSource(99);
    for (let i = 0; i < 200; i++) {
      const value = random.nextFloat();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it("rejects an invalid range", () => {
    const random = createSeededRandomSource(1);
    expect(() => random.nextInt(10, 5)).toThrow(RangeError);
  });
});

describe("createSecureRandomSource", () => {
  it("stays within the requested inclusive range", () => {
    const random = createSecureRandomSource();
    for (let i = 0; i < 200; i++) {
      const value = random.nextInt(20, 40);
      expect(Number.isInteger(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(20);
      expect(value).toBeLessThanOrEqual(40);
    }
  });

  it("returns floats in [0, 1)", () => {
    const random = createSecureRandomSource();
    const value = random.nextFloat();
    expect(value).toBeGreaterThanOrEqual(0);
    expect(value).toBeLessThan(1);
  });
});
