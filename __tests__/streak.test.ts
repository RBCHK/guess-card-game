import {
  getStreakMultiplier,
  incrementStreakLevel,
  resetStreak,
  getStreakStatus,
} from '@/lib/game/streak';

// ---------------------------------------------------------------------------
// getStreakMultiplier
// ---------------------------------------------------------------------------

describe('getStreakMultiplier', () => {
  const expected = [
    [1, 1],
    [2, 2],
    [3, 4],
    [4, 8],
    [5, 15],
    [6, 25],
    [7, 40],
    [8, 60],
    [9, 80],
    [10, 120],
  ] as const;

  it.each(expected)('level %i → x%i', (level, multiplier) => {
    expect(getStreakMultiplier(level)).toBe(multiplier);
  });

  it('clamps below min (0 → level 1 → x1)', () => {
    expect(getStreakMultiplier(0)).toBe(1);
  });

  it('clamps below min (-5 → level 1 → x1)', () => {
    expect(getStreakMultiplier(-5)).toBe(1);
  });

  it('clamps above max (11 → level 10 → x120)', () => {
    expect(getStreakMultiplier(11)).toBe(120);
  });

  it('clamps above max (999 → level 10 → x120)', () => {
    expect(getStreakMultiplier(999)).toBe(120);
  });
});

// ---------------------------------------------------------------------------
// incrementStreakLevel
// ---------------------------------------------------------------------------

describe('incrementStreakLevel', () => {
  it('1 → 2', () => expect(incrementStreakLevel(1)).toBe(2));
  it('9 → 10', () => expect(incrementStreakLevel(9)).toBe(10));
  it('caps at 10', () => expect(incrementStreakLevel(10)).toBe(10));
  it('already above 10 stays 10', () => expect(incrementStreakLevel(15)).toBe(10));
});

// ---------------------------------------------------------------------------
// resetStreak
// ---------------------------------------------------------------------------

describe('resetStreak', () => {
  it('returns level 1 and multiplier 1', () => {
    const result = resetStreak();
    expect(result.level).toBe(1);
    expect(result.multiplier).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// getStreakStatus
// ---------------------------------------------------------------------------

describe('getStreakStatus', () => {
  it('level 1 → "Старт"', () => expect(getStreakStatus(1)).toBe('Старт'));
  it('level 4 → "В огне!"', () => expect(getStreakStatus(4)).toBe('В огне!'));
  it('level 5 → "Элита"', () => expect(getStreakStatus(5)).toBe('Элита'));
  it('level 10 → "БОГ ИГРЫ"', () => expect(getStreakStatus(10)).toBe('БОГ ИГРЫ'));
  it('clamps low (0 → "Старт")', () => expect(getStreakStatus(0)).toBe('Старт'));
  it('clamps high (11 → "БОГ ИГРЫ")', () => expect(getStreakStatus(11)).toBe('БОГ ИГРЫ'));
});
