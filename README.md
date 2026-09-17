# Word Spotter

A fast, arcade-style part-of-speech drill game for the browser. Vue 3 + Tailwind, runs entirely client-side — no backend, no accounts, everything lives in `localStorage`. Sibling project to [× Blitz](../x-blitz) and [Wordie](../wordie) — same genre, framework, and player-profile/scoring mechanics, different round.

## How it plays

- Pick (or create) a local player profile.
- Each round shows a word and a grid of part-of-speech buttons (Noun, Verb, Adjective, Adverb by default).
- A countdown bar depletes asymptotically over ~10 seconds — answer fast for more points.
- Correct answers score the remaining time (in ms) at the moment you tap, multiplied by your current streak multiplier (1x → 1.5x → 2x → 2.5x, capped). A wrong answer resets the streak.
- No repeated words within a game until the pool is exhausted, then repeats are allowed.
- After the configured number of rounds, see your total score against your personal best, and check the leaderboard against other local profiles.

## Difficulty settings

Settings (PIN-gated, `1337`) let you pick which parts of speech are in play — start with just Noun/Verb/Adjective/Adverb, then add Pronoun, Preposition, Conjunction, Interjection, Gerund, and Participle as it gets easier. Only words tagged with an active category show up; the rest are skipped, no catch-all bucket. At least 2 categories must stay active.

## Tech

- **Vue 3** (`<script setup>`, Composition API) — no router, no state library; a single `screen` ref in `App.vue` drives which screen renders
- **Tailwind CSS** for styling
- **Vite** for dev/build
- **pnpm** for package management
- All persistence is `localStorage` — no server, no network calls

## Getting started

```bash
pnpm install
pnpm dev
```

Then open the printed local URL.

## Build

```bash
pnpm build      # outputs to dist/
pnpm preview    # serve the production build locally
```

## Deploy

Deploys automatically to GitHub Pages on push to `main` via `.github/workflows/deploy.yml`. In the repo settings, set **Pages → Source → GitHub Actions**. The Vite `base` path is set to `/word-spotter/` in `vite.config.js` to match the repo name — update it if the repo is renamed.

## Project structure

```
src/
  App.vue                 # screen state machine
  components/
    ProfileSelect.vue     # "who's playing" screen, profile create
    Home.vue               # per-player home, start game / leaderboard
    PinGate.vue             # PIN-gated entry to settings
    Settings.vue           # part-of-speech category toggles, rounds-per-game
    Game.vue               # core round loop, timer, scoring, streak, confetti
    Summary.vue            # end-of-game score vs. personal best
    Leaderboard.vue        # all local players sorted by best score
    WordRain.vue            # shared canvas background effect
  lib/
    storage.js             # localStorage read/write for users & settings
    wordGen.js              # category ordering + word-pool/pick logic
  data/
    words.js               # curated ~220-word list tagged by part of speech
```

## Spec

The original product spec this game was built against is in `word-spotter-game-spec.md`.
