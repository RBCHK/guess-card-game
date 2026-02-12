// =============================================================================
// Game Types — source of truth for all game-related types
// Based on spec 6.5 (GUESS_CARD_GAME_MOBILE_SPEC_RU.md)
// =============================================================================

// --- Card primitives ---------------------------------------------------------

export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';

export type Rank36 = '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';
export type Rank52 = '2' | '3' | '4' | '5' | Rank36;
export type Rank = Rank36 | Rank52;

export type Color = 'red' | 'black';

export type DeckMode = 36 | 52;

// --- Cards -------------------------------------------------------------------

export type RegularCard = {
  type: 'regular';
  suit: Suit;
  rank: Rank;
};

/**
 * JokerType — extensible list of joker variants.
 * MVP: red & black. Green reserved for future use.
 * New variants are added here first, then handled in joker.ts switch.
 */
export type JokerType = 'red' | 'black' | 'green';

export type JokerCard = {
  type: 'joker';
  variant: JokerType;
};

export type Card = RegularCard | JokerCard;

// --- Player input & results --------------------------------------------------

export type PlayerGuess = {
  rank: Rank;
  suit: Suit;
};

export type MatchType =
  | 'exact'
  | 'rank+color'
  | 'rank'
  | 'suit'
  | 'color'
  | 'miss'
  | 'joker';

export type MatchResult = {
  bb: number;
  matchType: MatchType;
  isExactMatch: boolean;
};

export type JokerAbilityResult = {
  type: JokerType;
  description: string;
  effect: {
    bufferMultiplier?: number; // Red (1.3)
    shieldActive?: boolean; // Black
  };
};

// --- Game lifecycle ----------------------------------------------------------

export type GamePhase =
  | 'init'
  | 'loadout' // joker selection
  | 'dealing'
  | 'idle' // waiting for player choice
  | 'flipping'
  | 'showing'
  | 'joker_activation' // joker ability firing
  | 'banking' // buffer → total score
  | 'discarding'
  | 'gameOver';

export type GameMode = 'normal' | 'training';

export type GameState = {
  deckMode: DeckMode;
  loadout: JokerCard[];

  deck: Card[];
  discardPile: Card[];
  currentCard: Card | null;
  cardFaceUp: boolean;

  totalScore: number; // banked (safe)
  buffer: number; // temporary, can burn
  streakMultiplier: number; // x1…x120
  streakLevel: number; // 1–10

  shieldActive: boolean; // from Black Joker

  phase: GamePhase;
  turnNumber: number;
  matchTime: number; // seconds

  lastResult: MatchResult | null;
  lastJokerActivation: JokerAbilityResult | null;

  mode: GameMode;
  showProbabilities: boolean;
};

// --- History & stats ---------------------------------------------------------

export type MoveRecord = {
  turnNumber: number;
  guess: PlayerGuess;
  revealedCard: Card;
  result: MatchResult;
  bufferAtTime: number;
  totalScoreAtTime: number;
  streakMultiplier: number;
};

export type HighScoreEntry = {
  score: number;
  matchTime: number; // seconds
  deckMode: DeckMode;
  date: string;
  streakMultiplierMax: number;
};

export type GameStats = {
  // Globals
  totalGamesPlayed: number;
  totalBBEarned: number; // for Global Rating / rank

  // Bests
  bestScore: number; // Hall of Fame
  bestMatchTime: number; // seconds
  bestStreakMultiplier: number;

  // Accuracy
  totalGuesses: number;
  exactMatches: number;
  rankMatches: number;
  colorMatches: number;

  // Jokers
  jokersActivated: Record<JokerType, number>;

  // Achievements
  achievementsUnlocked: string[];

  // Leaderboards
  highScores: HighScoreEntry[];
};

// --- Ranks (post-MVP, but type defined now) ----------------------------------

export type PlayerRank =
  | '6'
  | '7'
  | '8'
  | '9'
  | '10'
  | 'J'
  | 'Q'
  | 'K'
  | 'A'
  | 'Joker';

export type RankThresholds = {
  rank: PlayerRank;
  minScore: number;
  name: string;
};
