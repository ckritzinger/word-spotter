<script setup>
import { reactive, watch } from 'vue'
import { CATEGORY_ORDER, CATEGORY_LABELS } from '../lib/wordGen.js'

const props = defineProps({
  settings: { type: Object, required: true },
})
const emit = defineEmits(['back', 'update-settings'])

const MAX_WORD_LENGTH_CAP = 12 // longest word in the data set — this value means "no limit"

const local = reactive({
  categories: [...props.settings.categories],
  rounds: props.settings.rounds,
  roundSeconds: props.settings.roundSeconds,
  maxWordLength: props.settings.maxWordLength,
})

function isChecked(key) {
  return local.categories.includes(key)
}

// At least 2 categories must stay active — refuse to uncheck the last two.
function toggle(key) {
  const checked = isChecked(key)
  if (checked && local.categories.length <= 2) return

  if (checked) {
    local.categories = local.categories.filter((c) => c !== key)
  } else {
    local.categories.push(key)
  }
}

watch(
  local,
  (val) => {
    const rounds = Math.max(5, Math.min(Number(val.rounds) || 20, 100))
    const roundSeconds = Math.max(3, Math.min(Number(val.roundSeconds) || 10, 30))
    const maxWordLength = Math.max(3, Math.min(Number(val.maxWordLength) || MAX_WORD_LENGTH_CAP, MAX_WORD_LENGTH_CAP))
    emit('update-settings', { categories: [...val.categories], rounds, roundSeconds, maxWordLength })
  },
  { deep: true },
)
</script>

<template>
  <div class="flex min-h-screen flex-col items-center bg-slate-50 px-4 py-10">
    <button
      @click="emit('back')"
      class="self-start rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-500 shadow-sm hover:bg-slate-100"
    >
      ← Back
    </button>

    <h1 class="mt-4 text-2xl font-extrabold text-slate-800">Settings</h1>

    <div class="mt-6 w-full max-w-sm rounded-2xl bg-white p-6 shadow-sm">
      <label class="text-sm font-semibold text-slate-600">Parts of speech in play</label>
      <p class="mt-1 text-xs text-slate-400">
        Pick at least 2. Only words tagged with an active category are used — unpicked categories'
        words are skipped, not lumped together. Start simple, add more as it gets easier.
      </p>

      <div class="mt-3 grid grid-cols-2 gap-2">
        <button
          v-for="key in CATEGORY_ORDER"
          :key="key"
          @click="toggle(key)"
          class="rounded-lg px-3 py-2 text-left text-sm font-semibold transition"
          :class="isChecked(key) ? 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-300' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'"
        >
          {{ CATEGORY_LABELS[key] }}
        </button>
      </div>

      <div class="mt-6 flex items-center justify-between gap-3">
        <label class="text-sm font-semibold text-slate-600">Rounds per game</label>
        <input
          v-model.number="local.rounds"
          type="number"
          min="5"
          max="100"
          class="w-16 rounded-lg border border-slate-300 px-2 py-1 text-center"
        />
      </div>

      <div class="mt-6">
        <div class="flex items-center justify-between gap-3">
          <label class="text-sm font-semibold text-slate-600">Time per word</label>
          <span class="text-sm font-bold text-indigo-600">{{ local.roundSeconds }}s</span>
        </div>
        <p class="mt-1 text-xs text-slate-400">More time gives a younger kid room to read and decide.</p>
        <input
          v-model.number="local.roundSeconds"
          type="range"
          min="3"
          max="30"
          step="1"
          class="mt-2 w-full accent-indigo-500"
        />
      </div>

      <div class="mt-6">
        <div class="flex items-center justify-between gap-3">
          <label class="text-sm font-semibold text-slate-600">Longest word shown</label>
          <span class="text-sm font-bold text-indigo-600">
            {{ local.maxWordLength >= MAX_WORD_LENGTH_CAP ? 'No limit' : `${local.maxWordLength} letters` }}
          </span>
        </div>
        <p class="mt-1 text-xs text-slate-400">Cap word length for younger kids still learning to read.</p>
        <input
          v-model.number="local.maxWordLength"
          type="range"
          min="3"
          :max="MAX_WORD_LENGTH_CAP"
          step="1"
          class="mt-2 w-full accent-indigo-500"
        />
      </div>
    </div>
  </div>
</template>
