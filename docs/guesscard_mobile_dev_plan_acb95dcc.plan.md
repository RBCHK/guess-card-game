---
name: GuessCard Mobile Dev Plan
overview: Полный план разработки мобильного приложения Guess Card (React Native + Expo) от нуля до релиза и пост-релизного развития. 14 фаз, каждая тестируемая независимо.
todos:
  - id: phase-0
    content: "Phase 0: Bootstrap Expo project, dependencies, project structure, Jest, git init"
    status: completed
  - id: phase-1
    content: "Phase 1: Game Engine - types, deck, scoring, streak, probability, joker + unit tests"
    status: pending
  - id: phase-2
    content: "Phase 2: Zustand stores (game, settings, stats) + MMKV persistence + auto-save"
    status: pending
  - id: phase-3
    content: "Phase 3: UI Foundation - theme, Expo Router navigation, main/settings screens"
    status: pending
  - id: phase-4
    content: "Phase 4: Core Gameplay Screen - mode select, loadout, HUD, PlayingCard, game flow, game over"
    status: pending
  - id: phase-5
    content: "Phase 5: Joker Integration - Red/Black activation, shield mechanics, edge cases"
    status: pending
  - id: phase-6
    content: "Phase 6: Juice - sound manager, haptics, animations (coins, confetti, loss, badges)"
    status: pending
  - id: phase-7
    content: "Phase 7: Training Mode - visible discard pile, separate stats"
    status: pending
  - id: phase-8
    content: "Phase 8: Onboarding - interactive tutorial (6 steps), tooltips, joker popups"
    status: pending
  - id: phase-9
    content: "Phase 9: Stats screen + 8 achievements + achievement toasts + local leaderboards"
    status: pending
  - id: phase-10
    content: "Phase 10: Backend - Firebase (Auth, RemoteConfig, Crashlytics, Analytics) + Supabase (leaderboards) + Amplitude"
    status: pending
  - id: phase-11
    content: "Phase 11: Monetization - AdMob (banner, interstitial, rewarded) + RevenueCat (remove_ads, hints)"
    status: pending
  - id: phase-12
    content: "Phase 12: Testing & QA - unit tests, integration, device testing, edge cases, beta"
    status: pending
  - id: phase-13
    content: "Phase 13: Store Preparation & Submission - icons, screenshots, listings, privacy policy, submit"
    status: pending
isProject: false
---

# Guess Card — Полный план разработки

## Оценки как Mobile Tech Lead

**Что хорошо в спеке:**

- Очень детальная, код-ориентированная (типы, алгоритмы, формулы — все есть)
- Правильный гибридный стек (Firebase бесплатное + Supabase flat pricing)
- MMKV вместо AsyncStorage — верное решение для частых записей
- Remote Config для баланса с дня 1 — must have для игры
- Разумный MVP scope (2 джокера, 2 режима колоды, базовые достижения)

**Риски:**

- Spec говорит "4-6 недель" — реалистичнее **6-8 недель** для одного разработчика, учитывая что аккаунты не созданы и все с нуля
- Анимации и "juice" отнимут больше времени чем кажется — это 30% работы
- Firebase + Supabase + Amplitude + RevenueCat + AdMob = 5 внешних сервисов в MVP, каждый требует настройки

**Рекомендация:** Разбиваем на 14 фаз. Каждая фаза завершается проверяемым результатом. Backend (фазы 10-11) подключаем ПОСЛЕ того, как геймплей полностью работает локально — это позволит быстрее итерировать core loop.

---

## Фаза 0: Инфраструктура и bootstrap (1-2 дня)

**Цель:** Рабочий Expo проект с базовой конфигурацией

**Задачи:**

- Удалить мусорную `.next/` директорию
- Создать Expo проект (`npx create-expo-app@latest GuessCard --template blank-typescript`)
- Установить core зависимости из спеки ([секция 6.1.2](GUESS_CARD_GAME_MOBILE_SPEC_RU.md)):
  - `expo-router`, `react-native-reanimated`, `zustand`, `react-native-mmkv`
  - `expo-av`, `expo-haptics`
  - `jest`, `@testing-library/react-native` (dev)
