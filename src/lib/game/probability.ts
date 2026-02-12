// =============================================================================
// Probability — real-time odds calculation for current guess
// Spec: 5.5, 6.6.4
// =============================================================================

import type { Card, PlayerGuess, RegularCard, Suit } from '@/lib/game/types';
import { getColor } from '@/lib/game/scoring';

export type Probabilities = {
  exactCard: number;
  rank: number;
  suit: number;
  color: number;
};

/**
 * Calculate probabilities for the current guess against remaining deck.
 * IMPORTANT: Jokers are excluded from the calculation (hidden from player).
 */
export function calculateProbabilities(
  guess: PlayerGuess,
  remainingDeck: readonly Card[],
): Probabilities {
  const regularCards = remainingDeck.filter(
    (c): c is RegularCard => c.type === 'regular',
  );
  const total = regularCards.length;

  if (total === 0) {
    return { exactCard: 0, rank: 0, suit: 0, color: 0 };
  }

  const guessColor = getColor(guess.suit);

  const exactMatches = regularCards.filter(
    (c) => c.rank === guess.rank && c.suit === guess.suit,
  ).length;

  const rankMatches = regularCards.filter(
    (c) => c.rank === guess.rank,
  ).length;

  const suitMatches = regularCards.filter(
    (c) => c.suit === guess.suit,
  ).length;

  const colorMatches = regularCards.filter(
    (c) => getColor(c.suit as Suit) === guessColor,
  ).length;

  return {
    exactCard: exactMatches / total,
    rank: rankMatches / total,
    suit: suitMatches / total,
    color: colorMatches / total,
  };
}

/**
 * Format probability for UI display.
 * @example formatProbability(0.15625) → "15.6%"
 */
export function formatProbability(prob: number): string {
  return `${(prob * 100).toFixed(1)}%`;
}
