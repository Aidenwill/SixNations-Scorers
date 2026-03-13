# Six Nations Scoring Duel - Web App

Static web app with three game modes:
- Duel mode (pick the highest scorer)
- Daily mode (Player of the Day puzzle)
- Daily Grid mode (3x3 constraints)

## Quick Start

```bash
cd web-app
python -m http.server 8080
```

Open `http://localhost:8080`.

## Features

### Duel Mode
- 1v1 player comparison with streak tracking
- Rotating anchor logic to avoid stale matchups
- Team-aware cards (colors + emblems)
- Player details modal (full scoring breakdown)

### Daily Mode (Joueur du Jour)
- Deterministic daily target based on local date
- Max 12 attempts
- Search + keyboard autocomplete
- Hint grid on 5 fields:
	- Team
	- Total points
	- Activity start year
	- Activity end year
	- Name length
- Optional hint offers after failed attempts:
	- At 4 failed attempts: 2 random hint choices
	- At 8 failed attempts: 2 random hint choices
	- Player chooses one hint or can skip
- Daily result includes:
	- Share text (emoji grid)
	- Number of hints used
	- Details button for target player scoring history

### Daily Grid Mode (Grille du Jour)
- New 3x3 daily puzzle with row and column constraints
- Each cell must match both constraints (row + column)
- Search/autocomplete to place a player in selected cell
- One player can only be used once in the grid
- Clicking a filled/revealed cell opens the player details modal
- Can abandon a grid: empty cells are auto-filled with valid candidates in red
- Abandon auto-fill picks random valid candidates (not always the same players)
- Share supports mixed results:
	- 🟩 player placed by user
	- 🟥 valid answer revealed after abandon
	- ⬜ still empty (if any)
- Rule pool includes opponent and scoring constraints:
	- scored against a given team
	- at least X points against a given team
	- at least X points in a given year
- Grid generation guarantees at least 2 candidates per cell
- Daily persistence in localStorage

### Internationalization
- Supported languages: `fr`, `en`, `it`, `cy`, `ga`, `gd`
- Dynamic UI translation without reload
- Team names localized via team translation keys

## Project Tree

```text
web-app/
	index.html
	styles.css
	script.js
	package.json
	players.json
	js/
		constants.js
		daily-game.js
		daily-grid-game.js
		daily-hints.js
		filters.js
		game-engine.js
		game-utils.js
		i18n.js
		player-details-modal.js
		share.js
		state-store.js
		teams.js
		ui.js
		tests/
			daily-game.test.js
			game-engine.test.js
			game-utils.test.js
	assets/
		flags/
```

## Module Responsibilities

- `script.js`: bootstrap + wiring between modules
- `js/daily-game.js`: daily puzzle state machine, hints, rendering, persistence
- `js/daily-grid-game.js`: 3x3 constraint grid generator, validation, and controller
- `js/daily-hints.js`: pure hint-offer selection/sanitization helpers
- `js/game-engine.js`: pure duel transition logic
- `js/game-utils.js`: scoring/date/escaping utilities
- `js/i18n.js`: dictionaries and translation helper
- `js/filters.js`: duel eligibility filtering UI/state
- `js/player-details-modal.js`: modal rendering for scoring details
- `js/share.js`: duel share flow
- `js/state-store.js`: duel state container/reset
- `js/teams.js`: canonicalization + localized team display
- `js/ui.js`: DOM bindings and static label updates

See also: `ARCHITECTURE.md` for runtime/state design notes.

## Tests

```bash
cd web-app
npm test
```

Unit-only:

```bash
npm run test:unit
```

E2E Daily smoke test:

```bash
npm run test:e2e
```

First-time Playwright setup (required once per machine):

```bash
npx playwright install chromium
```

Current suite:
- `game-engine.test.js`: 7 tests
- `game-utils.test.js`: 18 tests
- `daily-hints.test.js`: 11 tests
- `daily-hints-flow.test.js`: 6 tests
- `daily-game.test.js`: 41 tests
- `tests/e2e/daily-hints-flow.spec.js`: 1 Playwright smoke test

Pre-release smoke process: `QA_CHECKLIST.md`

## Troubleshooting

### "304" responses in Network tab
`304 Not Modified` is normal HTTP cache behavior, not a runtime error.

### "Nothing works"
If UI freezes or stops rendering, check browser Console first for JavaScript errors.
The app is module-based: one uncaught error can block part of initialization.

## Notes

- Fully static: compatible with local static servers and GitHub Pages.
- Preferences and daily progress are persisted in `localStorage`.
- Team logos come from Wikimedia Commons (free-license sources).