- Настроить `tsconfig.json` (strict mode, path aliases `@/`)
- Создать структуру директорий по спеке ([секция 6.2](GUESS_CARD_GAME_MOBILE_SPEC_RU.md))
- Настроить Jest для TypeScript
- Настроить ESLint + Prettier
- `git init` + первый коммит
- Настроить `eas.json` (development, preview, production profiles)

**Проверка:** `npx expo start` запускается без ошибок, Jest `npm test` проходит пустой тест

---

## Фаза 1: Game Engine — чистая логика (3-4 дня)

**Цель:** Вся игровая логика в `src/lib/game/` как чистые функции, покрытые unit-тестами

**Задачи:**

1. **Типы** (`src/lib/game/types.ts`) — все типы из [секции 6.5](GUESS_CARD_GAME_MOBILE_SPEC_RU.md): `Card`, `Suit`, `Rank`, `DeckMode`, `JokerCard`, `PlayerGuess`, `MatchResult`, `GamePhase`, `GameState`, `MoveRecord`, `GameStats`
2. **Колода** (`src/lib/game/deck.ts`) — `createDeck()`, `shuffle()` (Fisher-Yates), `mixInJokers()`, `createGameDeck()`
3. **Scoring** (`src/lib/game/scoring.ts`) — `calculateBB()`, `applyMultiplier()` — все 6 типов совпадений для 36 и 52 карт
4. **Streak** (`src/lib/game/streak.ts`) — `getStreakMultiplier()`, `incrementStreakLevel()`, `resetStreak()`, `getStreakStatus()`
5. **Probability** (`src/lib/game/probability.ts`) — `calculateProbabilities()`, `formatProbability()`
6. **Joker** (`src/lib/game/joker.ts`) — `activateJokerAbility()`, `applyRedJokerBonus()`, `checkShieldProtection()`
7. **Constants** (`src/lib/utils/constants.ts`) — все игровые константы (BB таблицы, множители)
8. **Unit-тесты** — полное покрытие всех модулей: scoring (все 6 match types x 2 deck modes + joker), streak (все 10 уровней, граничные), joker (Red bonus, Black shield + edge cases), probability (пустая колода, полная, частичная), deck (размеры 36/52, Fisher-Yates uniformity)

**Проверка:** `npm test` — все тесты зеленые. Можно прогнать сценарий из [секции 5.3](GUESS_CARD_GAME_MOBILE_SPEC_RU.md) (пример сессии) как интеграционный тест

---

## Фаза 2: State Management и Persistence (2-3 дня)

**Цель:** Zustand stores + MMKV persistence, полный жизненный цикл игры в коде

**Задачи:**

1. **Game Store** (`src/store/gameStore.ts`) — Zustand store по модели [секции 6.4](GUESS_CARD_GAME_MOBILE_SPEC_RU.md):
  - State: `deck`, `discardPile`, `currentCard`, `totalScore`, `buffer`, `streakLevel`, `streakMultiplier`, `shieldActive`, `phase`, `turnNumber`, `matchTime`, `loadout`, `mode`, `deckMode`
  - Actions: `initGame()`, `selectLoadout()`, `dealCard()`, `makeGuess()`, `bankBuffer()`, `discardCard()`, `endGame()`
  - Полный flow из [секции 5.7](GUESS_CARD_GAME_MOBILE_SPEC_RU.md): init → loadout → dealing → idle → flipping → showing/joker_activation → discarding → gameOver
2. **Settings Store** (`src/store/settingsStore.ts`) — звук, вибрация, вероятности, язык
3. **Stats Store** (`src/store/statsStore.ts`) — `GameStats` с обновлением после каждой игры
4. **MMKV Storage** (`src/lib/storage/`) — `gameStorage.ts`, `statsStorage.ts`, `settingsStorage.ts` для персистентности
5. **Автосохранение** — middleware для Zustand: сохранение состояния при каждом изменении (закрытие приложения mid-game → восстановление)
6. **Edge cases** из [секции 5.8](GUESS_CARD_GAME_MOBILE_SPEC_RU.md): буфер=0 при фиксации, последняя карта промах, последняя карта джокер, щит+фиксация, автофиксация в конце

**Проверка:** Написать "headless game" тест: создать store, прогнать 10 ходов программно, проверить все переходы фаз, scoring, банкинг, сохранение/загрузку из MMKV

