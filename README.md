# Speed Math

React MVP for a mental math drill game.

## Preview locally

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the preview server:

   ```bash
   npm run dev
   ```

3. Open the local URL Vite prints, usually:

   ```text
   http://localhost:5173
   ```

## Project structure

- `src/App.jsx` controls which screen is visible and owns app-level state.
- `src/features/landing` contains the start screen.
- `src/features/game` contains the live game screen.
- `src/features/settings` contains presets and operation settings.
- `src/features/results` contains the post-game summary.
- `src/features/analytics` contains full analytics views.
- `src/components` contains small reusable UI pieces.
- `src/lib` contains expandable game logic, analytics, presets, IDs, and formatting helpers.
- `src/styles/math-game.css` contains the visual styling from the MVP.
- `functions/api/sync` contains Cloudflare Pages Functions for generated-code progress sync.
- `migrations/0001_progress_codes.sql` contains the D1 table for sync codes.

## Progress saving

The app always saves progress locally in the browser with `localStorage`.

Generated-code sync is Cloudflare-ready. To enable it on Cloudflare Pages, create a D1 database, run the SQL in `migrations/0001_progress_codes.sql`, and bind that database to the Pages project as `DB`.
