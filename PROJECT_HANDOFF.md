# Synapse Project Handoff

This is the living handoff document for Synapse, a mental math game. Update it whenever product rules, display preferences, persistence choices, or code structure changes so another LLM or developer can continue without re-discovering the project.

## Product Goal

Synapse is a fast mental arithmetic drill game inspired by timed arithmetic practice. The game should stay simple, direct, and data-focused. Analytics are a core part of the product, not an afterthought.

The displayed site/app name is `Synapse`. Keep folder names, repo names, storage keys, and Cloudflare project identifiers unchanged unless the user explicitly asks to rename those too.

Primary goals:

- Let players complete timed arithmetic sessions with automatic answer submission.
- Preserve useful history so players can see speed trends over time.
- Keep the UI compact, focused, and game-like rather than marketing-heavy.
- Be easy to host on Cloudflare Pages, with optional username/PIN account sync for cross-device progress.

## Current Tech Stack

- React with Vite.
- Plain CSS in `src/styles/math-game.css`.
- Local browser persistence with `localStorage`.
- Cloudflare Pages Functions plus D1 for optional account sync.

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
- `src/features/progress/`: "Save my progress" panel and username/PIN account UI.
- `src/lib/constants.js`: Operation metadata and operation ordering.
- `src/lib/presets.js`: Default preset and preset helpers.
- `src/lib/problems.js`: Problem generation and answer logic.
- `src/lib/analytics.js`: Session analytics, factor grouping, speed colors.
- `src/lib/trends.js`: Trend chart data series.
- `src/lib/progressStorage.js`: Local storage persistence.
- `src/lib/syncApi.js`: Account sync client, legacy generated-code sync client, and local preview fallbacks.
- `public/tkimifylight.png`: Footer logo asset from the tkimify footer kit.
- `functions/_shared/syncHelpers.js`: Shared Cloudflare Function helpers for JSON, D1 validation, username/PIN hashing, sessions, and rate limits.
- `functions/api/account/`: Cloudflare Pages Functions for username/PIN accounts.
- `functions/api/sync/`: Legacy Cloudflare Pages Functions for sync codes.
- `migrations/0001_progress_codes.sql`: D1 schema for generated-code progress sync.
- `migrations/0002_accounts.sql`: D1 schema for username/PIN account sync.

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

The first/default built-in preset is named `Easy`.

Easy settings:

- Duration: 60 seconds.
- Addition: first number 2 to 10, second number 2 to 20.
- Subtraction: first number 2 to 10, second number 2 to 20.
- Multiplication: both factors 2 to 12.
- Division: both generated factors 2 to 12.
- Existing local or remote progress should be upgraded to include Easy if it is missing.

The harder built-in preset is named `Default`.

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
- Show the tkimify logo link centered at the very bottom of the page, outside the main game shell, linking to `https://tkimify.com`.
- The tkimify footer hover color should use the Synapse accent green, not the original kit gold.
- On short pages, the footer should sit near the bottom of the viewport without creating extra blank scroll space.
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
- Addition and subtraction breakdown cards may sit side by side, but their internal stat rows must use compact columns so nothing protrudes beyond the card edge.

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

- Rank only subcategories, not whole-operation averages.
- Addition/subtraction candidates are regrouping/borrowing and no-regrouping/no-borrowing buckets.
- Multiplication/division candidates are factor/divisor buckets from 1 through 12.
- Include any subcategory with at least one attempt; do not hide slow buckets behind a multi-attempt threshold.
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
- Users can optionally choose "Save my progress" to create or sign into a username/PIN account.
- The save action should appear as small text at the bottom inside the main app container.
- The progress panel should overlay the main app container.
- The overlay should be opaque so underlying text does not bleed through.
- Clicking outside the progress popup should close it.
- The progress popup should always show a Back button at the bottom.
- Do not show background auto-save messages like "Saved locally and to your account" inside the progress popup.

Username/PIN account sync:

- Users create or sign into an account with username plus 4 digit PIN.
- Usernames are normalized lowercase and must use 3-20 letters, numbers, or underscores.
- PINs must be exactly 4 digits.
- Never store raw PINs in D1.
- Store PINs as salted SHA-256 hashes, never as raw values.
- Store only a session token hash in D1; the browser keeps the session token in localStorage.
- Login is rate limited to 10 failed PIN attempts per username per 15-minute window.
- Account progress auto-saves to D1 after sign-in.
- On local preview, account sync has a browser-only fallback so the flow can be tested without Cloudflare.
- The old generated-code API still exists for compatibility, but it is no longer the visible product flow.
- On Cloudflare, account sync should use Pages Functions and D1.
- The required D1 binding name is `DB`.
- `wrangler.toml` declares the D1 binding with database name `d1-synapse` and database id `3fedf6c0-7445-4a28-8a2d-c5f15f668b2c`.
- If Cloudflare shows a "Cloud sync needs a Cloudflare D1 binding named DB" error, the app code is deployed but the Pages project still needs the D1 database binding and migration.

## Preset Editing

- Settings edits are made in a draft copy of the currently selected preset.
- `Save Changes` overwrites the currently selected preset with the draft settings.
- `Save As New` creates a new preset from the current draft settings and makes it active.
- The current UI can name a new preset, but does not yet include a rename control for an existing preset.

Cloudflare request behavior:

- Normal gameplay does not need backend requests if progress stays local.
- Static asset requests happen when the app loads.
- API requests happen when a user creates an account, signs in, signs out, or saves progress to an account.
- Cloudflare builds are separate from gameplay requests. Each pushed deploy can count as a build depending on the Cloudflare plan/configuration.

## Deployment Notes

The app is Cloudflare Pages-friendly:

- Vite builds static assets into `dist`.
- Cloudflare Pages can serve the static app.
- Cloudflare must deploy the built `dist` directory, not the repo root. If it serves the repo root, the browser will try to load `/src/main.jsx` and fail with a `text/jsx` MIME error.
- `wrangler.toml` sets `pages_build_output_dir = "dist"` as an extra guardrail.
- Pages Functions in `functions/api/account` provide the account sync API.
- Legacy generated-code Pages Functions remain in `functions/api/sync`.
- D1 migrations are in `migrations/0001_progress_codes.sql` and `migrations/0002_accounts.sql`.

Before deploying account sync:

1. Create a D1 database.
2. Run both migration SQL files.
3. Bind the database to the Pages project as `DB` through `wrangler.toml`.
4. Deploy the Pages project.

## Current Product Decisions To Preserve

- Keep the app minimal and contained.
- Analytics are important and should stay prominent.
- Username/PIN account sync is the current cross-device persistence model.
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
