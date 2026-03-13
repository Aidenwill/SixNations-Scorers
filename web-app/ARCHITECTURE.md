# Architecture Notes

## Runtime Flow

1. `script.js` loads `players.json` and normalizes player objects.
2. Duel controllers are initialized (`filters`, `share`, duel state/UI).
3. Daily controller is initialized (`daily-game.js`).
4. `applyTranslations()` propagates labels to all active controllers.

## Daily Mode State

`js/daily-game.js` keeps five persisted concerns:
- current day key (`sixnations_daily_date`)
- guesses (`sixnations_daily_guesses`)
- win flag (`sixnations_daily_won`)
- give-up flag (`sixnations_daily_given_up`)
- hint state (`sixnations_daily_revealed_fields`, `sixnations_daily_hint_offers`)

The controller computes:
- deterministic target via date hash
- per-guess hint vectors
- optional hint offers at configured failed-attempt thresholds

## Duel Mode State

Duel state is centralized in `js/state-store.js` and updated through:
- `js/game-engine.js` for pure winner/next-round transitions
- `script.js` for orchestration and rendering

## Translation Strategy

`js/i18n.js` contains dictionary objects by language key.
All UI text should be resolved through `t(...)` and never hard-coded in logic.

## Design Constraints

- Browser-native ES modules only (no build step)
- Static hosting compatibility
- Pure functions are isolated for testability
