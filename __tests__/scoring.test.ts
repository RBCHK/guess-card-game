import { calculateBB, applyMultiplier, getColor } from '@/lib/game/scoring';
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
// getColor
// ---------------------------------------------------------------------------

describe('getColor', () => {
  it('hearts → red', () => expect(getColor('hearts')).toBe('red'));
  it('diamonds → red', () => expect(getColor('diamonds')).toBe('red'));
  it('spades → black', () => expect(getColor('spades')).toBe('black'));
  it('clubs → black', () => expect(getColor('clubs')).toBe('black'));
});

// ---------------------------------------------------------------------------
// calculateBB — 36-card deck
// ---------------------------------------------------------------------------

describe('calculateBB (36 cards)', () => {
  const mode = 36 as const;

  it('exact match → 250 BB', () => {
    const r = calculateBB(guess('A', 'spades'), regular('spades', 'A'), mode);
    expect(r.bb).toBe(250);
    expect(r.matchType).toBe('exact');
    expect(r.isExactMatch).toBe(true);
  });

  it('rank + color (same rank, same color, different suit) → 100 BB', () => {
    // ♠A guessed, ♣A revealed (both black)
    const r = calculateBB(guess('A', 'spades'), regular('clubs', 'A'), mode);
    expect(r.bb).toBe(100);
    expect(r.matchType).toBe('rank+color');
  });

  it('rank only (same rank, different color) → 50 BB', () => {
    // ♠A guessed, ♦A revealed (black vs red)
    const r = calculateBB(guess('A', 'spades'), regular('diamonds', 'A'), mode);
    expect(r.bb).toBe(50);
    expect(r.matchType).toBe('rank');
  });

  it('suit only → 25 BB', () => {
    // ♠A guessed, ♠9 revealed
    const r = calculateBB(guess('A', 'spades'), regular('spades', '9'), mode);
    expect(r.bb).toBe(25);
    expect(r.matchType).toBe('suit');
  });

  it('color only → 10 BB', () => {
    // ♠A guessed, ♣Q revealed (both black, different suit, different rank)
    const r = calculateBB(guess('A', 'spades'), regular('clubs', 'Q'), mode);
    expect(r.bb).toBe(10);
    expect(r.matchType).toBe('color');
  });

  it('miss → 0 BB', () => {
    // ♠A guessed, ♦10 revealed (different everything, different color)
    const r = calculateBB(guess('A', 'spades'), regular('diamonds', '10'), mode);
    expect(r.bb).toBe(0);
    expect(r.matchType).toBe('miss');
    expect(r.isExactMatch).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// calculateBB — 52-card deck
// ---------------------------------------------------------------------------

describe('calculateBB (52 cards)', () => {
  const mode = 52 as const;

  it('exact match → 500 BB', () => {
    const r = calculateBB(guess('A', 'spades'), regular('spades', 'A'), mode);
    expect(r.bb).toBe(500);
    expect(r.matchType).toBe('exact');
  });

  it('rank + color → 150 BB', () => {
    const r = calculateBB(guess('A', 'spades'), regular('clubs', 'A'), mode);
    expect(r.bb).toBe(150);
  });

  it('rank only → 75 BB', () => {
    const r = calculateBB(guess('A', 'spades'), regular('hearts', 'A'), mode);
    expect(r.bb).toBe(75);
  });

  it('suit only → 25 BB', () => {
    const r = calculateBB(guess('A', 'spades'), regular('spades', '2'), mode);
    expect(r.bb).toBe(25);
  });

  it('color only → 10 BB', () => {
    const r = calculateBB(guess('A', 'spades'), regular('clubs', '3'), mode);
    expect(r.bb).toBe(10);
  });

  it('miss → 0 BB', () => {
    const r = calculateBB(guess('A', 'spades'), regular('hearts', '10'), mode);
    expect(r.bb).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// calculateBB — joker revealed
// ---------------------------------------------------------------------------

describe('calculateBB — joker revealed', () => {
  it('red joker → 0 BB, matchType "joker"', () => {
    const r = calculateBB(guess('A', 'spades'), joker('red'), 36);
    expect(r.bb).toBe(0);
    expect(r.matchType).toBe('joker');
    expect(r.isExactMatch).toBe(false);
  });

  it('black joker → 0 BB, matchType "joker"', () => {
    const r = calculateBB(guess('K', 'hearts'), joker('black'), 52);
    expect(r.bb).toBe(0);
    expect(r.matchType).toBe('joker');
  });
});

// ---------------------------------------------------------------------------
// applyMultiplier
// ---------------------------------------------------------------------------

describe('applyMultiplier', () => {
  it('250 × 1 = 250', () => expect(applyMultiplier(250, 1)).toBe(250));
  it('250 × 4 = 1000', () => expect(applyMultiplier(250, 4)).toBe(1000));
  it('25 × 15 = 375', () => expect(applyMultiplier(25, 15)).toBe(375));
  it('10 × 120 = 1200', () => expect(applyMultiplier(10, 120)).toBe(1200));
  it('floors fractional results', () => expect(applyMultiplier(33, 1.3)).toBe(42));
  it('0 BB × any = 0', () => expect(applyMultiplier(0, 120)).toBe(0));
});
