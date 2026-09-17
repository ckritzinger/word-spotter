<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import { words } from '../data/words.js'
import { answerOptions, buildPool, nextWord, CATEGORY_LABELS } from '../lib/wordGen.js'

const props = defineProps({
  categories: { type: Array, required: true },
  rounds: { type: Number, required: true },
})
const emit = defineEmits(['finish'])

const ROUND_MS = 10000
const HALF_LIFE_MS = 3000 // asymptotic decay rate
const AUTO_MISS_ELAPSED_MS = 15000 // hard wall-clock cap
const AUTO_MISS_REMAINING_MS = 50 // negligible-threshold floor

const MULTIPLIERS = [1, 1.5, 2, 2.5]

const STREAK_THEMES = [
  { bg: 'bg-amber-100', text: 'text-amber-700', ring: 'ring-amber-300' },
  { bg: 'bg-orange-100', text: 'text-orange-700', ring: 'ring-orange-300' },
  { bg: 'bg-rose-100', text: 'text-rose-700', ring: 'ring-rose-300' },
  { bg: 'bg-fuchsia-100', text: 'text-fuchsia-700', ring: 'ring-fuchsia-300' },
  { bg: 'bg-purple-100', text: 'text-purple-700', ring: 'ring-purple-300' },
  { bg: 'bg-indigo-100', text: 'text-indigo-700', ring: 'ring-indigo-300' },
  { bg: 'bg-sky-100', text: 'text-sky-700', ring: 'ring-sky-300' },
  { bg: 'bg-emerald-100', text: 'text-emerald-700', ring: 'ring-emerald-300' },
]

const CONFETTI_COLORS = ['#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#eab308', '#14b8a6']

// Buttons are fixed for the whole game — categories don't change mid-run.
const pool = buildPool(words, props.categories)
const buttons = answerOptions(props.categories).map((key) => ({ key, label: CATEGORY_LABELS[key] }))
const gridColsClass = buttons.length <= 4 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'

const usedWords = new Set()
const roundIndex = ref(0)
const totalScore = ref(0)
const streak = ref(0)

const currentWord = ref('')
const currentAnswer = ref('')
const remainingMs = ref(ROUND_MS)
const locked = ref(false) // true while a tap's feedback is resolving
const feedback = reactive({ key: null, correct: null }) // per-button feedback
const roundResult = ref(null) // 'correct' | 'incorrect' | null, drives screen flash
const lastGain = ref(0)
const showGain = ref(false)
const particles = ref([])
const confettiLaunched = ref(false)
const confettiOrigin = reactive({ x: 0, y: 0 })
const rootEl = ref(null)

let roundStartTime = 0
let rafId = null
let particleSeq = 0

const currentMultiplier = computed(() => MULTIPLIERS[Math.min(streak.value, MULTIPLIERS.length - 1)])
const barPercent = computed(() => Math.max(0, Math.min(100, (remainingMs.value / ROUND_MS) * 100)))
const barColor = computed(() => {
  const pct = barPercent.value
  if (pct > 50) return 'bg-emerald-400'
  if (pct > 20) return 'bg-amber-400'
  return 'bg-rose-500'
})
const streakTheme = computed(() => STREAK_THEMES[(Math.max(streak.value, 1) - 1) % STREAK_THEMES.length])

function burstConfetti(originEvent) {
  if (originEvent?.currentTarget && rootEl.value) {
    const btnRect = originEvent.currentTarget.getBoundingClientRect()
    const rootRect = rootEl.value.getBoundingClientRect()
    confettiOrigin.x = btnRect.left + btnRect.width / 2 - rootRect.left
    confettiOrigin.y = btnRect.top + btnRect.height / 2 - rootRect.top
  }

  const batch = ++particleSeq
  const count = 60
  const next = []
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2
    const distance = 160 + Math.random() * 260
    const size = 6 + Math.random() * 8
    next.push({
      id: `${batch}-${i}`,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size,
      tx: Math.cos(angle) * distance,
      ty: Math.sin(angle) * distance - 60,
      rot: Math.random() * 1080 - 540,
      delayMs: Math.round(Math.random() * 100),
    })
  }
  confettiLaunched.value = false
  particles.value = next

  // Paint the particles at their start position first, then flip to the
  // end position on the next frame so the CSS transition actually runs.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (particleSeq === batch) confettiLaunched.value = true
    })
  })

  setTimeout(() => {
    if (particleSeq === batch) particles.value = []
  }, 1000)
}

function startRound() {
  const item = nextWord(pool, usedWords)
  currentWord.value = item.word
  currentAnswer.value = item.answer
  remainingMs.value = ROUND_MS
  roundStartTime = performance.now()
  locked.value = false
  roundResult.value = null
  feedback.key = null
  feedback.correct = null
  tick()
}

function tick() {
  const elapsed = performance.now() - roundStartTime
  const remaining = ROUND_MS * Math.pow(0.5, elapsed / HALF_LIFE_MS)
  remainingMs.value = remaining

  if (locked.value) return

  if (remaining < AUTO_MISS_REMAINING_MS || elapsed > AUTO_MISS_ELAPSED_MS) {
    resolveRound(null, false)
    return
  }
  rafId = requestAnimationFrame(tick)
}

function handleTap(button, event) {
  if (locked.value) return
  event?.currentTarget?.blur()
  resolveRound(button, button.key === currentAnswer.value, event)
}

