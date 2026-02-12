// =============================================================================
// Game Store — Zustand store for full game lifecycle
// Spec: 5.7 (flow), 5.8 (edge cases), 6.4 (state management), 6.5 (types)
// =============================================================================

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createMMKVStorage, gameMMKV } from '@/lib/storage/mmkv';
import { createGameDeck } from '@/lib/game/deck';
import { applyMultiplier, calculateBB } from '@/lib/game/scoring';
import {
  activateJokerAbility,
  applyRedJokerBonus,
  checkShieldProtection,
} from '@/lib/game/joker';
import {
  getStreakMultiplier,
  incrementStreakLevel,
  resetStreak,
} from '@/lib/game/streak';
import { getMaxJokerSlots } from '@/lib/utils/constants';
import type {
  Card,
  DeckMode,
  GameMode,
  GamePhase,
  GameState,
  JokerAbilityResult,
  JokerCard,
  JokerType,
  MatchResult,
  MoveRecord,
  PlayerGuess,
} from '@/lib/game/types';

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export interface GameActions {
  /** Reset state, set deck mode + game mode → phase 'loadout'. */
  initGame: (deckMode: DeckMode, mode: GameMode) => void;

  /** Pick jokers, create shuffled game deck, auto-deal first card → 'idle'. */
  selectLoadout: (jokers: JokerCard[]) => void;

  /** Pop top card from deck (face-down), increment turn → 'idle'. */
  dealCard: () => void;

  /** Commit a guess: resolve against currentCard, update buffer/streak/shield. */
  makeGuess: (guess: PlayerGuess) => void;

  /** Secure buffer into total score. No-op if buffer ≤ 0. (5.8) */
  bankBuffer: () => void;

  /** Move currentCard to discard pile; auto-deal next or end game. */
  discardCard: () => void;

  /** End the game: auto-bank remaining buffer → 'gameOver'. */
  endGame: () => void;

  /** Increment matchTime by 1 second (called by UI timer). */
  tick: () => void;
}

// ---------------------------------------------------------------------------
// Extra per-game tracking (for stats at game end)
// ---------------------------------------------------------------------------

export interface GameExtras {
  moveHistory: MoveRecord[];
  maxStreakMultiplier: number;
  guessCount: number;
  exactMatchCount: number;
  rankMatchCount: number;
  colorMatchCount: number;
  jokersActivatedCount: Record<string, number>;
}

export type GameStore = GameState & GameExtras & GameActions;

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

