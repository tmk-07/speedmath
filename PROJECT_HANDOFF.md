# Speed Math Project Handoff

This is the living handoff document for the Speed Math mental math game. Update it whenever product rules, display preferences, persistence choices, or code structure changes so another LLM or developer can continue without re-discovering the project.

## Product Goal

Speed Math is a fast mental arithmetic drill game inspired by timed arithmetic practice. The game should stay simple, direct, and data-focused. Analytics are a core part of the product, not an afterthought.

Primary goals:

- Let players complete timed arithmetic sessions with automatic answer submission.
- Preserve useful history so players can see speed trends over time.
- Keep the UI compact, focused, and game-like rather than marketing-heavy.
- Be easy to host on Cloudflare Pages, with optional generated-code sync for cross-device progress.

## Current Tech Stack

- React with Vite.
- Plain CSS in `src/styles/math-game.css`.
- Local browser persistence with `localStorage`.
- Cloudflare Pages Functions plus D1 for optional generated-code sync.

React is currently the right choice for this MVP because the app has multiple views, stateful settings, timers, analytics, chart toggles, local storage, and future sync/login-like features. Vite produces static files that can be deployed to Cloudflare Pages.

## How To Run

Install dependencies:

```bash
npm install
```

Start local preview:

```bash
npm run dev
```

Open the URL Vite prints, usually `http://localhost:5173`.

Build for deployment:

```bash
npm run build
```

## Code Structure

- `src/main.jsx`: React entry point.
- `src/App.jsx`: App-level state, routing between views, session completion, persistence hooks.
- `src/components/`: Small reusable UI primitives.
  - `Button.jsx`
  - `Card.jsx`
  - `Eyebrow.jsx`
  - `Bar.jsx`
  - `NumField.jsx`
- `src/features/landing/`: Start screen.
- `src/features/game/`: Live game screen and timed play.
- `src/features/results/`: End-of-game results summary.
- `src/features/settings/`: Preset and operation configuration UI.
- `src/features/analytics/`: Summary analytics, trend charts, factor grids, slowest areas.
- `src/features/progress/`: "Save my progress" panel and generated-code UI.
- `src/lib/constants.js`: Operation metadata and operation ordering.
- `src/lib/presets.js`: Default preset and preset helpers.
- `src/lib/problems.js`: Problem generation and answer logic.
- `src/lib/analytics.js`: Session analytics, factor grouping, speed colors.
- `src/lib/trends.js`: Trend chart data series.
- `src/lib/progressStorage.js`: Local storage persistence.
- `src/lib/syncApi.js`: Generated-code sync client and local preview fallback.
- `functions/api/sync/`: Cloudflare Pages Functions for sync codes.
- `migrations/0001_progress_codes.sql`: D1 schema for generated-code progress sync.

## Game Flow

1. Player starts from the landing screen.
2. Player can use the default preset or edit settings.
3. A timed game begins.
4. The answer input automatically advances to the next problem only when the correct answer is typed.
5. Pressing Enter should not check or submit the answer because auto-submit already handles correct answers.
6. At the end of the timer, show the results page.
7. Save the completed session locally.
8. Analytics are calculated from saved sessions.

## Timer Rules

- Default game length is 120 seconds.
- Timer must be based on real elapsed time or a fixed deadline.
- Answering a question must not stall, pause, reset, or stretch the timer.
- The timer should feel like an actual 120-second session.

## Default Preset

The default preset is named `Default`.

It should not include text such as "Zetamac style" in the visible default name.

Default settings:

- Duration: 120 seconds.
- Addition: 2 to 100.
- Subtraction: 2 to 100.
- Multiplication first factor: 2 to 12.
- Multiplication second factor: 2 to 100.
- Division first factor: 2 to 12.
- Division second factor: 2 to 100.

## Problem Logic

Addition:

- Generate from the configured addition ranges.
- Track regrouping/carry behavior for analytics.

Subtraction:

- Generate from the configured subtraction ranges.
- Avoid negative answers unless a future product decision explicitly allows them.
- Track borrowing/regrouping behavior for analytics.

Multiplication:

- Use one factor from the smaller configured range and one factor from the larger configured range.
- Display factor order should be randomized.
- Example: both `8 x 54` and `54 x 8` are valid displays.
- Analytics should group multiplication by the smaller factor, especially for 1 through 12 factor practice.
- Do not create separate factor analytics buckets for large factors like x15, x25, x49, etc. when those are the large side of a 1 through 12 multiplication problem.

Division:

- Division should be reverse multiplication.
- Generate two factors, multiply them, then display product divided by the smaller factor.
- The displayed format should always be big number divided by smaller number equals the other factor.
- Example: if factors are 8 and 54, display `432 / 8 = 54`, not `432 / 54 = 8`.
- Avoid awkward displays like `568 / 71` when 71 is the large factor.
- Analytics should group division by divisor, with the divisor usually in the 1 through 12 range.

## Display Preferences

General:

- Keep the app content inside the main square/rectangle container.
- Do not turn small footer-style actions into separate boxes unless there is a strong reason.
- Keep controls compact when they are secondary, such as the analytics preset dropdown.
- On analytics, the preset selector belongs in the same top row as the back arrow, "Analytics" label, and Trends/Summary button.
- Prefer focused, readable UI over explanatory marketing content.
- The app should feel like a usable tool immediately, not a landing page.

Game screen:

- No correct streak display.
- No Enter-to-check behavior.
- Answer input should submit automatically on exact correct answer.
- The hint should communicate auto-submit behavior, for example: "Type your answer - it submits automatically when correct."

