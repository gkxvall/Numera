export interface MoveValidationResult {
  valid: boolean;
  error?: string;
}

/** A move must be a whole number of clicks between 1 and the configured maximum. */
export function validateMoveAmount(amount: number, maxMove: number): MoveValidationResult {
  if (!Number.isInteger(amount)) {
    return { valid: false, error: "Move amount must be a whole number." };
  }
  if (amount < 1) {
    return { valid: false, error: "Move amount must be at least 1." };
  }
  if (amount > maxMove) {
    return { valid: false, error: `Move amount cannot exceed ${maxMove}.` };
  }
  return { valid: true };
}