function resolveRound(tappedButton, isCorrect, event) {
  locked.value = true
  if (rafId) cancelAnimationFrame(rafId)

  feedback.key = tappedButton ? tappedButton.key : null
  feedback.correct = isCorrect

  if (isCorrect) {
    const gain = Math.round(remainingMs.value * currentMultiplier.value)
    totalScore.value += gain
    lastGain.value = gain
    streak.value += 1
    roundResult.value = 'correct'
    burstConfetti(event)
  } else {
    lastGain.value = 0
    streak.value = 0
    roundResult.value = 'incorrect'
  }

  showGain.value = true
  setTimeout(() => {
    showGain.value = false
  }, 700)

  setTimeout(() => {
    roundIndex.value += 1
    if (roundIndex.value >= props.rounds) {
      emit('finish', totalScore.value)
    } else {
      startRound()
    }
  }, 450)
}

onMounted(startRound)
onBeforeUnmount(() => {
  if (rafId) cancelAnimationFrame(rafId)
})
</script>

<template>
  <div
    ref="rootEl"
    class="relative flex min-h-[100dvh] flex-col items-center overflow-hidden px-4 pt-4 transition-colors duration-200"
    :class="roundResult === 'incorrect' ? 'bg-rose-50' : 'bg-slate-50'"
    style="padding-bottom: max(7rem, env(safe-area-inset-bottom) + 6rem)"
  >
    <!-- Confetti burst, emanates from the tapped button -->
    <div
      class="pointer-events-none absolute z-20"
      :style="{ left: confettiOrigin.x + 'px', top: confettiOrigin.y + 'px' }"
    >
      <span
        v-for="p in particles"
        :key="p.id"
        class="absolute left-0 top-0 rounded-sm"
        :style="{
          width: p.size + 'px',
          height: p.size + 'px',
          backgroundColor: p.color,
          opacity: confettiLaunched ? 0 : 1,
          transform: confettiLaunched
            ? `translate(${p.tx}px, ${p.ty}px) rotate(${p.rot}deg) scale(0.3)`
            : 'translate(0, 0) rotate(0deg) scale(1)',
          transition: `transform 0.9s cubic-bezier(0.15,0.8,0.25,1) ${p.delayMs}ms, opacity 0.9s ease-in ${p.delayMs}ms`,
        }"
      />
    </div>

    <!-- Top bar: progress + score + streak -->
    <div class="flex w-full max-w-sm items-center justify-between text-sm font-semibold text-slate-500">
      <span>Round {{ Math.min(roundIndex + 1, rounds) }} / {{ rounds }}</span>
      <span class="relative text-slate-700">
        Score: {{ totalScore }}
        <span
          v-if="showGain && lastGain > 0"
          class="pointer-events-none absolute -right-2 top-0 -translate-y-full text-emerald-500 animate-floatUp"
        >
          +{{ lastGain }}
        </span>
      </span>
    </div>

    <!-- Prompt -->
    <p class="mt-6 text-sm font-semibold uppercase tracking-wide text-slate-400">What part of speech is this?</p>
    <div class="mt-2 text-5xl font-extrabold tracking-tight text-slate-800 sm:text-6xl">
      {{ currentWord }}
    </div>

    <!-- Countdown bar -->
    <div class="mt-5 h-3 w-full max-w-sm overflow-hidden rounded-full bg-slate-200">
      <div
        class="h-full rounded-full transition-[width] duration-75 ease-linear"
        :class="barColor"
        :style="{ width: barPercent + '%' }"
      />
    </div>

    <!-- Answer grid -->
    <div class="mt-5 grid w-full max-w-md gap-2.5" :class="gridColsClass">
      <button
        v-for="btn in buttons"
        :key="btn.key"
        :disabled="locked"
        @click="handleTap(btn, $event)"
        class="rounded-2xl px-4 py-5 text-base font-bold shadow-sm transition-all duration-150 sm:text-lg"
        :class="[
          locked && feedback.key === btn.key && feedback.correct
            ? 'bg-emerald-400 text-white animate-pop'
            : locked && feedback.key === btn.key && !feedback.correct
              ? 'bg-rose-400 text-white animate-shake'
              : locked && btn.key === currentAnswer
                ? 'bg-emerald-200 text-emerald-800'
                : 'bg-white text-slate-800 hover:bg-indigo-50 active:scale-95',
        ]"
      >
        {{ btn.label }}
      </button>
    </div>

    <!-- Streak bar: fixed to the bottom so it never shifts the layout above -->
    <div
      v-if="streak > 0"
      :key="streak"
      class="fixed inset-x-0 bottom-0 z-30 flex justify-center px-4"
      style="padding-bottom: max(0.75rem, env(safe-area-inset-bottom) + 0.5rem)"
    >
      <div
        class="flex w-full max-w-md flex-col items-center gap-1 rounded-2xl px-5 py-2.5 shadow-lg ring-2 animate-streakPulse"
        :class="[streakTheme.bg, streakTheme.text, streakTheme.ring]"
      >
        <div class="text-lg font-extrabold sm:text-xl">{{ streak }} streak · {{ currentMultiplier }}x</div>
        <div class="flex w-full justify-center gap-0.5 overflow-hidden whitespace-nowrap text-xs leading-none">
          <span v-for="i in streak" :key="i">🔥</span>
        </div>
      </div>
    </div>
  </div>
</template>