Results screen:

- Show score prominently.
- Show average response time.
- Do not show accuracy or attempted count as primary stats.
- By-operation bars should use operation colors, not speed-based colors.

Operation colors:

- Addition: green, currently `#45E0B0`.
- Subtraction: orange, currently `#F2A93B`.
- Multiplication: blue, currently `#5FC1FF`.
- Division: purple, currently `#C792F2`.

## Analytics Preferences

Analytics are one of the strongest parts of the app.

Preset filtering:

- Analytics should include a compact preset dropdown.
- The analytics preset dropdown should be a small button-like control in the header row, horizontally between the "Analytics" label area and the Trends/Summary button.
- The visible analytics preset label should read as the preset name followed by its game count, for example `Default (6 games)`, and should stay very narrow.
- Displayed analytics should be based only on games played with the selected preset.

Summary:

- Do not show accuracy or attempted counts as primary values.
- Use average response time.
- By-operation summary bars should use operation colors.
- Addition/subtraction breakdown bars should use the relevant operation color.

Multiplication and division factor grids:

- Multiplication options should be factors 1 through 12.
- Division options should be divisors 1 through 12.
- Bars should not use length to represent accuracy.
- Bars should use speed-based color:
  - Green for fastest.
  - Yellow/orange for slower.
  - Red-ish for slowest.
- Multiplication factor buckets should use the smaller factor from the problem.
- Division divisor buckets should use the displayed divisor.

Slowest areas:

- Do not show rank numbers.
- Display the average time first, then the area label.
- Example layout: `4.5s x12`, with a colored bar underneath.
- Slowest area colors should use the operation/category color, not speed-based colors.

Trends:

- Analytics has a Trends button.
- Trends has options for all games, last 3, last 5, and last 10 games.
- The first trend graph should be Score.
- Other trend graphs should show seconds taken, not percent correct.
- Each section gets its own graph.
- Each graph should use colored labels for the different series.
- Multiplication/division trend labels should be 1 through 12 only.
- Clicking a trend label toggles that series on/off.
- Hover state should make clickable labels feel clickable.
- Disabled series labels should be visibly greyed out or struck through.

## Progress Saving

Current model:

- Progress always saves locally in the browser with `localStorage`.
- Users can optionally choose "Save my progress" to generate or enter a code.
- The save action should appear as small text at the bottom inside the main app container.
- The progress panel should overlay the main app container.
- The overlay should be opaque so underlying text does not bleed through.
- Clicking outside the progress popup should close it.
- The progress popup should always show a Back button at the bottom.
- Do not show background auto-save messages like "Saved locally and to your code" inside the progress popup.
- After generating a code in local preview, do not show the long preview-only explanatory sentence.

Generated-code sync:

- A user can generate a code to preserve progress across devices or longer term.
- A user can enter an existing code to load progress.
- Generating a code creates a new code linked to the current progress snapshot.
- After a code is active, future local progress changes auto-save into that active code.
- If the user generates another code, the app switches to the newest code; the older code remains with whatever data it last saved.
- On local preview, sync has a browser-only fallback so the flow can be tested without Cloudflare.
- On Cloudflare, sync should use Pages Functions and D1.
- The required D1 binding name is `DB`.

## Preset Editing

- Settings edits are made in a draft copy of the currently selected preset.
- `Save Changes` overwrites the currently selected preset with the draft settings.
- `Save As New` creates a new preset from the current draft settings and makes it active.
- The current UI can name a new preset, but does not yet include a rename control for an existing preset.

Cloudflare request behavior:

- Normal gameplay does not need backend requests if progress stays local.
- Static asset requests happen when the app loads.
- API requests happen when a user generates a code, loads a code, or saves progress to a code.
- Cloudflare builds are separate from gameplay requests. Each pushed deploy can count as a build depending on the Cloudflare plan/configuration.

## Deployment Notes

The app is Cloudflare Pages-friendly:

- Vite builds static assets into `dist`.
- Cloudflare Pages can serve the static app.
- Cloudflare must deploy the built `dist` directory, not the repo root. If it serves the repo root, the browser will try to load `/src/main.jsx` and fail with a `text/jsx` MIME error.
- `wrangler.toml` sets `pages_build_output_dir = "dist"` as an extra guardrail.
- Pages Functions in `functions/api/sync` provide the optional sync API.
- D1 migration is in `migrations/0001_progress_codes.sql`.

Before deploying generated-code sync:

1. Create a D1 database.
2. Run the migration SQL.
3. Bind the database to the Pages project as `DB`.
4. Deploy the Pages project.

## Current Product Decisions To Preserve

- Keep the app minimal and contained.
- Analytics are important and should stay prominent.
- Generated-code sync is preferred over full login for now.
- Local storage remains the default automatic saving method.
- React/Vite is acceptable and useful for this level of interactivity.
- Avoid adding backend requests to every answer unless there is a strong product reason.
- Keep settings and analytics editable/expandable without rewriting the app.

## When Continuing Development

Before making changes:

1. Read this document.
2. Check the relevant files in `src/features` and `src/lib`.
3. Preserve the display preferences unless the user explicitly changes them.
4. Update this document when a user prompt changes product rules, display preferences, persistence decisions, or code structure.

After making changes:

1. Run `npm run build`.
2. Preview locally with `npm run dev` when UI behavior changed.
3. Verify analytics and game timing when touching game/session logic.
