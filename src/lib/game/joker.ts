// =============================================================================
// Joker — ability activation, Red bonus, Black shield
// Spec: 5.4, 6.6.5
// =============================================================================

import type { JokerAbilityResult, JokerCard } from '@/lib/game/types';
import { RED_JOKER_MULTIPLIER } from '@/lib/utils/constants';

/**
 * Activate a joker's ability when it is revealed.
 * Streak is NOT interrupted. The joker is not scored (0 BB).
 *
 * New joker types: add a case here + add variant to JokerType in types.ts.
 */
export function activateJokerAbility(joker: JokerCard): JokerAbilityResult {
  switch (joker.variant) {
    case 'red':
      return {
        type: 'red',
        description: 'Буфер увеличен на 30%!',
        effect: { bufferMultiplier: RED_JOKER_MULTIPLIER },
      };

    case 'black':
      return {
        type: 'black',
        description: 'Щит активирован! Следующий промах не сожжет буфер',
        effect: { shieldActive: true },
      };

    case 'green':
      // Reserved for future use
      return {
        type: 'green',
        description: 'Способность в разработке',
        effect: {},
      };

    default: {
      // Exhaustive check — will error at compile time if a variant is unhandled
      const _exhaustive: never = joker.variant;
      return _exhaustive;
    }
  }
}

/**
 * Apply Red Joker bonus to the current buffer.
 * Floors the result (no fractional BB).
 */
export function applyRedJokerBonus(buffer: number): number {
  return Math.floor(buffer * RED_JOKER_MULTIPLIER);
}

/**
 * Check whether the Black Joker shield should absorb a miss.
 *
 * - shield active + miss → buffer protected, shield consumed, multiplier resets (caller handles reset)
 * - shield active + hit  → shield stays
 * - shield inactive      → no protection
 */
export function checkShieldProtection(
  shieldActive: boolean,
  isMiss: boolean,
): { bufferProtected: boolean; shieldRemaining: boolean } {
  if (!shieldActive) {
    return { bufferProtected: false, shieldRemaining: false };
  }

  if (isMiss) {
    return { bufferProtected: true, shieldRemaining: false };
  }

  // Hit while shield is active — shield persists
  return { bufferProtected: false, shieldRemaining: true };
}
