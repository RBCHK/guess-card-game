import { createDeck, shuffle, mixInJokers, createGameDeck } from '@/lib/game/deck';
import type { JokerCard, RegularCard } from '@/lib/game/types';

// ---------------------------------------------------------------------------
// createDeck
// ---------------------------------------------------------------------------

describe('createDeck', () => {
  it('36-card deck has exactly 36 cards', () => {
    expect(createDeck(36)).toHaveLength(36);
  });

  it('52-card deck has exactly 52 cards', () => {
    expect(createDeck(52)).toHaveLength(52);
  });

  it('all cards are regular', () => {
    for (const card of createDeck(36)) {
      expect(card.type).toBe('regular');
    }
  });

  it('36-card deck has 4 suits × 9 ranks', () => {
    const deck = createDeck(36);
    const suits = new Set(deck.map((c) => c.suit));
    const ranks = new Set(deck.map((c) => c.rank));
    expect(suits.size).toBe(4);
    expect(ranks.size).toBe(9);
  });

  it('52-card deck has 4 suits × 13 ranks', () => {
    const deck = createDeck(52);
    const suits = new Set(deck.map((c) => c.suit));
    const ranks = new Set(deck.map((c) => c.rank));
    expect(suits.size).toBe(4);
    expect(ranks.size).toBe(13);
  });

  it('36-card deck does NOT contain ranks 2-5', () => {
    const deck = createDeck(36);
    const ranks = new Set(deck.map((c) => c.rank));
    expect(ranks.has('2')).toBe(false);
    expect(ranks.has('3')).toBe(false);
    expect(ranks.has('4')).toBe(false);
    expect(ranks.has('5')).toBe(false);
  });

  it('52-card deck DOES contain ranks 2-5', () => {
    const deck = createDeck(52);
    const ranks = new Set(deck.map((c) => c.rank));
    expect(ranks.has('2')).toBe(true);
    expect(ranks.has('3')).toBe(true);
    expect(ranks.has('4')).toBe(true);
    expect(ranks.has('5')).toBe(true);
  });

  it('no duplicate cards', () => {
    const deck = createDeck(52);
    const keys = deck.map((c) => `${c.rank}-${c.suit}`);
    expect(new Set(keys).size).toBe(52);
  });
});

// ---------------------------------------------------------------------------
// shuffle
// ---------------------------------------------------------------------------

describe('shuffle', () => {
  it('returns a new array (does not mutate original)', () => {
    const original = [1, 2, 3, 4, 5];
    const copy = [...original];
    shuffle(original);
    expect(original).toEqual(copy);
  });

  it('preserves length', () => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    expect(shuffle(arr)).toHaveLength(arr.length);
  });

  it('preserves elements (same set)', () => {
    const arr = [1, 2, 3, 4, 5];
    const result = shuffle(arr);
    expect(result.sort()).toEqual([1, 2, 3, 4, 5]);
  });

  it('produces different orders (statistical: run 50 shuffles)', () => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const results = new Set<string>();
    for (let i = 0; i < 50; i++) {
      results.add(JSON.stringify(shuffle(arr)));
    }
    // Extremely unlikely to get <2 unique orderings in 50 runs of 10 elements
    expect(results.size).toBeGreaterThan(1);
  });
});

// ---------------------------------------------------------------------------
// mixInJokers
// ---------------------------------------------------------------------------

describe('mixInJokers', () => {
  const redJoker: JokerCard = { type: 'joker', variant: 'red' };
  const blackJoker: JokerCard = { type: 'joker', variant: 'black' };

  it('36 cards + 1 joker = 37 total', () => {
    const deck = createDeck(36);
    const mixed = mixInJokers(deck, [redJoker]);
    expect(mixed).toHaveLength(37);
  });

  it('52 cards + 2 jokers = 54 total', () => {
    const deck = createDeck(52);
    const mixed = mixInJokers(deck, [redJoker, blackJoker]);
    expect(mixed).toHaveLength(54);
  });

  it('contains all jokers', () => {
    const deck = createDeck(36);
    const mixed = mixInJokers(deck, [redJoker]);
    const jokers = mixed.filter((c) => c.type === 'joker');
    expect(jokers).toHaveLength(1);
    expect((jokers[0] as JokerCard).variant).toBe('red');
  });

  it('does not mutate original deck', () => {
    const deck = createDeck(36);
    const originalLength = deck.length;
    mixInJokers(deck, [redJoker]);
    expect(deck).toHaveLength(originalLength);
  });
});

// ---------------------------------------------------------------------------
// createGameDeck
// ---------------------------------------------------------------------------

describe('createGameDeck', () => {
  it('36-card mode with 1 joker → 37 cards', () => {
    const joker: JokerCard = { type: 'joker', variant: 'red' };
    const deck = createGameDeck(36, [joker]);
    expect(deck).toHaveLength(37);
  });

  it('52-card mode with 2 jokers → 54 cards', () => {
    const jokers: JokerCard[] = [
      { type: 'joker', variant: 'red' },
      { type: 'joker', variant: 'black' },
    ];
    const deck = createGameDeck(52, jokers);
    expect(deck).toHaveLength(54);
  });

  it('deck with no jokers → standard size', () => {
    expect(createGameDeck(36, [])).toHaveLength(36);
    expect(createGameDeck(52, [])).toHaveLength(52);
  });

  it('two identical jokers are allowed (52 mode)', () => {
    const jokers: JokerCard[] = [
      { type: 'joker', variant: 'red' },
      { type: 'joker', variant: 'red' },
    ];
    const deck = createGameDeck(52, jokers);
    const jokerCards = deck.filter((c) => c.type === 'joker');
    expect(jokerCards).toHaveLength(2);
  });
});
