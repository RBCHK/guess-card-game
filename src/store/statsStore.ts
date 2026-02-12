// =============================================================================
// Stats Store — lifetime stats, high scores, achievements
// Spec: 6.5 (GameStats), 8 (Stats screen)
// =============================================================================

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createMMKVStorage, statsMMKV } from '@/lib/storage/mmkv';
import type {
  GameStats,
  HighScoreEntry,
  JokerType,
} from '@/lib/game/types';

// ---------------------------------------------------------------------------

export type GameResult = {
  finalScore: number;
  matchTime: number;
  deckMode: 36 | 52;
  maxStreakMultiplier: number;
  totalGuesses: number;
  exactMatches: number;
  rankMatches: number;
  colorMatches: number;
  jokersActivated: Record<JokerType, number>;
};

export interface StatsActions {
  /** Called at end of each game to update lifetime stats. */
  recordGameResult: (result: GameResult) => void;
  resetStats: () => void;
}

export type StatsStore = GameStats & StatsActions;

// ---------------------------------------------------------------------------

const MAX_HIGH_SCORES = 10;

const DEFAULT_STATS: GameStats = {
  totalGamesPlayed: 0,
  totalBBEarned: 0,
  bestScore: 0,
  bestMatchTime: 0,
  bestStreakMultiplier: 0,
  totalGuesses: 0,
  exactMatches: 0,
  rankMatches: 0,
  colorMatches: 0,
  jokersActivated: { red: 0, black: 0, green: 0 },
  achievementsUnlocked: [],
  highScores: [],
};

export const useStatsStore = create<StatsStore>()(
  persist(
    (set, get) => ({
      ...DEFAULT_STATS,

      recordGameResult: (result) => {
        const s = get();

        // Build new high-score entry
        const entry: HighScoreEntry = {
          score: result.finalScore,
          matchTime: result.matchTime,
          deckMode: result.deckMode,
          date: new Date().toISOString(),
          streakMultiplierMax: result.maxStreakMultiplier,
        };
        const highScores = [...s.highScores, entry]
          .sort((a, b) => b.score - a.score)
          .slice(0, MAX_HIGH_SCORES);

        // Merge joker counts
        const jokers = { ...s.jokersActivated };
        for (const [type, count] of Object.entries(result.jokersActivated)) {
          jokers[type as JokerType] =
            (jokers[type as JokerType] || 0) + count;
        }

        set({
          totalGamesPlayed: s.totalGamesPlayed + 1,
          totalBBEarned: s.totalBBEarned + result.finalScore,
          bestScore: Math.max(s.bestScore, result.finalScore),
          bestMatchTime:
            s.bestMatchTime === 0
              ? result.matchTime
              : Math.min(s.bestMatchTime, result.matchTime),
          bestStreakMultiplier: Math.max(
            s.bestStreakMultiplier,
            result.maxStreakMultiplier,
          ),
          totalGuesses: s.totalGuesses + result.totalGuesses,
          exactMatches: s.exactMatches + result.exactMatches,
          rankMatches: s.rankMatches + result.rankMatches,
          colorMatches: s.colorMatches + result.colorMatches,
          jokersActivated: jokers,
          highScores,
        });
      },

      resetStats: () => set(DEFAULT_STATS),
    }),
    {
      name: 'stats',
      storage: createJSONStorage(() => createMMKVStorage(statsMMKV)),
      partialize: ({
        recordGameResult,
        resetStats,
        ...data
      }) => data,
    },
  ),
);
