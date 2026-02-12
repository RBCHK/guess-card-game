import { calculateProbabilities, formatProbability } from '@/lib/game/probability';
import type { Card, PlayerGuess, RegularCard, JokerCard } from '@/lib/game/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const regular = (suit: RegularCard['suit'], rank: RegularCard['rank']): RegularCard => ({
  type: 'regular',
  suit,
  rank,
});

const joker = (variant: JokerCard['variant']): JokerCard => ({
  type: 'joker',
  variant,
});

const guess = (rank: PlayerGuess['rank'], suit: PlayerGuess['suit']): PlayerGuess => ({
  rank,
  suit,
});

// ---------------------------------------------------------------------------
// calculateProbabilities
// ---------------------------------------------------------------------------

describe('calculateProbabilities', () => {
  it('empty deck → all zeros', () => {
    const result = calculateProbabilities(guess('A', 'spades'), []);
    expect(result).toEqual({ exactCard: 0, rank: 0, suit: 0, color: 0 });
  });

  it('full 36-card deck: exact card = 1/36', () => {
    const deck: Card[] = [];
    const suits = ['spades', 'hearts', 'diamonds', 'clubs'] as const;
    const ranks = ['6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'] as const;
    for (const s of suits) for (const r of ranks) deck.push(regular(s, r));

    const result = calculateProbabilities(guess('A', 'spades'), deck);
    expect(result.exactCard).toBeCloseTo(1 / 36, 5);
    expect(result.rank).toBeCloseTo(4 / 36, 5); // 4 aces
    expect(result.suit).toBeCloseTo(9 / 36, 5); // 9 spades
    expect(result.color).toBeCloseTo(18 / 36, 5); // 18 black cards
  });

  it('partial deck with known cards removed', () => {
    // 3 cards remain: ♠A, ♠K, ♥Q
    const deck: Card[] = [
      regular('spades', 'A'),
      regular('spades', 'K'),
      regular('hearts', 'Q'),
    ];

    const result = calculateProbabilities(guess('A', 'spades'), deck);
    expect(result.exactCard).toBeCloseTo(1 / 3, 5);
    expect(result.rank).toBeCloseTo(1 / 3, 5); // only ♠A is an Ace
    expect(result.suit).toBeCloseTo(2 / 3, 5); // ♠A and ♠K
    expect(result.color).toBeCloseTo(2 / 3, 5); // ♠A and ♠K are black
  });

  it('jokers are excluded from probability calculation', () => {
    const deck: Card[] = [
      regular('spades', 'A'),
      regular('hearts', 'K'),
      joker('red'),
      joker('black'),
    ];

    const result = calculateProbabilities(guess('A', 'spades'), deck);
    // Only 2 regular cards counted
    expect(result.exactCard).toBeCloseTo(1 / 2, 5);
    expect(result.rank).toBeCloseTo(1 / 2, 5);
    expect(result.suit).toBeCloseTo(1 / 2, 5);
    expect(result.color).toBeCloseTo(1 / 2, 5); // ♠A is black, ♥K is red → 1 black / 2 total
  });

  it('deck with only jokers → all zeros', () => {
    const deck: Card[] = [joker('red'), joker('black')];
    const result = calculateProbabilities(guess('A', 'spades'), deck);
    expect(result).toEqual({ exactCard: 0, rank: 0, suit: 0, color: 0 });
  });
});

// ---------------------------------------------------------------------------
// formatProbability
// ---------------------------------------------------------------------------

describe('formatProbability', () => {
  it('0 → "0.0%"', () => expect(formatProbability(0)).toBe('0.0%'));
  it('1 → "100.0%"', () => expect(formatProbability(1)).toBe('100.0%'));
  it('0.15625 → "15.6%"', () => expect(formatProbability(0.15625)).toBe('15.6%'));
  it('0.5 → "50.0%"', () => expect(formatProbability(0.5)).toBe('50.0%'));
  it('1/36 → "2.8%"', () => expect(formatProbability(1 / 36)).toBe('2.8%'));
});
