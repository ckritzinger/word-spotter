# Word Spotter — Game Spec

## Concept
A single-page web app that drills part-of-speech identification through
fast, arcade-style rounds. Each round shows a single word and a set of
part-of-speech answer buttons (Noun, Verb, Adjective by default, plus any
advanced categories enabled in Settings). The player taps the correct
category before a countdown bar runs out. Speed and accuracy both matter —
score is the time remaining (in ms) at the moment of a correct answer,
same mechanic as × Blitz.

## Core Loop
1. A round begins: a word displayed prominently at the top of the screen.
2. A countdown bar starts, visually depleting.
3. A grid of answer buttons appears below, one per active part-of-speech
   category (default: Noun, Verb, Adjective), laid out 2–3 columns
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
`participle`. Current counts: **noun 181, verb 128, adjective 170**,
adverb 21, pronoun 11, preposition 5, conjunction 6, interjection 15,
gerund 20, participle 20 (577 words total, all globally unique, longest
word 12 letters).

**Ambiguity policy:** a word is excluded if it has a second, comparably
common everyday reading as a *different part of speech* — e.g. "fly"
(insect noun vs. to fly), "watch" (wristwatch noun vs. to watch), "clean"
(tidy adjective vs. to clean), "well" (adverb vs. noun vs. interjection).
A different *meaning* of the same part of speech (e.g. "bank" —
riverbank vs. financial bank, both nouns) is not ambiguous for this game
and is fine to include — the game only ever asks for the category, never
the meaning.

noun/verb/adjective were deliberately built from word families that are
structurally one-directional in English and essentially never cross into
another part of speech in ordinary usage: `-en`/`-ify`/`-ize` verbs
(strengthen, clarify, organize), `-ous`/`-ful`/`-ible`/`-ive` adjectives
(dangerous, beautiful, comfortable, creative), `-tion`/`-ness`/`-ity`/
`-ment` nouns (education, happiness, curiosity, government), plus animal
names, foods, and household objects that rarely if ever verb. That bias
skews long, though, which is a problem for younger readers — so each of
the three core categories also got a **short-word pass (mostly 3-4
letters)**, individually vetted the same way: safe short animal/food/
object/nature nouns (hen, pie, mat, sky), a modest set of short verbs
that survived scrutiny (add, sit, owe, fry, wilt — English monosyllables
are *overwhelmingly* noun/verb dual-use, so this list stayed short on
purpose; see `words.js` for the ones that got rejected and why), and the
`-y` adjective family (sunny, rocky, chewy, spooky), which turns out to
be as reliably adjective-only as `-ous`/`-ful` are. The smaller
categories (adverb through participle) were reviewed and pruned the same
way but not padded back up — some are quite thin as a result (5
prepositions, 6 conjunctions), which is fine for now.

**Known exception, left alone on purpose:** `gerund` and `participle`
are not run through the ambiguity filter. By definition every -ing
gerund (e.g. "swimming") is spelled identically to a present participle,
and every -ed/-en participle (e.g. "broken") is spelled identically to a
past-tense verb form — that ambiguity is structural to English and can't
be engineered away by word choice when a word is shown with no
surrounding sentence. Each is assigned a single canonical tag
representing its most common/teachable use (gerund = -ing words most
commonly used as nouns; participle = -ed/-en words most commonly used as
adjectives). This is a fast classification drill, not a formal parser —
good enough for the "spot the part of speech" genre, not intended to be
linguistically airtight in every edge case.

## Settings — Active Categories
The core mechanic the user asked for: **which parts of speech appear as
answer choices is configurable**, so difficulty can ramp from "just noun
vs. verb" up to the full set.

- Settings screen shows all 10 categories as toggle buttons. At least 2
  must stay active (the UI refuses to uncheck the last two).
- Default active set: **Noun, Verb, Adjective** — the simplest possible
  round; Adverb and the rest are opt-in from there.
- **No catch-all.** Only words whose tag is currently an active category
  are drawn into the round pool — words tagged with an inactive category
  are simply omitted, not lumped into a shared "other" bucket. (An
  earlier version had an "Other" catch-all button; removed per explicit
  feedback — it muddied what the correct answer actually meant.)
- Categories are fixed for the whole game (chosen once from Settings,
  not per-round) — the button labels never move mid-game.
- Rounds per game: configurable, default 20 (same range/clamp as
  × Blitz: 5–100).
- **Time per word: configurable, default 10s, range 3–30s.** This is the
  one addition over × Blitz's timer — × Blitz's 10s countdown is fixed,
  but a bare word with no context is a different (often harder, for a
  young reader) task than picking a product from a 3×3 grid, so the
  duration is a slider in Settings labelled "More time gives a younger
  kid room to read and decide."
- **Longest word shown: configurable, default no limit, range 3–12
  letters.** A second slider in Settings, independent of time-per-word —
  a young reader may need both more time *and* a cap on how long a word
  can be. Filters `words.js` to `word.length <= maxWordLength` within the
  active categories (`buildPool()` in `wordGen.js`); if that combination
  would leave nothing to play (e.g. a very low cap with only
  gerund/participle active, which have no short entries), the length cap
  is dropped rather than leaving the round pool empty.

## Timer / Scoring
Same mechanic as × Blitz, with the duration itself configurable:
- Countdown bar starts at the configured **time per word** (default 10s),
  decays **asymptotically** (exponential half-life = 30% of the total
  duration) rather than linearly — so the curve keeps the same
  fast-then-slowing shape at any duration, only the pace scales.
- Score on a correct tap = remaining time in ms × current streak
  multiplier.
- Hard auto-miss floor: remaining < 50ms or 150% of the configured round
  duration has elapsed, whichever comes first — round resolves as a miss
  and advances.
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
Open — the gear icon on the home screen goes straight to Settings, no
PIN gate. (× Blitz gates its Settings behind a PIN as a soft speed-bump;
that was tried here too and removed per explicit feedback.)

## Explicitly Out of Scope / Undecided
- Full grammatical parsing / sentence context (words are shown in
  isolation, per the "genre" this is cloned from)
- Sound effects/music
- Difficulty progression *within* a single game
- Persistence of scores across devices / accounts
