---
name: guess-card-mechanics
description: "Domain knowledge for Guess Card game: scoring (BB), streak multiplier, jokers, deck 36/52, probability, edge cases. Use when implementing or debugging game logic, store, or formulas."
---

# Guess Card — Game Mechanics

Use this skill when implementing or debugging **game logic** (scoring, streak, jokers, deck, probability) or when the user asks about rules/formulas.

## Source of truth

- **Spec:** `GUESS_CARD_GAME_MOBILE_SPEC_RU.md` in project root.
- **Sections:** 5 (Игровая механика), 5.8 (Граничные случаи), 6.5 (Модели данных), 6.6 (Алгоритмы).

## Quick reference

| Topic | Spec ref | Key points |
|-------|----------|------------|
| BB scoring | 5.2, 6.6.2 | Priority: exact > rank+color > rank > suit > color > miss. 36: 250/100/50/25/10. 52: 500/150/75/25/10. Joker reveal → 0 BB, ability runs separately. |
| Streak | 5.3, 6.6.3 | Levels 1–10 → x1, x2, x4, x8, x15, x25, x40, x60, x80, x120. Applied to base BB. Reset on miss or bank. |
| Jokers | 5.4, 6.6.5 | Red: buffer × 1.3. Black: shield next turn (miss = buffer kept, multiplier → x1). Streak never breaks on joker. |
| Deck | 5.1, 6.6.1 | createDeck(36|52), mixInJokers(deck, loadout). Fisher-Yates shuffle. Loadout: 1 joker (36), 2 (52). |
| Probability | 5.5, 6.6.4 | Only over remaining **regular** cards (exclude jokers). exactCard, rank, suit, color. |
| Edge cases | 5.8 | Buffer=0 → bank disabled. Last card miss/joker. App close → persist. Black joker + bank before next turn → shield lost. |

## Instructions

1. Before writing or changing `calculateBB`, `getStreakMultiplier`, `activateJokerAbility`, `calculateProbabilities`, or game store actions — open the spec and confirm formulas and types.
2. Use types from `lib/game/types.ts` (or spec 6.5): `DeckMode`, `Card`, `MatchResult`, `GamePhase`, `JokerAbilityResult`.
3. For edge cases (last card, shield, persistence), follow the table in spec 5.8.
4. Do not invent new BB values or multiplier steps; they are fixed in the spec (and later tunable via Remote Config).
