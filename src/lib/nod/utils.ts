export function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/** Maps `value` from [inMin, inMax] to [0, 1], clamped. */
export function mapRange(value: number, inMin: number, inMax: number): number {
  return clamp01((value - inMin) / (inMax - inMin));
}
