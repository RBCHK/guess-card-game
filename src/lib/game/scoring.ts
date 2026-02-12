// =============================================================================
// Scoring — BB calculation and multiplier application
// Spec: 5.2, 6.6.2
// =============================================================================

import type {
  Card,
  Color,
  DeckMode,
  MatchResult,
  PlayerGuess,
  Suit,
} from '@/lib/game/types';
import { getBBTable } from '@/lib/utils/constants';

/**
 * Derive card color from suit.
 */
export function getColor(suit: Suit): Color {
  return suit === 'hearts' || suit === 'diamonds' ? 'red' : 'black';
}

/**
 * Calculate base BB for a guess vs revealed card.
 *
 * Priority (highest wins):
 * 1. Exact card (rank + suit)
 * 2. Rank + color (same rank, same color, different suit)
 * 3. Rank only
 * 4. Suit only
 * 5. Color only
 * 6. Miss (0 BB)
 *
 * Joker revealed → matchType 'joker', 0 BB (ability handled separately).
 */
export function calculateBB(
  guess: PlayerGuess,
  revealed: Card,
  deckMode: DeckMode,
): MatchResult {
  // Joker — not a scoring card; ability fires separately
  if (revealed.type === 'joker') {
    return { bb: 0, matchType: 'joker', isExactMatch: false };
  }

  const scores = getBBTable(deckMode);

  const rankMatch = guess.rank === revealed.rank;
  const suitMatch = guess.suit === revealed.suit;
  const colorMatch = getColor(guess.suit) === getColor(revealed.suit);

  if (rankMatch && suitMatch) {
    return { bb: scores.exact, matchType: 'exact', isExactMatch: true };
  }
  if (rankMatch && colorMatch) {
    return { bb: scores.rankColor, matchType: 'rank+color', isExactMatch: false };
  }
  if (rankMatch) {
    return { bb: scores.rank, matchType: 'rank', isExactMatch: false };
  }
  if (suitMatch) {
    return { bb: scores.suit, matchType: 'suit', isExactMatch: false };
  }
  if (colorMatch) {
    return { bb: scores.color, matchType: 'color', isExactMatch: false };
  }

  return { bb: 0, matchType: 'miss', isExactMatch: false };
}

/**
 * Apply streak multiplier to base BB.
 * Always floors the result (no fractional BB).
 */
export function applyMultiplier(baseBB: number, multiplier: number): number {
  return Math.floor(baseBB * multiplier);
}
