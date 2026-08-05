/**
 * Randomness abstraction (plan §19.3): production gameplay uses a secure source;
 * tests inject a seeded, deterministic source for reproducible engine runs.
 */

export interface RandomSource {
  /** Returns an integer in [min, max], inclusive on both ends. */
  nextInt(min: number, max: number): number;
  /** Returns a float in [0, 1). */
  nextFloat(): number;
}

function requireValidRange(min: number, max: number): void {
  if (!Number.isFinite(min) || !Number.isFinite(max) || max < min) {
    throw new RangeError(`Invalid random range [${min}, ${max}]`);
  }
}

/** Deterministic mulberry32 PRNG. Same seed always produces the same sequence. */
export function createSeededRandomSource(seed: number): RandomSource {
  let state = seed >>> 0;

  function nextFloat(): number {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  function nextInt(min: number, max: number): number {
    requireValidRange(min, max);
    return min + Math.floor(nextFloat() * (max - min + 1));
  }

  return { nextInt, nextFloat };
}

/** Cryptographically strong source for real gameplay (plan §6.5, §27). */
export function createSecureRandomSource(): RandomSource {
  function nextFloat(): number {
    const buffer = new Uint32Array(1);
    crypto.getRandomValues(buffer);
    return (buffer[0] ?? 0) / 4294967296;
  }

  function nextInt(min: number, max: number): number {
    requireValidRange(min, max);
    const range = max - min + 1;
    // Rejection sampling to avoid modulo bias.
    const maxUsable = Math.floor(4294967296 / range) * range;
    const buffer = new Uint32Array(1);
    let value: number;
    do {
      crypto.getRandomValues(buffer);
      value = buffer[0] ?? 0;
    } while (value >= maxUsable);
    return min + (value % range);
  }

  return { nextInt, nextFloat };
}
