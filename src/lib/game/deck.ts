// =============================================================================
// Deck — creation, shuffle (Fisher-Yates), joker mixing
// Spec: 5.1, 6.6.1
// =============================================================================

import type {
  Card,
  DeckMode,
  JokerCard,
  Rank,
  RegularCard,
  Suit,
} from '@/lib/game/types';
import { RANKS_36, RANKS_52, SUITS } from '@/lib/utils/constants';

/**
 * Fisher-Yates (Knuth) shuffle — uniform random permutation.
 * Pure: returns a new array, does not mutate the original.
 */
export function shuffle<T>(array: readonly T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Create a standard deck of regular cards (no jokers).
 * @param mode 36 or 52
 */
export function createDeck(mode: DeckMode): RegularCard[] {
  const cards: RegularCard[] = [];
  const ranks: readonly string[] = mode === 36 ? RANKS_36 : RANKS_52;

  for (const suit of SUITS) {
    for (const rank of ranks) {
      cards.push({
        type: 'regular',
        suit: suit as Suit,
        rank: rank as Rank,
      });
    }
  }

  return cards;
}

/**
 * Mix joker cards into a regular deck and shuffle.
 */
export function mixInJokers(
  deck: readonly RegularCard[],
  loadout: readonly JokerCard[],
): Card[] {
  const fullDeck: Card[] = [...deck, ...loadout];
  return shuffle(fullDeck);
}

/**
 * One-call helper: create a ready-to-play shuffled deck.
 */
export function createGameDeck(
  mode: DeckMode,
  loadout: readonly JokerCard[],
): Card[] {
  const regularCards = createDeck(mode);
  return mixInJokers(regularCards, loadout);
}
