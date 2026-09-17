// Canonical display order for part-of-speech categories.
export const CATEGORY_ORDER = [
  'noun',
  'verb',
  'adjective',
  'adverb',
  'pronoun',
  'preposition',
  'conjunction',
  'interjection',
  'gerund',
  'participle',
]

export const CATEGORY_LABELS = {
  noun: 'Noun',
  verb: 'Verb',
  adjective: 'Adjective',
  adverb: 'Adverb',
  pronoun: 'Pronoun',
  preposition: 'Preposition',
  conjunction: 'Conjunction',
  interjection: 'Interjection',
  gerund: 'Gerund',
  participle: 'Participle',
}

/**
 * Ordered list of answer buttons for the active settings: the enabled
 * categories, in canonical order. Fixed for the whole game — categories
 * don't change mid-round.
 */
export function answerOptions(categories) {
  return CATEGORY_ORDER.filter((c) => categories.includes(c))
}

/**
 * Build the pool of playable words for the active settings: only words
 * whose tag is one of the enabled categories. Words tagged with a
 * category that isn't enabled are omitted entirely, not lumped together.
 */
export function buildPool(words, categories) {
  const set = new Set(categories)
  const pool = []
  for (const w of words) {
    if (set.has(w.pos)) {
      pool.push({ word: w.word, answer: w.pos })
    }
  }
  return pool
}

/**
 * Pick the next word from the pool. Mutates `usedWords` (a Set of word
 * strings). Once every word in the pool has been used, the pool resets
 * and repeats are allowed for the rest of the game.
 */
export function nextWord(pool, usedWords) {
  if (pool.length === 0) return null
  if (usedWords.size >= pool.length) {
    usedWords.clear()
  }

  for (let attempt = 0; attempt < 200; attempt++) {
    const item = pool[Math.floor(Math.random() * pool.length)]
    if (!usedWords.has(item.word)) {
      usedWords.add(item.word)
      return item
    }
  }
  for (const item of pool) {
    if (!usedWords.has(item.word)) {
      usedWords.add(item.word)
      return item
    }
  }
  usedWords.clear()
  const item = pool[Math.floor(Math.random() * pool.length)]
  usedWords.add(item.word)
  return item
}
