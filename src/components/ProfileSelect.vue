<script setup>
import { ref } from 'vue'
import { AVATARS } from '../lib/storage.js'
import WordRain from './WordRain.vue'

defineProps({
  users: { type: Array, required: true },
})
const emit = defineEmits(['select', 'create', 'settings'])

const creating = ref(false)
const name = ref('')
const avatar = ref(AVATARS[0])

function startCreate() {
  creating.value = true
  name.value = ''
  avatar.value = AVATARS[Math.floor(Math.random() * AVATARS.length)]
}

function confirmCreate() {
  const trimmed = name.value.trim()
  if (!trimmed) return
  emit('create', { name: trimmed, avatar: avatar.value })
  creating.value = false
}
</script>

<template>
  <div class="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-950 px-4 py-10">
    <WordRain />

    <button
      @click="emit('settings')"
      aria-label="Settings"
      class="absolute right-4 top-4 z-10 rounded-full p-2 text-slate-500 transition hover:bg-white/10 hover:text-slate-200"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-5 w-5">
        <path
          fill-rule="evenodd"
          d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567l-.091.549a.798.798 0 0 1-.517.608 7.45 7.45 0 0 0-.478.198.798.798 0 0 1-.796-.064l-.453-.324a1.875 1.875 0 0 0-2.416.2l-.243.243a1.875 1.875 0 0 0-.2 2.416l.324.453a.798.798 0 0 1 .064.796 7.448 7.448 0 0 0-.198.478.798.798 0 0 1-.608.517l-.55.092a1.875 1.875 0 0 0-1.566 1.849v.344c0 .916.663 1.699 1.567 1.85l.549.091c.281.047.508.243.608.517.06.162.127.321.198.478a.798.798 0 0 1-.064.796l-.324.453a1.875 1.875 0 0 0 .2 2.416l.243.243c.648.648 1.67.733 2.416.2l.453-.324a.798.798 0 0 1 .796-.064c.157.071.316.137.478.198.274.1.47.327.517.608l.092.55c.15.903.932 1.566 1.849 1.566h.344c.916 0 1.699-.663 1.85-1.567l.091-.549a.798.798 0 0 1 .517-.608 7.52 7.52 0 0 0 .478-.198.798.798 0 0 1 .796.064l.453.324a1.875 1.875 0 0 0 2.416-.2l.243-.243c.648-.648.733-1.67.2-2.416l-.324-.453a.798.798 0 0 1-.064-.796c.071-.157.137-.316.198-.478.1-.274.327-.47.608-.517l.55-.091a1.875 1.875 0 0 0 1.566-1.85v-.344c0-.916-.663-1.699-1.567-1.85l-.549-.091a.798.798 0 0 1-.608-.517 7.507 7.507 0 0 0-.198-.478.798.798 0 0 1 .064-.796l.324-.453a1.875 1.875 0 0 0-.2-2.416l-.243-.243a1.875 1.875 0 0 0-2.416-.2l-.453.324a.798.798 0 0 1-.796.064 7.462 7.462 0 0 0-.478-.198.798.798 0 0 1-.517-.608l-.091-.55a1.875 1.875 0 0 0-1.85-1.566h-.344ZM12 15.75a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z"
          clip-rule="evenodd"
        />
      </svg>
    </button>

    <div class="relative z-10 flex w-full flex-col items-center">
      <h1 class="text-4xl font-extrabold tracking-tight text-white drop-shadow-[0_2px_12px_rgba(99,102,241,0.6)]">
        Word Spotter
      </h1>
      <p class="mt-1 text-slate-300">Who's playing?</p>

      <div v-if="!creating" class="mt-8 grid w-full max-w-md grid-cols-2 gap-4 sm:grid-cols-3">
        <button
          v-for="u in users"
          :key="u.id"
          @click="emit('select', u.id)"
          class="flex flex-col items-center gap-2 rounded-2xl bg-white/95 p-4 shadow-lg backdrop-blur transition hover:shadow-xl active:scale-95"
        >
          <span class="text-4xl">{{ u.avatar }}</span>
          <span class="truncate text-sm font-semibold text-slate-700">{{ u.name }}</span>
          <span class="text-xs text-slate-400">Best {{ u.bestScore }}</span>
        </button>

        <button
          @click="startCreate"
          class="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-500/60 bg-slate-950/40 p-4 text-slate-300 backdrop-blur transition hover:border-indigo-400 hover:text-indigo-300"
        >
          <span class="text-4xl">＋</span>
          <span class="text-sm font-semibold">Add player</span>
        </button>
      </div>

      <div v-else class="mt-8 w-full max-w-sm rounded-2xl bg-white/95 p-6 shadow-xl backdrop-blur">
        <label class="block text-sm font-semibold text-slate-600">Name</label>
        <input
          v-model="name"
          maxlength="20"
          placeholder="Enter name"
          class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-indigo-400 focus:outline-none"
          @keyup.enter="confirmCreate"
        />

        <label class="mt-4 block text-sm font-semibold text-slate-600">Avatar</label>
        <div class="mt-2 grid grid-cols-6 gap-2">
          <button
            v-for="a in AVATARS"
            :key="a"
            @click="avatar = a"
            class="flex h-10 items-center justify-center rounded-lg text-2xl transition"
            :class="avatar === a ? 'bg-indigo-100 ring-2 ring-indigo-400' : 'bg-slate-50 hover:bg-slate-100'"
          >
            {{ a }}
          </button>
        </div>

        <div class="mt-6 flex gap-3">
          <button
            @click="creating = false"
            class="flex-1 rounded-lg bg-slate-100 py-2 font-semibold text-slate-600 hover:bg-slate-200"
          >
            Cancel
          </button>
          <button
            @click="confirmCreate"
            :disabled="!name.trim()"
            class="flex-1 rounded-lg bg-indigo-500 py-2 font-semibold text-white hover:bg-indigo-600 disabled:opacity-40"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
