// =============================================================================
// Game Constants — single source of truth for all balance values
// Later (Phase 10) these will be overridden by Firebase Remote Config.
// =============================================================================

import type { DeckMode, RankThresholds } from '@/lib/game/types';

// --- BB scoring tables (spec 5.2) -------------------------------------------

export type BBTable = {
  exact: number;
  rankColor: number;
  rank: number;
  suit: number;
  color: number;
};

const BB_TABLE_36: BBTable = {
  exact: 250,
  rankColor: 100,
  rank: 50,
  suit: 25,
  color: 10,
};

const BB_TABLE_52: BBTable = {
  exact: 500,
  rankColor: 150,
  rank: 75,
  suit: 25,
  color: 10,
};

/**
 * Get BB scoring table for a given deck mode.
 * Entry point for future Remote Config override.
 */
export function getBBTable(deckMode: DeckMode): BBTable {
  return deckMode === 36 ? BB_TABLE_36 : BB_TABLE_52;
}

// --- Streak multipliers (spec 5.3) ------------------------------------------

const STREAK_MULTIPLIERS: readonly number[] = [
  1, // level 1
  2, // level 2
  4, // level 3
  8, // level 4
  15, // level 5
  25, // level 6
  40, // level 7
  60, // level 8
  80, // level 9
  120, // level 10
];

export function getStreakMultipliers(): readonly number[] {
  return STREAK_MULTIPLIERS;
}

export const MIN_STREAK_LEVEL = 1;
export const MAX_STREAK_LEVEL = STREAK_MULTIPLIERS.length; // 10

// --- Streak status labels (spec 5.3) ----------------------------------------

export const STREAK_STATUS_LABELS: readonly string[] = [
  'Старт', // 1
  'Хорошее начало', // 2
  'Мастер', // 3
  'В огне!', // 4
  'Элита', // 5
  'Невероятно', // 6
  'Феноменально', // 7
  'Мистическая удача', // 8
  'Повелитель карт', // 9
  'БОГ ИГРЫ', // 10
];

// --- Joker config (spec 5.4) ------------------------------------------------

export const RED_JOKER_MULTIPLIER = 1.3;

/**
 * Max joker slots per deck mode.
 * 36 cards → 1 slot, 52 cards → 2 slots.
 */
export function getMaxJokerSlots(deckMode: DeckMode): number {
  return deckMode === 36 ? 1 : 2;
}

// --- Deck ranks (spec 5.1) --------------------------------------------------

export const RANKS_36 = [
  '6',
  '7',
  '8',
  '9',
  '10',
  'J',
  'Q',
  'K',
  'A',
] as const;

export const RANKS_52 = [
  '2',
  '3',
  '4',
  '5',
  ...RANKS_36,
] as const;

export const SUITS = ['spades', 'hearts', 'diamonds', 'clubs'] as const;

// --- Player ranks (post-MVP, spec 4.2.1) ------------------------------------

export const RANK_THRESHOLDS: readonly RankThresholds[] = [
  { rank: '6', minScore: 0, name: 'Новичок' },
  { rank: '7', minScore: 10_000, name: 'Новичок' },
  { rank: '8', minScore: 20_000, name: 'Новичок' },
  { rank: '9', minScore: 35_000, name: 'Новичок' },
  { rank: '10', minScore: 50_000, name: 'Новичок' },
  { rank: 'J', minScore: 50_000, name: 'Любитель' },
  { rank: 'Q', minScore: 150_000, name: 'Опытный' },
  { rank: 'K', minScore: 400_000, name: 'Профи' },
  { rank: 'A', minScore: 1_000_000, name: 'Мастер' },
  { rank: 'Joker', minScore: 5_000_000, name: 'Легенда' },
];
