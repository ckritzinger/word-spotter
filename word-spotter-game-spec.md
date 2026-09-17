# Word Spotter — Game Spec

## Concept
A single-page web app that drills part-of-speech identification through
fast, arcade-style rounds. Each round shows a single word and a set of
part-of-speech answer buttons (Noun, Verb, Adjective, Adverb, Other, plus
any advanced categories enabled in Settings). The player taps the correct
category before a countdown bar runs out. Speed and accuracy both matter —
score is the time remaining (in ms) at the moment of a correct answer,
same mechanic as × Blitz.

## Core Loop
1. A round begins: a word displayed prominently at the top of the screen.
2. A countdown bar starts, visually depleting.
3. A grid of answer buttons appears below, one per active part-of-speech
   category (default: Noun, Verb, Adjective, Adverb), laid out 2–3 columns
   depending on how many are active.
4. Player taps a button:
   - **Correct** → score += remaining time (ms) at moment of tap × streak
     multiplier. Brief positive feedback animation (confetti burst).
   - **Incorrect** → score += 0, streak resets. Brief negative feedback
     animation (shake).
5. Next round loads immediately (no manual "continue" step).
6. After the configured number of rounds, show a final score / summary
   screen.

## Word Classification
Every word in the built-in list (`src/data/words.js`) is tagged with one
canonical part of speech: `noun`, `verb`, `adjective`, `adverb`,
`pronoun`, `preposition`, `conjunction`, `interjection`, `gerund`, or
`participle`.

**Assumption, confirmed acceptable for this game:** shown in isolation
(no surrounding sentence), some words are genuinely ambiguous — e.g.
"running" could be a bare verb, a gerund, or a participle depending on
context. Each word is assigned a single canonical tag representing its
most common/teachable use. This is a fast classification drill, not a
formal parser — good enough for the "spot the part of speech" genre, not
intended to be linguistically airtight in every edge case.

`gerund` and `participle` are the advanced/optional categories: -ing
words most commonly used as nouns (e.g. "swimming", "reading") vs. -ed/-en
words most commonly used as adjectives (e.g. "broken", "excited").

## Settings — Active Categories
The core mechanic the user asked for: **which parts of speech appear as
answer choices is configurable**, so difficulty can ramp from "just noun
vs. verb" up to the full set.

- Settings screen shows all 10 categories as toggle buttons. At least 2
  must stay active (the UI refuses to uncheck the last two).
- Default active set: **Noun, Verb, Adjective, Adverb** — matches the
  basic round described in the spec request.
- **No catch-all.** Only words whose tag is currently an active category
  are drawn into the round pool — words tagged with an inactive category
  are simply omitted, not lumped into a shared "other" bucket. (An
  earlier version had an "Other" catch-all button; removed per explicit
  feedback — it muddied what the correct answer actually meant.)
- Categories are fixed for the whole game (chosen once from Settings,
  not per-round) — the button labels never move mid-game.
- Rounds per game: configurable, default 20 (same range/clamp as
  × Blitz: 5–100).

## Timer / Scoring
Identical mechanic to × Blitz:
- Countdown bar starts at **10 seconds**, decays **asymptotically**
  (exponential half-life ~3s) rather than linearly.
- Score on a correct tap = remaining time in ms × current streak
  multiplier.
- Hard auto-miss floor: remaining < 50ms or 15s of real elapsed time,
  whichever comes first — round resolves as a miss and advances.
- **Streak multiplier**: 1x → 1.5x → 2x → 2.5x (capped), consecutive
  correct answers only. Any miss resets it. Streak bar fixed to viewport
  bottom, shown once streak > 0.
- Score accumulates across all rounds in the game.

## No-Repeat Words
Once a word has appeared in a round, it isn't drawn again until every
word in the active pool has been used, then the "used" set resets and
repeats are allowed for the rest of the game — same fallback pattern as
× Blitz's no-repeat pairs.

## User Profiles & Persistence
Same as × Blitz: local profiles (name + preset emoji avatar), stored in
`localStorage`, no backend. Per-user best score / last score. Settings
are global across profiles (not per-user). A leaderboard screen lists all
local profiles sorted by best score, live-updating.

## Visual / Feel
Same visual language as × Blitz: countdown bar urgency colour shift,
confetti bursts on correct taps, streak bar with fire emoji, personal
best framing on the summary screen, animated "letter rain" background
(here: random words from the list, not numbers) behind the profile-select
and home screens.

## Settings Access
Gated behind the same non-security PIN pattern as × Blitz (PIN `1337`,
`PinGate.vue`) — not real auth, just a soft speed-bump so a kid mid-game
doesn't wander into Settings by accident.

## Explicitly Out of Scope / Undecided
- Full grammatical parsing / sentence context (words are shown in
  isolation, per the "genre" this is cloned from)
- Sound effects/music
- Difficulty progression *within* a single game
- Persistence of scores across devices / accounts
