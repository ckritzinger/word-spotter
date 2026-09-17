# Word Spotter

Single-page part-of-speech classification arcade game. Vue 3 (`<script setup>`) + Tailwind CSS, no backend — all state in `localStorage`. Built with Vite, deployed to GitHub Pages via `.github/workflows/deploy.yml`. Cloned from `../x-blitz` (× Blitz) — same screen graph, timer/scoring/streak mechanic, and profile/leaderboard system; the round mechanic swaps "pick the product" for "pick the part of speech."

## Stack
- Vue 3 SFCs, Composition API, `<script setup>`
- Tailwind CSS (utility classes only, no component library)
- Vite build, `pnpm` package manager
- No router — `App.vue` is a hand-rolled state machine (a `screen` ref: `'profiles' | 'home' | 'pin' | 'settings' | 'game' | 'summary' | 'leaderboard'`), switched with `v-if`/`v-else-if`

## Structure
- `src/App.vue` — top-level screen switch + wiring between `src/lib/storage.js` and the screen components
- `src/components/` — one component per screen (`ProfileSelect`, `Home`, `PinGate`, `Settings`, `Game`, `Summary`, `Leaderboard`), plus `WordRain.vue` (shared canvas background effect — rains random words from the word list instead of numbers)
- `src/lib/storage.js` — all `localStorage` read/write (users, settings, active user id)
- `src/lib/wordGen.js` — category ordering/labels, pool building, word-pick logic (pure functions, no Vue)
- `src/data/words.js` — curated ~220-word list, each tagged with one canonical part of speech
- `word-spotter-game-spec.md` — the product spec this was built from

## Conventions / things to know (inherited from × Blitz, still true here)
- **No router, no store library.** Screen transitions are plain refs emitted up to `App.vue`.
- **Settings are gated behind a hardcoded PIN (`1337`)** in `PinGate.vue` — intentional, not a real auth boundary.
- **Countdown timer decays asymptotically** (exponential half-life, not linear) — see `HALF_LIFE_MS` in `Game.vue`.
- **Streak bar is `fixed` to the viewport bottom**, with permanently-reserved bottom padding on the page (not conditional) — never reflows/overlaps the answer grid.
- **Confetti bursts are plain JS-driven inline `transform`/`opacity` transitions** (double-`requestAnimationFrame` to force a paint before flipping state), not `@keyframes` + CSS custom properties — that combo silently failed to animate in × Blitz, don't reintroduce it.
- `WordRain.vue` is a self-contained canvas component (sizes itself off `canvas.parentElement`).
- Mobile viewport handling: `min-h-[100dvh]` + `env(safe-area-inset-bottom)`-aware padding.

## What's different from × Blitz
- **Answer buttons are part-of-speech categories, not a 3×3 number grid.** The set of buttons is derived once per game from Settings (`answerOptions()` in `wordGen.js`) and stays fixed for the whole game — button labels never move mid-game, only their correct/incorrect highlight state changes. Grid is 2 or 3 columns depending on how many categories are active (2–11).
- **No catch-all category.** `buildPool()` in `wordGen.js` only includes words whose tag is an active category — a word tagged with a category the player hasn't enabled is simply omitted from the round pool. Don't reintroduce an "Other" bucket; it was tried and explicitly rejected (muddied what the correct answer meant).
- **Settings enforces a minimum of 2 active categories**, by refusing the toggle rather than clamping after the fact — see the `toggle()` guard in `Settings.vue`.
- Word/category picks have no positional randomization (buttons keyed by category, not by round) since the category set doesn't change round-to-round — unlike × Blitz's number grid, which re-randomizes position every round.

## Commands
```bash
pnpm install
pnpm dev       # local dev server
pnpm build     # production build to dist/
pnpm preview   # preview the production build
```

## Deploy
Push to `main` → GitHub Actions builds with pnpm and deploys `dist/` to GitHub Pages (repo Pages source must be set to "GitHub Actions"). `vite.config.js` `base` is hardcoded to `/word-spotter/` — update it if the repo is ever renamed.