---

## Фаза 3: UI Foundation — тема и навигация (2-3 дня)

**Цель:** Рабочая навигация между всеми экранами, дизайн-система

**Задачи:**

1. **Theme** (`src/theme/`) — `colors.ts`, `typography.ts`, `spacing.ts` по [секции 7.2-7.3](GUESS_CARD_GAME_MOBILE_SPEC_RU.md) (dark theme, emerald/gold palette)
2. **UI Kit** (`src/components/ui/`) — `Button`, `Card` (UI container), `Modal`, `Badge` — базовые переиспользуемые компоненты
3. **Navigation** (`app/`) — Expo Router:
  - `app/_layout.tsx` — Root layout
  - `app/(tabs)/index.tsx` — Главный экран (заглушка с кнопками)
  - `app/(tabs)/game.tsx` — Игровой экран (заглушка)
  - `app/(tabs)/stats.tsx` — Статистика (заглушка)
  - `app/(tabs)/settings.tsx` — Настройки (заглушка)
4. **Safe Area** (`src/components/shared/SafeArea.tsx`)
5. **Главный экран** — по макету [секции 7.5.1](GUESS_CARD_GAME_MOBILE_SPEC_RU.md): лого, кнопки "Играть", "Обучение", "Лидерборды", "Настройки", мини-инфо (ранг, best score)
6. **Экран настроек** — рабочие переключатели: звук, вибрация, вероятности, язык (RU/EN)

**Проверка:** Приложение запускается в Expo Dev Client, навигация между всеми экранами работает, настройки сохраняются при перезапуске

---

## Фаза 4: Core Gameplay Screen (5-7 дней)

**Цель:** Полностью играбельная партия на экране

Это самая большая и важная фаза. Разбиваем на подзадачи:

**4.1 Экран выбора режима** (`src/components/screens/ModeSelectScreen.tsx`):

- Выбор 36 или 52 карты
- Описание каждого режима

**4.2 Экран Loadout** (`src/components/loadout/LoadoutScreen.tsx`):

- Карточки джокеров (`JokerCard.tsx`)
- Выбор 1 (36) или 2 (52) джокеров
- Описания способностей

**4.3 Игровой HUD** — по макету [секции 7.5.2](GUESS_CARD_GAME_MOBILE_SPEC_RU.md):

- **Top bar**: `MatchTimer` + счетчик карт ("Осталось: N/36") + Общий Счет
- **Joker icons**: `JokerIndicator` (затемненные до активации)
- **Buffer area**: `BufferPanel` — Буфер (крупно) + множитель + статус + кнопка "ЗАФИКСИРОВАТЬ"
- **Card area**: `PlayingCard` (рубашка/лицо) + `DeckStack`
- **Result area**: `ResultBadge` (+BB / ПРОМАХ)
- **Controls**: `GameControls` — селекторы Номинал + Масть + кнопка "Угадать"
- **Probabilities**: `ProbabilityDisplay` (если включено)
- **History**: Свернутый список последних 5 ходов

**4.4 PlayingCard с анимацией**:

- `react-native-reanimated` для 3D flip (rotateY, 600ms, perspective 1000)
- Рубашка карты и лицо (номинал + масть + цвет)
- Для джокеров: специальный дизайн

**4.5 Полный Game Flow**:

- Подключить `gameStore` к UI
- Цикл: выбрать → угадать → анимация flip → показ результата → пауза → discard → next
- Кнопка "ЗАФИКСИРОВАТЬ" (активна только если buffer > 0)
- Конец игры: автофиксация, показ результатов

**4.6 Game Over Modal** (`GameOverModal.tsx`):

- Финальный счет, время, статистика
- Кнопки: "Играть снова", "Поделиться", "Статистика"

**Проверка:** Полная партия от начала до конца: выбор режима → loadout → 36+ ходов → фиксации → конец игры → результат. Проверить все типы совпадений, промахи, фиксацию, множители

---

## Фаза 5: Joker System Integration (2-3 дня)

**Цель:** Джокеры полностью интегрированы в геймплей

**Задачи:**