const INITIAL_GAME_STATE: GameState & GameExtras = {
  deckMode: 36,
  loadout: [],
  deck: [],
  discardPile: [],
  currentCard: null,
  cardFaceUp: false,
  totalScore: 0,
  buffer: 0,
  streakMultiplier: 1,
  streakLevel: 1,
  shieldActive: false,
  phase: 'init',
  turnNumber: 0,
  matchTime: 0,
  lastResult: null,
  lastJokerActivation: null,
  mode: 'normal',
  showProbabilities: false,
  moveHistory: [],
  maxStreakMultiplier: 1,
  guessCount: 0,
  exactMatchCount: 0,
  rankMatchCount: 0,
  colorMatchCount: 0,
  jokersActivatedCount: {},
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...INITIAL_GAME_STATE,

      // -----------------------------------------------------------------------
      // initGame
      // -----------------------------------------------------------------------
      initGame: (deckMode, mode) => {
        set({
          ...INITIAL_GAME_STATE,
          deckMode,
          mode,
          phase: 'loadout',
        });
      },

      // -----------------------------------------------------------------------
      // selectLoadout
      // -----------------------------------------------------------------------
      selectLoadout: (jokers) => {
        const { deckMode } = get();
        const maxSlots = getMaxJokerSlots(deckMode);

        if (jokers.length > maxSlots) {
          console.warn(
            `selectLoadout: ${jokers.length} jokers exceeds max ${maxSlots} for ${deckMode}-card mode`,
          );
          return;
        }

        const deck = createGameDeck(deckMode, jokers);
        const [firstCard, ...remaining] = deck;

        set({
          loadout: [...jokers],
          deck: remaining,
          currentCard: firstCard,
          cardFaceUp: false,
          turnNumber: 1,
          phase: 'idle',
        });
      },

      // -----------------------------------------------------------------------
      // dealCard
      // -----------------------------------------------------------------------
      dealCard: () => {
        const { deck } = get();
        if (deck.length === 0) {
          get().endGame();
          return;
        }

        const [nextCard, ...remaining] = deck;
        set({
          deck: remaining,
          currentCard: nextCard,
          cardFaceUp: false,
          turnNumber: get().turnNumber + 1,
          lastResult: null,
          lastJokerActivation: null,
          phase: 'idle',
        });
      },

      // -----------------------------------------------------------------------
      // makeGuess — core game resolution
      // -----------------------------------------------------------------------
      makeGuess: (guess) => {
        const s = get();
        if (s.phase !== 'idle' || !s.currentCard) return;

        const card = s.currentCard;

        // --- Joker path ---
        if (card.type === 'joker') {
          const activation = activateJokerAbility(card);
          let newBuffer = s.buffer;
          let newShieldActive = s.shieldActive;

          if (activation.effect.bufferMultiplier) {
            newBuffer = applyRedJokerBonus(newBuffer);
          }
          if (activation.effect.shieldActive) {
            newShieldActive = true;
          }

          // Track joker activation
          const jokersCount = { ...s.jokersActivatedCount };
          jokersCount[card.variant] = (jokersCount[card.variant] || 0) + 1;

          // Joker MoveRecord (guess is irrelevant but recorded for completeness)
          const record: MoveRecord = {
            turnNumber: s.turnNumber,
            guess,
            revealedCard: card,
            result: { bb: 0, matchType: 'joker', isExactMatch: false },
            bufferAtTime: newBuffer,
            totalScoreAtTime: s.totalScore,
            streakMultiplier: s.streakMultiplier,
          };

          set({
            cardFaceUp: true,
            buffer: newBuffer,
            shieldActive: newShieldActive,
            lastJokerActivation: activation,
            lastResult: null,
            phase: 'joker_activation',
            jokersActivatedCount: jokersCount,
            moveHistory: [...s.moveHistory, record],
          });
          return;
        }

        // --- Regular card path ---
        const baseResult = calculateBB(guess, card, s.deckMode);
        const isMiss = baseResult.bb === 0;

        let newBuffer: number;
        let newStreakLevel: number;
        let newStreakMultiplier: number;
        let newShieldActive: boolean;
        let displayResult: MatchResult;

        // Accuracy counters
        let exactDelta = 0;
        let rankDelta = 0;
        let colorDelta = 0;

        if (isMiss) {
          const shield = checkShieldProtection(s.shieldActive, true);
          const streak = resetStreak();

          newBuffer = shield.bufferProtected ? s.buffer : 0;
          newStreakLevel = streak.level;
          newStreakMultiplier = streak.multiplier;
          newShieldActive = false;
          displayResult = baseResult; // 0 BB
        } else {
          // Hit — compute points and advance streak
          const points = applyMultiplier(baseResult.bb, s.streakMultiplier);
          newBuffer = s.buffer + points;

          newStreakLevel = incrementStreakLevel(s.streakLevel);
          newStreakMultiplier = getStreakMultiplier(newStreakLevel);

          const shield = checkShieldProtection(s.shieldActive, false);
          newShieldActive = shield.shieldRemaining;

          // displayResult.bb = multiplied value (for UI badge)
          displayResult = { ...baseResult, bb: points };

          if (baseResult.matchType === 'exact') exactDelta = 1;
          else if (
            baseResult.matchType === 'rank' ||
            baseResult.matchType === 'rank+color'
          )
            rankDelta = 1;
          else if (baseResult.matchType === 'color') colorDelta = 1;
        }

        const record: MoveRecord = {
          turnNumber: s.turnNumber,
          guess,
          revealedCard: card,
          result: displayResult,
          bufferAtTime: newBuffer,
          totalScoreAtTime: s.totalScore,
          streakMultiplier: newStreakMultiplier,
        };

        set({
          cardFaceUp: true,
          buffer: newBuffer,
          streakLevel: newStreakLevel,
          streakMultiplier: newStreakMultiplier,
          shieldActive: newShieldActive,
          lastResult: displayResult,
          lastJokerActivation: null,
          phase: 'showing',
          maxStreakMultiplier: Math.max(
            s.maxStreakMultiplier,
            newStreakMultiplier,
          ),
          guessCount: s.guessCount + 1,
          exactMatchCount: s.exactMatchCount + exactDelta,
          rankMatchCount: s.rankMatchCount + rankDelta,
          colorMatchCount: s.colorMatchCount + colorDelta,
          moveHistory: [...s.moveHistory, record],
        });
      },

      // -----------------------------------------------------------------------
      // bankBuffer — secure buffer into totalScore
      // -----------------------------------------------------------------------
      bankBuffer: () => {
        const s = get();

        // 5.8: buffer = 0 → no-op (button disabled in UI)
        if (s.buffer <= 0) return;
        if (s.phase !== 'idle') return;

        const streak = resetStreak();

        set({
          totalScore: s.totalScore + s.buffer,
          buffer: 0,
          streakLevel: streak.level,
          streakMultiplier: streak.multiplier,
          shieldActive: false, // 5.8: shield lost if player banks before miss
          phase: 'banking',
        });
      },

      // -----------------------------------------------------------------------
      // discardCard — move to discard pile, deal next or end game
      // -----------------------------------------------------------------------
      discardCard: () => {
        const s = get();
        if (!s.currentCard) return;

        set({
          discardPile: [...s.discardPile, s.currentCard],
          currentCard: null,
          cardFaceUp: false,
        });

        // Auto-deal or finish
        if (s.deck.length === 0) {
          get().endGame();
        } else {
          get().dealCard();
        }
      },

      // -----------------------------------------------------------------------
      // endGame — auto-bank remaining buffer (spec 5.7 step 9)
      // -----------------------------------------------------------------------
      endGame: () => {
        const s = get();
        set({
          totalScore: s.totalScore + s.buffer,
          buffer: 0,
          phase: 'gameOver',
        });
      },

      // -----------------------------------------------------------------------
      // tick — called by UI every second
      // -----------------------------------------------------------------------
      tick: () => {
        set((prev) => ({ matchTime: prev.matchTime + 1 }));
      },
    }),
    {
      name: 'game',
      storage: createJSONStorage(() => createMMKVStorage(gameMMKV)),
      // Persist data fields only (exclude action functions)
      partialize: ({
        initGame,
        selectLoadout,
        dealCard,
        makeGuess,
        bankBuffer,
        discardCard,
        endGame,
        tick,
        ...data
      }) => data,
    },
  ),
);
