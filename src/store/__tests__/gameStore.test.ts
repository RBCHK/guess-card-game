// =============================================================================
// Headless game tests — Phase 2 acceptance
// Validates full game flow (5.7), edge cases (5.8), settings & stats stores.
// =============================================================================

import type { JokerCard, PlayerGuess, RegularCard } from '@/lib/game/types';
import { useGameStore } from '../gameStore';
import { useSettingsStore } from '../settingsStore';
import { useStatsStore, type GameResult } from '../statsStore';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const game = () => useGameStore.getState();

const redJoker: JokerCard = { type: 'joker', variant: 'red' };
const blackJoker: JokerCard = { type: 'joker', variant: 'black' };

/** Make an exact guess for the current regular card. */
function guessExact(): void {
  const s = game();
  if (!s.currentCard || s.currentCard.type !== 'regular') return;
  const card = s.currentCard;
  game().makeGuess({ rank: card.rank, suit: card.suit });
}

/** Make a guaranteed miss (opposite color + wrong rank). */
function guessMiss(): void {
  const s = game();
  if (!s.currentCard || s.currentCard.type !== 'regular') return;
  const card = s.currentCard;
  const oppositeSuit =
    card.suit === 'hearts' || card.suit === 'diamonds' ? 'spades' : 'hearts';
  const wrongRank = card.rank === 'A' ? '6' : 'A';
  game().makeGuess({ rank: wrongRank, suit: oppositeSuit });
}

// ---------------------------------------------------------------------------
// Game Store
// ---------------------------------------------------------------------------

