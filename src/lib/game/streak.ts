// =============================================================================
// Streak — multiplier progression, reset, status labels
// Spec: 5.3, 6.6.3
// =============================================================================

import {
  getStreakMultipliers,
  MAX_STREAK_LEVEL,
  MIN_STREAK_LEVEL,
  STREAK_STATUS_LABELS,
} from '@/lib/utils/constants';

/**
 * Get the multiplier value for a given streak level (1–10).
 * Clamps to valid range.
 */
export function getStreakMultiplier(level: number): number {
  const multipliers = getStreakMultipliers();
  const clamped = Math.max(MIN_STREAK_LEVEL, Math.min(MAX_STREAK_LEVEL, level));
  return multipliers[clamped - 1];
}

/**
 * Advance streak level by 1 after a successful guess.
 * Caps at MAX_STREAK_LEVEL (10).
 */
export function incrementStreakLevel(currentLevel: number): number {
  return Math.min(MAX_STREAK_LEVEL, currentLevel + 1);
}

/**
 * Reset streak after miss or banking.
 * Returns level 1 / multiplier 1.
 */
export function resetStreak(): { level: number; multiplier: number } {
  return { level: MIN_STREAK_LEVEL, multiplier: getStreakMultiplier(MIN_STREAK_LEVEL) };
}

/**
 * Human-readable streak status for the UI.
 */
export function getStreakStatus(level: number): string {
  const clamped = Math.max(MIN_STREAK_LEVEL, Math.min(MAX_STREAK_LEVEL, level));
  return STREAK_STATUS_LABELS[clamped - 1];
}
