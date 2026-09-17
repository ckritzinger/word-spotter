# Word Spotter

Single-page part-of-speech classification arcade game. Vue 3 (`<script setup>`) + Tailwind CSS, no backend — all state in `localStorage`. Built with Vite, deployed to GitHub Pages via `.github/workflows/deploy.yml`. Cloned from `../x-blitz` (× Blitz) — same screen graph, timer/scoring/streak mechanic, and profile/leaderboard system; the round mechanic swaps "pick the product" for "pick the part of speech."

## Stack
- Vue 3 SFCs, Composition API, `<script setup>`
- Tailwind CSS (utility classes only, no component library)
- Vite build, `pnpm` package manager
- No router — `App.vue` is a hand-rolled state machine (a `screen` ref: `'profiles' | 'home' | 'pin' | 'settings' | 'game' | 'summary' | 'leaderboard'`), switched with `v-if`/`v-else-if`

## Structure
- `src/App.vue` — top-level screen switch + wiring between `src/lib/storage.js` and the screen components
- `src/components/` — one component per screen (`ProfileSelect`, `Home`, `Settings`, `Game`, `Summary`, `Leaderboard`), plus `WordRain.vue` (shared canvas background effect — rains random words from the word list instead of numbers)
- `src/lib/storage.js` — all `localStorage` read/write (users, settings, active user id)
- `src/lib/wordGen.js` — category ordering/labels, pool building, word-pick logic (pure functions, no Vue)
- `src/data/words.js` — curated 577-word list, each tagged with one canonical part of speech: 181 noun / 128 verb / 170 adjective (each with a dedicated short-word pass, mostly 3-4 letters, on top of the longer structurally-safe families), plus smaller adverb/pronoun/preposition/conjunction/interjection/gerund/participle sets. Longest word is 12 letters.
- `word-spotter-game-spec.md` — the product spec this was built from

## Conventions / things to know (inherited from × Blitz, still true here)
- **No router, no store library.** Screen transitions are plain refs emitted up to `App.vue`.
- **Countdown timer decays asymptotically** (exponential half-life, not linear) — see `HALF_LIFE_MS` in `Game.vue`.
- **Streak bar is `fixed` to the viewport bottom**, with permanently-reserved bottom padding on the page (not conditional) — never reflows/overlaps the answer grid.
- **Confetti bursts are plain JS-driven inline `transform`/`opacity` transitions** (double-`requestAnimationFrame` to force a paint before flipping state), not `@keyframes` + CSS custom properties — that combo silently failed to animate in × Blitz, don't reintroduce it.
- `WordRain.vue` is a self-contained canvas component (sizes itself off `canvas.parentElement`).
- Mobile viewport handling: `min-h-[100dvh]` + `env(safe-area-inset-bottom)`-aware padding.

## What's different from × Blitz
- **No PIN gate on Settings, and it's reachable from two screens.** × Blitz gates its Settings screen behind a hardcoded PIN (`1337`, `PinGate.vue`) as a soft non-security speed-bump. That was tried here too and removed per explicit feedback — don't reintroduce `PinGate.vue`. The gear icon appears on both `ProfileSelect.vue` (settings must be reachable before any profile exists/is picked) and `Home.vue`, both emitting the same `settings` event straight to `Settings.vue`. Since Settings has two possible entry points, its `@back` doesn't unconditionally go to `'home'` — `App.vue`'s `backFromSettings()` checks `activeUser` and returns to `'profiles'` when there isn't one.
- **Answer buttons are part-of-speech categories, not a 3×3 number grid.** The set of buttons is derived once per game from Settings (`answerOptions()` in `wordGen.js`) and stays fixed for the whole game — button labels never move mid-game, only their correct/incorrect highlight state changes. Grid is 2 or 3 columns depending on how many categories are active (2–11).
- **No catch-all category.** `buildPool()` in `wordGen.js` only includes words whose tag is an active category — a word tagged with a category the player hasn't enabled is simply omitted from the round pool. Don't reintroduce an "Other" bucket; it was tried and explicitly rejected (muddied what the correct answer meant).
- **Settings enforces a minimum of 2 active categories**, by refusing the toggle rather than clamping after the fact — see the `toggle()` guard in `Settings.vue`.
- **`words.js` is deliberately purged of cross-POS-ambiguous words** (see the ambiguity-policy comment at the top of that file) — noun/verb/adjective lean on structurally one-directional word families (`-en`/`-ify`/`-ize` verbs, `-ous`/`-ful`/`-ible`/`-ive` adjectives, `-tion`/`-ness`/`-ity`/`-ment` nouns), which skew long, plus a separate **short-word pass per category** (labeled inline in `words.js`) for `maxWordLength` to have something to work with at low values. Short nouns lean on animals/food/objects/nature (hen, pie, mat, sky); short adjectives lean on the `-y` suffix family (sunny, rocky, chewy), which turns out to be just as reliably adjective-only as `-ous`/`-ful`. **Short verbs are the hard case** — English monosyllables are overwhelmingly noun/verb dual-use (run, watch, book, light, clean, fast, win, pay, hug, tip...), so the short-verb list stayed deliberately small (add, sit, owe, fry, wilt, ...) after rejecting a much larger batch, including a whole family of animal/sound verbs (bark, hiss, howl, chirp...) that looked safe but all turned out to have an equally common sound-effect *noun* reading ("the howl of the wind"). Don't casually add "simple" words back in without checking they aren't secretly a noun-or-verb-or-adjective in disguise. `gerund`/`participle` are the one deliberate exception — left unfiltered because the ambiguity is structural (every gerund is spelled like a present participle) and can't be word-choiced away.
- Word/category picks have no positional randomization (buttons keyed by category, not by round) since the category set doesn't change round-to-round — unlike × Blitz's number grid, which re-randomizes position every round.
- **Round duration is configurable** (`settings.roundSeconds`, default 10, range 3–30 via a slider in `Settings.vue`), unlike × Blitz's fixed 10s. `Game.vue` derives `ROUND_MS`/`HALF_LIFE_MS`/`AUTO_MISS_ELAPSED_MS` from `props.roundSeconds` at setup (fixed ratios: half-life = 30% of duration, auto-miss = 150% of duration) so the decay curve keeps the same shape at any speed — don't hardcode `10000` back in if touching the timer.
- **Word length is also configurable** (`settings.maxWordLength`, default 12 = the longest word in the data set = effectively no limit, range 3–12 via a second slider in `Settings.vue`). `buildPool()` in `wordGen.js` filters to `word.length <= maxWordLength` within the active categories, but falls back to the unfiltered pool if that combination would leave nothing playable (e.g. a very low cap with only gerund/participle active) — don't remove that fallback, `nextWord()` doesn't handle an empty pool.
- Default active categories are **Noun/Verb/Adjective only** (no Adverb) — the simplest possible round, per explicit feedback.

## Commands
```bash
pnpm install
pnpm dev       # local dev server
pnpm build     # production build to dist/
pnpm preview   # preview the production build
```

## Deploy
Push to `main` → GitHub Actions builds with pnpm and deploys `dist/` to GitHub Pages (repo Pages source must be set to "GitHub Actions"). `vite.config.js` `base` is hardcoded to `/word-spotter/` — update it if the repo is ever renamed.