1. **Активация Красного Джокера** — при открытии: анимация, буфер x1.3, текст эффекта
2. **Активация Черного Джокера** — при открытии: анимация, индикатор щита на HUD
3. **Shield mechanics** — при следующем промахе: буфер не сгорает, щит деактивируется, множитель сбрасывается
4. **Edge cases**: щит + фиксация (щит пропадает), два одинаковых джокера (52), джокер на последнем ходу
5. `**JokerActivation.tsx**` — специальная анимация (1200ms, spring) с описанием эффекта

**Проверка:** Сыграть партию 52 карт с двумя джокерами: Красный активируется и увеличивает буфер, Черный активируется и защищает от следующего промаха

---

## Фаза 6: Juice — звук, хэптики, анимации (3-4 дня)

**Цель:** Приложение "чувствуется" как игра, а не прототип

**Задачи:**

1. **Sound Manager** (`src/lib/audio/soundManager.ts`) — preload + play:
  - `card-flip.mp3`, `coins.mp3`, `miss.mp3`, `bank-success.mp3`, `joker-activate.mp3`, `big-win.mp3`, `legendary.mp3`, `shield-on.mp3`, `ui-click.mp3`
  - Placeholder звуки (бесплатные) для MVP, заменим позже
2. **Haptics** (`src/lib/haptics/vibration.ts`) — по таблице [секция 7.8](GUESS_CARD_GAME_MOBILE_SPEC_RU.md)
3. **Анимации** по [секция 7.6](GUESS_CARD_GAME_MOBILE_SPEC_RU.md):
  - `FlyingCoins.tsx` — анимация перелета монет при начислении BB (850ms)
  - `ConfettiEffect.tsx` — при фиксации большого буфера и x120 (3500ms)
  - Потеря буфера — красные искры (800ms)
  - Анимация фиксации — монеты летят в общий счет (1000ms)
4. **ResultBadge** — 6 вариантов по [секция 7.4.4](GUESS_CARD_GAME_MOBILE_SPEC_RU.md): miss/small/medium/large/huge/legendary с разными цветами и анимациями
5. **Множитель визуал** — цвет меняется по уровню (серый → синий → фиолетовый → золотой → радужный)

**Проверка:** Сыграть партию, убедиться что каждое действие имеет звуковой + тактильный + визуальный отклик. Выключить звук/вибрацию в настройках — работает

---

## Фаза 7: Учебный режим (1-2 дня)

**Цель:** Полноценный training mode

**Задачи:**

1. Кнопка "Обучение" на главном экране → выбор режима → loadout → игра
2. `DiscardPile.tsx` — видимая стопка последних 8-12 карт (затененные)
3. Кнопка "Показать сброс" toggle
4. Отдельная статистика для training mode
5. Нет записи в лидерборд

**Проверка:** Training mode: видны сброшенные карты, статистика считается отдельно, вероятности обновляются корректно

---

## Фаза 8: Onboarding и Tutorial (2-3 дня)

**Цель:** Новый пользователь понимает игру за 60 секунд

**Задачи:**

1. **Интерактивный туториал** (`OnboardingScreen.tsx`) — 6 шагов из [секции 4.1.4](GUESS_CARD_GAME_MOBILE_SPEC_RU.md):
  - Выбор режима, Loadout, как угадывать, система BB, буфер/фиксация, учебный режим
2. **Tooltips** — на первых 3 партиях (подсвечивают ключевые элементы UI)
3. **Popup при первом джокере** — всплывающее объяснение способности
4. **Хук `useOnboarding.ts**` — трекинг прогресса туториала, хранение в MMKV

**Проверка:** Сбросить состояние приложения, пройти полный туториал, убедиться что подсказки показываются первые 3 игры и потом исчезают

---

## Фаза 9: Статистика и Достижения (2-3 дня)

**Цель:** Прогрессия и мотивация к повторной игре

**Задачи:**

1. **Экран статистики** (`stats.tsx`):
  - Лучший счет, общий счет за все время, лучший множитель, сыграно партий, точность
  - Разделение по режимам (36/52)
2. **Система достижений** — 8 базовых из [секции 4.1.3](GUESS_CARD_GAME_MOBILE_SPEC_RU.md):
  - "Первая кровь", "Точное попадание", "Мастер памяти", "В огне!", "Элита", "Бог игры", "Мастер фиксации", "Коллекционер Джокеров"