describe('GameStore', () => {
  beforeEach(() => {
    (global as any).__clearMMKVStores?.();
    useGameStore.setState(useGameStore.getInitialState());
  });

  // --- Initialization ---

  test('initGame sets loadout phase', () => {
    game().initGame(36, 'normal');
    const s = game();
    expect(s.deckMode).toBe(36);
    expect(s.mode).toBe('normal');
    expect(s.phase).toBe('loadout');
    expect(s.totalScore).toBe(0);
    expect(s.buffer).toBe(0);
    expect(s.streakLevel).toBe(1);
    expect(s.streakMultiplier).toBe(1);
  });

  test('initGame 52-card mode', () => {
    game().initGame(52, 'training');
    expect(game().deckMode).toBe(52);
    expect(game().mode).toBe('training');
    expect(game().phase).toBe('loadout');
  });

  // --- selectLoadout ---

  test('selectLoadout creates deck and deals first card', () => {
    game().initGame(36, 'normal');
    game().selectLoadout([redJoker]);
    const s = game();
    expect(s.phase).toBe('idle');
    expect(s.currentCard).not.toBeNull();
    expect(s.turnNumber).toBe(1);
    // 36 regular + 1 joker = 37 total, minus 1 dealt = 36
    expect(s.deck.length).toBe(36);
    expect(s.loadout).toEqual([redJoker]);
  });

  test('selectLoadout 52-card mode with 2 jokers', () => {
    game().initGame(52, 'normal');
    game().selectLoadout([redJoker, blackJoker]);
    const s = game();
    expect(s.phase).toBe('idle');
    // 52 + 2 jokers - 1 dealt = 53
    expect(s.deck.length).toBe(53);
    expect(s.loadout).toHaveLength(2);
  });

  test('selectLoadout rejects too many jokers for 36-card mode', () => {
    game().initGame(36, 'normal');
    game().selectLoadout([redJoker, blackJoker]);
    // Should stay in loadout — rejected
    expect(game().phase).toBe('loadout');
  });

  // --- Phase transitions (5.7) ---

  test('phase flow: init → loadout → idle → showing → idle', () => {
    game().initGame(36, 'normal');
    expect(game().phase).toBe('loadout');

    game().selectLoadout([redJoker]);
    expect(game().phase).toBe('idle');

    const card = game().currentCard;
    expect(card).not.toBeNull();

    game().makeGuess({ rank: '6', suit: 'spades' });
    expect(['showing', 'joker_activation']).toContain(game().phase);

    game().discardCard();
    expect(['idle', 'gameOver']).toContain(game().phase);
  });

  test('banking phase transition: idle → banking → idle', () => {
    game().initGame(36, 'normal');
    game().selectLoadout([redJoker]);

    // Build some buffer first
    const s = game();
    if (s.currentCard?.type === 'regular') {
      guessExact();
      game().discardCard();
    }

    // Now bank
    if (game().buffer > 0 && game().phase === 'idle') {
      game().bankBuffer();
      expect(game().phase).toBe('banking');

      game().discardCard();
      expect(['idle', 'gameOver']).toContain(game().phase);
    }
  });

  // --- Scoring ---

  test('exact match adds to buffer (multiplied BB)', () => {
    game().initGame(36, 'normal');
    game().selectLoadout([redJoker]);

    // Find first regular card
    while (game().currentCard?.type === 'joker' && game().phase === 'idle') {
      game().makeGuess({ rank: '6', suit: 'spades' });
      game().discardCard();
    }

    if (game().currentCard?.type === 'regular') {
      guessExact();
      // exact match = 250 BB × x1 multiplier = 250
      expect(game().buffer).toBe(250);
      expect(game().lastResult?.matchType).toBe('exact');
    }
  });

  test('streak advances on consecutive hits', () => {
    game().initGame(36, 'normal');
    game().selectLoadout([redJoker]);

    let hits = 0;

    for (let i = 0; i < 10; i++) {
      const s = game();
      if (s.phase !== 'idle' || !s.currentCard) break;

      if (s.currentCard.type === 'joker') {
        game().makeGuess({ rank: '6', suit: 'spades' });
        game().discardCard();
        continue;
      }

      const levelBefore = s.streakLevel;
      guessExact();

      const after = game();
      if (after.lastResult && after.lastResult.matchType !== 'miss') {
        hits++;
        expect(after.streakLevel).toBe(Math.min(levelBefore + 1, 10));
      }
      game().discardCard();
    }

    expect(hits).toBeGreaterThan(0);
  });

  // --- Miss ---

  test('miss without shield burns buffer and resets streak', () => {
    game().initGame(36, 'normal');
    game().selectLoadout([redJoker]);

    // Skip jokers at the start
    while (game().currentCard?.type === 'joker' && game().phase === 'idle') {
      game().makeGuess({ rank: '6', suit: 'spades' });
      game().discardCard();
    }

    // Hit to build buffer
    if (game().currentCard?.type === 'regular') {
      guessExact();
      game().discardCard();
    }

    // Skip any jokers
    while (game().currentCard?.type === 'joker' && game().phase === 'idle') {
      game().makeGuess({ rank: '6', suit: 'spades' });
      game().discardCard();
    }

    const bufferBefore = game().buffer;
    if (bufferBefore > 0 && game().currentCard?.type === 'regular') {
      guessMiss();
      const after = game();
      expect(after.lastResult?.matchType).toBe('miss');
      expect(after.buffer).toBe(0);
      expect(after.streakLevel).toBe(1);
      expect(after.streakMultiplier).toBe(1);
    }
  });

  // --- Joker ---

  test('red joker multiplies buffer by 1.3', () => {
    game().initGame(36, 'normal');
    game().selectLoadout([redJoker]);

    // Build buffer first
    let builtBuffer = false;
    for (let i = 0; i < 37 && !builtBuffer; i++) {
      const s = game();
      if (s.phase !== 'idle' || !s.currentCard) break;
      if (s.currentCard.type === 'regular') {
        guessExact();
        game().discardCard();
        builtBuffer = game().buffer > 0 || game().totalScore > 0;
      } else {
        // Found the joker — check buffer
        const bufferBefore = game().buffer;
        game().makeGuess({ rank: '6', suit: 'spades' });

        const after = game();
        expect(after.phase).toBe('joker_activation');
        expect(after.lastJokerActivation?.type).toBe('red');

        if (bufferBefore > 0) {
          expect(after.buffer).toBe(Math.floor(bufferBefore * 1.3));
        }
        // Streak should NOT reset
        game().discardCard();
        break;
      }
    }
  });

  test('black joker activates shield', () => {
    game().initGame(36, 'normal');
    game().selectLoadout([blackJoker]);

    // Play until black joker appears
    for (let i = 0; i < 37; i++) {
      const s = game();
      if (s.phase !== 'idle' || !s.currentCard) break;
      if (s.currentCard.type === 'joker') {
        game().makeGuess({ rank: '6', suit: 'spades' });
        expect(game().shieldActive).toBe(true);
        expect(game().phase).toBe('joker_activation');
        game().discardCard();
        break;
      }
      guessExact();
      game().discardCard();
    }
  });

  // --- Shield edge cases (5.8) ---

  test('shield protects buffer on miss, but streak still resets', () => {
    game().initGame(36, 'normal');
    game().selectLoadout([blackJoker]);

    let shieldTested = false;

    for (let i = 0; i < 37 && !shieldTested; i++) {
      const s = game();
      if (s.phase !== 'idle' || !s.currentCard) break;

      if (s.currentCard.type === 'joker') {
        // Activate black joker
        game().makeGuess({ rank: '6', suit: 'spades' });
        game().discardCard();
        continue;
      }

      if (s.shieldActive && s.buffer > 0) {
        // Deliberate miss with shield
        const bufferBefore = s.buffer;
        guessMiss();

        if (game().lastResult?.matchType === 'miss') {
          expect(game().buffer).toBe(bufferBefore); // protected!
          expect(game().shieldActive).toBe(false); // consumed
          expect(game().streakLevel).toBe(1); // still resets
          shieldTested = true;
        }
        game().discardCard();
        continue;
      }

      // Build buffer
      guessExact();
      game().discardCard();
    }

    expect(shieldTested).toBe(true);
  });

  test('bankBuffer clears shield (5.8: bank before miss)', () => {
    game().initGame(36, 'normal');
    game().selectLoadout([blackJoker]);

    for (let i = 0; i < 37; i++) {
      const s = game();
      if (s.phase !== 'idle' || !s.currentCard) break;

      if (s.currentCard.type === 'joker') {
        game().makeGuess({ rank: '6', suit: 'spades' });
        game().discardCard();

        // Next turn: build buffer then bank
        if (game().shieldActive && game().currentCard?.type === 'regular') {
          guessExact();
          game().discardCard();

          if (game().shieldActive && game().buffer > 0 && game().phase === 'idle') {
            game().bankBuffer();
            expect(game().shieldActive).toBe(false);
            return; // pass
          }
        }
        continue;
      }

      guessExact();
      game().discardCard();
    }
  });

  // --- bankBuffer edge cases ---

  test('bankBuffer with buffer=0 is no-op (5.8)', () => {
    game().initGame(36, 'normal');
    game().selectLoadout([redJoker]);

    expect(game().buffer).toBe(0);
    expect(game().phase).toBe('idle');

    game().bankBuffer();

    expect(game().phase).toBe('idle'); // unchanged
    expect(game().totalScore).toBe(0);
  });

  test('bankBuffer transfers buffer to totalScore and resets streak', () => {
    game().initGame(36, 'normal');
    game().selectLoadout([redJoker]);

    // Skip jokers, hit exact to build buffer
    while (game().currentCard?.type === 'joker' && game().phase === 'idle') {
      game().makeGuess({ rank: '6', suit: 'spades' });
      game().discardCard();
    }

    if (game().currentCard?.type === 'regular') {
      guessExact();
      game().discardCard();
    }

    const bufferBefore = game().buffer;
    const totalBefore = game().totalScore;

    if (bufferBefore > 0 && game().phase === 'idle') {
      game().bankBuffer();

      expect(game().totalScore).toBe(totalBefore + bufferBefore);
      expect(game().buffer).toBe(0);
      expect(game().streakLevel).toBe(1);
      expect(game().streakMultiplier).toBe(1);
      expect(game().phase).toBe('banking');
    }
  });

  // --- endGame ---

  test('endGame auto-banks remaining buffer (5.7 step 9)', () => {
    game().initGame(36, 'normal');
    game().selectLoadout([redJoker]);

    // Play a few turns to build buffer
    for (let i = 0; i < 3; i++) {
      const s = game();
      if (s.phase !== 'idle' || !s.currentCard) break;
      if (s.currentCard.type === 'regular') {
        guessExact();
      } else {
        game().makeGuess({ rank: '6', suit: 'spades' });
      }
      game().discardCard();
    }

    const beforeEnd = game();
    const expectedFinal = beforeEnd.totalScore + beforeEnd.buffer;

    game().endGame();

    expect(game().phase).toBe('gameOver');
    expect(game().buffer).toBe(0);
    expect(game().totalScore).toBe(expectedFinal);
  });

  // --- Full game play-through ---

  test('play entire 36-card deck to completion', () => {
    game().initGame(36, 'normal');
    game().selectLoadout([redJoker]);

    let turns = 0;
    while (game().phase !== 'gameOver' && turns < 100) {
      if (game().phase !== 'idle' || !game().currentCard) break;
      game().makeGuess({ rank: '6', suit: 'spades' });
      game().discardCard();
      turns++;
    }

    expect(game().phase).toBe('gameOver');
    expect(game().buffer).toBe(0);
    expect(game().deck).toHaveLength(0);
    // 36 regular + 1 joker = 37 turns
    expect(turns).toBe(37);
  });

  test('play 52-card deck with 2 jokers to completion', () => {
    game().initGame(52, 'normal');
    game().selectLoadout([redJoker, blackJoker]);

    let turns = 0;
    while (game().phase !== 'gameOver' && turns < 100) {
      if (game().phase !== 'idle' || !game().currentCard) break;
      game().makeGuess({ rank: '6', suit: 'spades' });
      game().discardCard();
      turns++;
    }

    expect(game().phase).toBe('gameOver');
    // 52 + 2 = 54 turns
    expect(turns).toBe(54);
  });

  // --- 10 turns + bank + end game (acceptance scenario) ---

  test('headless session: 10 turns + bank + continue + end', () => {
    game().initGame(36, 'normal');
    game().selectLoadout([redJoker]);

    // Play 5 turns with exact guesses (skip jokers)
    let turnsPlayed = 0;
    while (turnsPlayed < 5 && game().phase === 'idle') {
      const s = game();
      if (!s.currentCard) break;
      if (s.currentCard.type === 'regular') {
        guessExact();
      } else {
        game().makeGuess({ rank: '6', suit: 'spades' });
      }
      game().discardCard();
      turnsPlayed++;
    }

    // Bank the buffer mid-game
    const bufferBeforeBank = game().buffer;
    const totalBeforeBank = game().totalScore;
    if (bufferBeforeBank > 0 && game().phase === 'idle') {
      game().bankBuffer();
      expect(game().totalScore).toBe(totalBeforeBank + bufferBeforeBank);
      expect(game().buffer).toBe(0);
      game().discardCard();
    }

    // Play 5 more turns
    let additionalTurns = 0;
    while (additionalTurns < 5 && game().phase === 'idle') {
      const s = game();
      if (!s.currentCard) break;
      if (s.currentCard.type === 'regular') {
        guessExact();
      } else {
        game().makeGuess({ rank: '6', suit: 'spades' });
      }
      game().discardCard();
      additionalTurns++;
    }

    // End game
    game().endGame();
    expect(game().phase).toBe('gameOver');
    expect(game().buffer).toBe(0);
    expect(game().totalScore).toBeGreaterThan(0);
    expect(game().moveHistory.length).toBeGreaterThanOrEqual(10);
  });

  // --- MoveHistory ---

  test('moveHistory records every turn', () => {
    game().initGame(36, 'normal');
    game().selectLoadout([redJoker]);

    for (let i = 0; i < 5; i++) {
      if (game().phase !== 'idle' || !game().currentCard) break;
      game().makeGuess({ rank: '6', suit: 'spades' });
      game().discardCard();
    }

    expect(game().moveHistory.length).toBe(5);
    game().moveHistory.forEach((m, i) => {
      expect(m.turnNumber).toBeGreaterThan(0);
      expect(m.revealedCard).toBeDefined();
      expect(m.result).toBeDefined();
    });
  });

  // --- tick ---

  test('tick increments matchTime', () => {
    game().initGame(36, 'normal');
    expect(game().matchTime).toBe(0);
    game().tick();
    game().tick();
    game().tick();
    expect(game().matchTime).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// Settings Store
// ---------------------------------------------------------------------------

describe('SettingsStore', () => {
  beforeEach(() => {
    useSettingsStore.setState(useSettingsStore.getInitialState());
  });

  test('has correct defaults', () => {
    const s = useSettingsStore.getState();
    expect(s.soundEnabled).toBe(true);
    expect(s.vibrationEnabled).toBe(true);
    expect(s.showProbabilities).toBe(false);
    expect(s.language).toBe('ru');
  });

  test('toggle settings', () => {
    useSettingsStore.getState().setSoundEnabled(false);
    expect(useSettingsStore.getState().soundEnabled).toBe(false);

    useSettingsStore.getState().setShowProbabilities(true);
    expect(useSettingsStore.getState().showProbabilities).toBe(true);

    useSettingsStore.getState().setLanguage('en');
    expect(useSettingsStore.getState().language).toBe('en');
  });

  test('resetSettings restores defaults', () => {
    const s = useSettingsStore.getState();
    s.setSoundEnabled(false);
    s.setLanguage('en');
    s.setVibrationEnabled(false);
    s.resetSettings();

    const after = useSettingsStore.getState();
    expect(after.soundEnabled).toBe(true);
    expect(after.vibrationEnabled).toBe(true);
    expect(after.language).toBe('ru');
  });
});

// ---------------------------------------------------------------------------
// Stats Store
// ---------------------------------------------------------------------------

describe('StatsStore', () => {
  beforeEach(() => {
    useStatsStore.setState(useStatsStore.getInitialState());
  });

  const baseResult: GameResult = {
    finalScore: 500,
    matchTime: 120,
    deckMode: 36,
    maxStreakMultiplier: 4,
    totalGuesses: 36,
    exactMatches: 5,
    rankMatches: 10,
    colorMatches: 8,
    jokersActivated: { red: 1, black: 0, green: 0 },
  };

  test('has correct defaults', () => {
    const s = useStatsStore.getState();
    expect(s.totalGamesPlayed).toBe(0);
    expect(s.bestScore).toBe(0);
    expect(s.highScores).toEqual([]);
  });

  test('recordGameResult updates stats', () => {
    useStatsStore.getState().recordGameResult(baseResult);

    const s = useStatsStore.getState();
    expect(s.totalGamesPlayed).toBe(1);
    expect(s.totalBBEarned).toBe(500);
    expect(s.bestScore).toBe(500);
    expect(s.bestMatchTime).toBe(120);
    expect(s.bestStreakMultiplier).toBe(4);
    expect(s.totalGuesses).toBe(36);
    expect(s.highScores).toHaveLength(1);
    expect(s.highScores[0].score).toBe(500);
    expect(s.jokersActivated.red).toBe(1);
  });

  test('multiple games accumulate correctly', () => {
    useStatsStore.getState().recordGameResult(baseResult);
    useStatsStore.getState().recordGameResult({
      ...baseResult,
      finalScore: 1000,
      matchTime: 90,
      maxStreakMultiplier: 8,
      jokersActivated: { red: 0, black: 2, green: 0 },
    });

    const s = useStatsStore.getState();
    expect(s.totalGamesPlayed).toBe(2);
    expect(s.totalBBEarned).toBe(1500);
    expect(s.bestScore).toBe(1000);
    expect(s.bestMatchTime).toBe(90); // lower is better
    expect(s.bestStreakMultiplier).toBe(8);
    expect(s.highScores).toHaveLength(2);
    expect(s.jokersActivated.red).toBe(1);
    expect(s.jokersActivated.black).toBe(2);
  });

  test('highScores capped at 10, sorted desc', () => {
    for (let i = 0; i < 15; i++) {
      useStatsStore.getState().recordGameResult({
        ...baseResult,
        finalScore: (i + 1) * 100,
      });
    }

    const s = useStatsStore.getState();
    expect(s.highScores).toHaveLength(10);
    expect(s.highScores[0].score).toBe(1500);
    expect(s.highScores[9].score).toBe(600);
  });

  test('resetStats clears everything', () => {
    useStatsStore.getState().recordGameResult(baseResult);
    useStatsStore.getState().resetStats();

    const s = useStatsStore.getState();
    expect(s.totalGamesPlayed).toBe(0);
    expect(s.highScores).toEqual([]);
  });
});
