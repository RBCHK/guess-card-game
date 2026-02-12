# Guess Card — Rules, Skills, Subagents, MCP

Краткая сводка по настройке контекста Cursor для разработки по спеке.

---

## ✅ Создано в репозитории

### Rules (`.cursor/rules/`)

| Файл | Когда применяется | Содержание |
|------|-------------------|------------|
| `react-native-expo.mdc` | Редактирование `app/**`, `src/**`, конфиги | Expo Router, pnpm, Zustand, MMKV, Reanimated, EAS Build |
| `game-logic.mdc` | Редактирование `src/lib/game/*`, `gameStore`, `useGame` | Типы, BB, стрик, Джокеры, граничные случаи из спеки |
| `backend-services.mdc` | Firebase, Supabase, аналитика, монетизация | Только бесплатный Firebase, Supabase + RLS, rate limit, бюджет |

Правила с `globs` подхватываются при работе с соответствующими файлами; `description` используется для "Apply Intelligently".

### Skill (`.cursor/skills/guess-card-mechanics/`)

- **Когда:** реализация или отладка игровой логики (подсчёт, Джокеры, колода, вероятности).
- **Что делает:** отсылает агента к спеке (разделы 5, 5.8, 6.5, 6.6), таблицам BB/множителей и граничным случаям.
- Можно вызывать вручную: `/guess-card-mechanics` в чате.

### Subagent (`.cursor/agents/verifier.md`)

- **Когда:** после реализации фичи или по запросу "проверь, что работает".
- **Что делает:** проверяет код против спеки, типы, граничные случаи, при возможности запускает тесты.
- Вызов: `/verifier` или "используй verifier, чтобы проверить …".

---

## Рекомендуемые MCP (подключить вручную)

В [Cursor → Settings → MCP](https://cursor.com/docs/context/mcp) или `~/.cursor/mcp.json` / `.cursor/mcp.json`:

| Сервер | Зачем для Guess Card |
|--------|----------------------|
| **Supabase** | Схема лидербордов, RLS, данные. [Инструкция](https://mcp.supabase.com/mcp) (SSE, OAuth). |
| **Figma** | Если макеты в Figma — вытягивание компонентов и стилей. [mcp.figma.com](https://mcp.figma.com/mcp). |
| **Amplitude** | Продуктовая аналитика (воронки, когорты) — просмотр событий и дашбордов. [mcp.amplitude.com](https://mcp.amplitude.com/mcp). |

**Firebase:** в списке MCP Cursor нет готового Firebase MCP; конфиг и логику по спеке держи в коде и в rule `backend-services.mdc`.

---

## Глобальные скиллы (у тебя уже есть)

Имеет смысл держать включёнными при работе над Guess Card:

- **mobile-tech-lead** — архитектура, RevenueCat, Amplitude, remote config, MVP.
- **monetization-pricing-specialist** — IAP, paywall, trial (когда дойдёшь до монетизации).
- **product-designer-conversion** — онбординг, туториал, конверсия (секция 7 и 4.1.4 спеки).
- **aso-specialist** — перед релизом: ключевые слова, метаданные (секция 11 спеки).

Остальные (indie-founder, market-growth, ua-performance, reviews) — по необходимости.

---

## Как пользоваться

1. **Обычная разработка:** правила подтягиваются по путям файлов и по описанию. Спека — главный источник истины; при сомнениях открывай `GUESS_CARD_GAME_MOBILE_SPEC_RU.md`.
2. **Новая игровая механика или баг в логике:** вызови `/guess-card-mechanics` или упомяни "по механике из спеки".
3. **После фичи или перед коммитом:** вызови `/verifier` с кратким описанием, что сделано — агент проверит соответствие спеке.
4. **MCP:** подключи Supabase (и при наличии макетов — Figma) в настройках Cursor.