3. **Achievement Toast** (`AchievementToast.tsx`) — всплывающее уведомление при разблокировке
4. **Проверка достижений** — после каждой игры и после каждого хода (для streak-based)
5. **Локальные лидерборды** — топ-10 лучших игр (Hall of Fame) + Total Score (для будущего глобального рейтинга)

**Проверка:** Сыграть несколько партий, разблокировать 2-3 достижения, проверить что тосты появляются, статистика корректна

---

## Фаза 10: Backend Integration (3-5 дней)

**Цель:** Firebase + Supabase + Amplitude подключены и работают

**Предварительно:** Создать аккаунты Firebase, Supabase, Amplitude (все бесплатные)

**Задачи:**

1. **Firebase Setup**:
  - Создать Firebase проект
  - Добавить `@react-native-firebase/app`, `/auth`, `/remote-config`, `/analytics`, `/crashlytics`
  - Config plugins для Expo
  - `initFirebase()` — Anonymous Auth + Remote Config defaults из [секции 6.3.2](GUESS_CARD_GAME_MOBILE_SPEC_RU.md)
  - **EAS Development Build** (Expo Go не поддерживает нативные Firebase модули)
2. **Remote Config** — все игровые параметры вынесены ([секция 6.7](GUESS_CARD_GAME_MOBILE_SPEC_RU.md)):
  - BB таблицы, множители стрика, red joker multiplier
  - Feature flags (training_mode, achievements, leaderboards)
  - Scoring module читает из Remote Config вместо хардкода
3. **Supabase Setup**:
  - Создать проект Supabase
  - SQL Schema для лидербордов из [секции 6.3.3](GUESS_CARD_GAME_MOBILE_SPEC_RU.md)
  - RLS policies
  - `submitHighScore()`, `getHighScores()`, `updateTotalScore()`
  - Rate limiter ([секция 6.3.4](GUESS_CARD_GAME_MOBILE_SPEC_RU.md))
  - Graceful degradation (cache fallback)
4. **Amplitude** — события из [секции 9.3](GUESS_CARD_GAME_MOBILE_SPEC_RU.md):
  - `app_opened`, `tutorial_started/completed`, `game_started/finished`
  - `turn_played`, `buffer_banked`, `buffer_lost`
  - Воронка: app_opened → tutorial → game_started → buffer_banked → game_finished
5. **Budget Alerts** — Firebase $50, Supabase $25
6. **Monitoring** (`src/lib/utils/monitoring.ts`) — трекинг API calls

**Проверка:**

- Firebase Auth: anonymous user создается
- Remote Config: значения загружаются, игра использует их
- Supabase: счет отправляется и появляется в лидерборде
- Amplitude: события видны в дашборде
- Офлайн: игра работает, лидерборд показывает кэш

---

## Фаза 11: Монетизация (2-3 дня)

**Цель:** Реклама + IAP готовы

**Предварительно:** Создать аккаунты AdMob, RevenueCat

**Задачи:**

1. **AdMob** (`react-native-google-mobile-ads`):
  - Баннер на главном экране (нет в игре)
  - Interstitial после каждой 3-й игры (cooldown 5 мин, через Remote Config)
  - Rewarded: "Спасти буфер" после промаха (1 раз за игру)
  - Rewarded: "Удвоить счет" на экране результатов
2. **RevenueCat** (`react-native-purchases`):
  - Product: `remove_ads` ($2.99, non-consumable)
  - Product: `hint_pack_3` ($0.99, consumable)
  - Restore purchases
  - Paywall screen
3. **Ad-free логика**: если куплено `remove_ads` → никакой рекламы
4. **Amplitude events**: `ad_watched`, `iap_started`, `iap_completed`

**Проверка:** Тестовая реклама показывается, sandbox покупка проходит через RevenueCat, remove_ads убирает рекламу

---

## Фаза 12: Тестирование и QA (5-7 дней)

**Цель:** Release Candidate без критичных багов

**Задачи:**

1. **Unit-тесты** — дополнить если не хватает (scoring, streak, joker, probability, deck) — target coverage 90%+ для `lib/game/`
2. **Integration тесты** — Supabase leaderboard (mock), MMKV persistence
3. **Device testing**:
  - iOS: iPhone 8 (минимум), iPhone 12, iPhone 15
  - Android: API 26 (Android 8), API 33 (Android 13)
