/**
 * Integration test: replays the example session from spec 5.3.
 *
 * Ход 1: Угадал масть → +25 BB × x1 = 25 → Буфер: 25, Множитель → x2
 * Ход 2: Угадал номинал → +50 BB × x2 = 100 → Буфер: 125, Множитель → x4
 * Ход 3: Угадал точную карту → +250 BB × x4 = 1000 → Буфер: 1125, Множитель → x8
 * [ЗАФИКСИРОВАТЬ] → Общий Счет: 1125, Буфер: 0, Множитель → x1
 * Ход 4: Угадал цвет → +10 BB × x1 = 10 → Буфер: 10, Множитель → x2
 * Ход 5: ПРОМАХ (0 BB) → Буфер СГОРАЕТ, Общий Счет остаётся 1125
 */

import { calculateBB, applyMultiplier } from '@/lib/game/scoring';
import {
  getStreakMultiplier,
  incrementStreakLevel,
  resetStreak,
} from '@/lib/game/streak';
import type { PlayerGuess, RegularCard } from '@/lib/game/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const regular = (suit: RegularCard['suit'], rank: RegularCard['rank']): RegularCard => ({
  type: 'regular',
  suit,
  rank,
});

const guess = (rank: PlayerGuess['rank'], suit: PlayerGuess['suit']): PlayerGuess => ({
  rank,
  suit,
});

// ---------------------------------------------------------------------------
// Session simulation
// ---------------------------------------------------------------------------

describe('Game session from spec 5.3 (36-card mode)', () => {
  let totalScore = 0;
  let buffer = 0;
  let streakLevel = 1;

  beforeAll(() => {
    // Reset state
    totalScore = 0;
    buffer = 0;
    streakLevel = 1;
  });

  it('Turn 1: suit match → +25 × x1 = 25, buffer 25, streak → x2', () => {
    // Guess ♠A, revealed ♠9 (suit match only)
    const result = calculateBB(guess('A', 'spades'), regular('spades', '9'), 36);
    expect(result.bb).toBe(25);
    expect(result.matchType).toBe('suit');

    const multiplier = getStreakMultiplier(streakLevel);
    expect(multiplier).toBe(1);

    const points = applyMultiplier(result.bb, multiplier);
    expect(points).toBe(25);

    buffer += points;
    expect(buffer).toBe(25);

    streakLevel = incrementStreakLevel(streakLevel);
    expect(streakLevel).toBe(2);
    expect(getStreakMultiplier(streakLevel)).toBe(2);
  });

  it('Turn 2: rank match → +50 × x2 = 100, buffer 125, streak → x4', () => {
    // Guess ♠A, revealed ♦A (rank only, different color)
    const result = calculateBB(guess('A', 'spades'), regular('diamonds', 'A'), 36);
    expect(result.bb).toBe(50);
    expect(result.matchType).toBe('rank');

    const multiplier = getStreakMultiplier(streakLevel);
    expect(multiplier).toBe(2);

    const points = applyMultiplier(result.bb, multiplier);
    expect(points).toBe(100);

    buffer += points;
    expect(buffer).toBe(125);

    streakLevel = incrementStreakLevel(streakLevel);
    expect(streakLevel).toBe(3);
    expect(getStreakMultiplier(streakLevel)).toBe(4);
  });

  it('Turn 3: exact match → +250 × x4 = 1000, buffer 1125, streak → x8', () => {
    // Guess ♠A, revealed ♠A
    const result = calculateBB(guess('A', 'spades'), regular('spades', 'A'), 36);
    expect(result.bb).toBe(250);
    expect(result.matchType).toBe('exact');

    const multiplier = getStreakMultiplier(streakLevel);
    expect(multiplier).toBe(4);

    const points = applyMultiplier(result.bb, multiplier);
    expect(points).toBe(1000);

    buffer += points;
    expect(buffer).toBe(1125);

    streakLevel = incrementStreakLevel(streakLevel);
    expect(streakLevel).toBe(4);
    expect(getStreakMultiplier(streakLevel)).toBe(8);
  });

  it('BANK: buffer → totalScore, buffer 0, streak resets to x1', () => {
    totalScore += buffer;
    expect(totalScore).toBe(1125);

    buffer = 0;
    const reset = resetStreak();
    streakLevel = reset.level;

    expect(buffer).toBe(0);
    expect(streakLevel).toBe(1);
    expect(getStreakMultiplier(streakLevel)).toBe(1);
  });

  it('Turn 4: color match → +10 × x1 = 10, buffer 10, streak → x2', () => {
    // Guess ♠A, revealed ♣Q (color only — both black)
    const result = calculateBB(guess('A', 'spades'), regular('clubs', 'Q'), 36);
    expect(result.bb).toBe(10);
    expect(result.matchType).toBe('color');

    const multiplier = getStreakMultiplier(streakLevel);
    expect(multiplier).toBe(1);

    const points = applyMultiplier(result.bb, multiplier);
    expect(points).toBe(10);

    buffer += points;
    expect(buffer).toBe(10);

    streakLevel = incrementStreakLevel(streakLevel);
    expect(streakLevel).toBe(2);
  });

  it('Turn 5: MISS → buffer burns (lost 10), totalScore stays 1125', () => {
    // Guess ♠A, revealed ♦10 (different color, different rank, different suit)
    const result = calculateBB(guess('A', 'spades'), regular('diamonds', '10'), 36);
    expect(result.bb).toBe(0);
    expect(result.matchType).toBe('miss');

    // Buffer burns
    buffer = 0;
    const reset = resetStreak();
    streakLevel = reset.level;

    expect(buffer).toBe(0);
    expect(totalScore).toBe(1125);
    expect(streakLevel).toBe(1);
  });
});