4. **Edge cases** из [секции 5.8](GUESS_CARD_GAME_MOBILE_SPEC_RU.md):
  - Закрытие mid-game → восстановление
  - Буфер=0 + fix button disabled
  - Последняя карта промах / джокер
  - Два одинаковых джокера
  - Офлайн → лидерборд fallback
5. **Performance**: 60fps анимации, no jank
6. **Accessibility**: VoiceOver (iOS), TalkBack (Android)
7. **Офлайн**: полный геймплей, реклама disabled, лидерборд кэш
8. **App size**: target < 50 MB
9. **Beta**: TestFlight (iOS) + Internal Testing (Android)
10. **Fix critical bugs**

**Проверка:** RC1 build прошел полный QA чеклист, beta-тестеры не нашли критичных багов

---

## Фаза 13: Подготовка к Store и Submit (3-5 дней)

**Цель:** Приложение подано в App Store + Google Play

**Задачи:**

1. **App Icon** — 1024x1024 PNG (iOS) + 512x512 (Android)
2. **Screenshots** — 6.5", 6.7" iPhone + Android
3. **Store listing** — описание RU + EN из [секции 11](GUESS_CARD_GAME_MOBILE_SPEC_RU.md)
4. **Privacy Policy** — опубликовать на cardbbgame.com
5. **Terms of Use**
6. **App Store Connect** / **Google Play Console** настройка
7. **EAS Build production** + **EAS Submit**
8. **Content rating** — 4+ (Apple), Everyone (Google)
9. **Data safety** — аналитика (анонимная), crash reports

**Проверка:** Приложение подано, статус "Waiting for Review"

---

## Фаза 14: Post-Launch Roadmap

### v1.1 (Месяц 2) — Оптимизация монетизации

- AppLovin MAX как mediation layer (2x eCPM)
- A/B тесты баланса через Remote Config
- Анализ retention по Amplitude, корректировка

### v1.2 (Месяц 3) — Социальные функции

- Глобальные лидерборды (Supabase уже готов)
- Поделиться счетом в соцсетях
- 30+ достижений
- Система рангов (6...Joker)

### v1.3 (Месяц 4) — Контент

- Ежедневный вызов (фиксированная колода дня)
- Премиум темы карт (IAP)
- Новые джокеры: Золотой, Радужный, Прозрачный
- Hot-Seat мультиплеер (2 игрока, 1 устройство)

### v2.0 (Месяц 6+) — Масштабирование

- Турниры и Лиги
- Season Pass
- Онлайн мультиплеер
- Локализация (ES, PT, DE)

---

## Порядок внешних аккаунтов

Создавать по мере необходимости:

- **Фаза 0:** Apple Developer ($99/год), Google Play Console ($25)
- **Фаза 10:** Firebase (free), Supabase (free), Amplitude (free)
- **Фаза 11:** AdMob (free), RevenueCat (free)

---

## Итоговые оценки


| Фаза                    | Дни                   | Кумулятивно     |
| ----------------------- | --------------------- | --------------- |
| 0: Bootstrap            | 1-2                   | 1-2             |
| 1: Game Engine          | 3-4                   | 4-6             |
| 2: State + Storage      | 2-3                   | 6-9             |
| 3: UI Foundation        | 2-3                   | 8-12            |
| 4: Gameplay Screen      | 5-7                   | 13-19           |
| 5: Joker Integration    | 2-3                   | 15-22           |
| 6: Juice                | 3-4                   | 18-26           |
| 7: Training Mode        | 1-2                   | 19-28           |
| 8: Onboarding           | 2-3                   | 21-31           |
| 9: Stats + Achievements | 2-3                   | 23-34           |
| 10: Backend             | 3-5                   | 26-39           |
| 11: Monetization        | 2-3                   | 28-42           |
| 12: Testing + QA        | 5-7                   | 33-49           |
| 13: Store Submit        | 3-5                   | 36-54           |
| **Итого**               | **36-54 рабочих дня** | **7-11 недель** |


Реалистичная оценка: **8-9 недель** при фулл-тайм работе с AI-ассистентом.