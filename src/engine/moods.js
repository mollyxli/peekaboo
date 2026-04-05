/**
 * Mood state definitions.
 * Each mood maps to a placeholder color (used until real assets exist),
 * a Tailwind animation class, and optional speech copy.
 */
export const MOODS = {
  sleeping: {
    id: 'sleeping',
    label: 'sleeping',
    bgColor: 'bg-indigo-900',
    animation: 'animate-pulse-soft',
    eyeState: 'closed',
    message: null,
  },
  stretching: {
    id: 'stretching',
    label: 'stretching',
    bgColor: 'bg-indigo-600',
    animation: '',
    eyeState: 'half',
    message: null,
  },
  looking: {
    id: 'looking',
    label: 'looking around',
    bgColor: 'bg-indigo-700',
    animation: '',
    eyeState: 'open',
    message: null,
  },
  yawning: {
    id: 'yawning',
    label: 'yawning',
    bgColor: 'bg-indigo-800',
    animation: '',
    eyeState: 'squint',
    message: null,
  },
  pawing: {
    id: 'pawing',
    label: 'pawing',
    bgColor: 'bg-indigo-500',
    animation: '',
    eyeState: 'open',
    message: null,
  },
  alert: {
    id: 'alert',
    label: 'alert',
    bgColor: 'bg-yellow-600',
    animation: 'animate-bob',
    eyeState: 'wide',
    message: 'Almost time…',
  },
  reminder: {
    id: 'reminder',
    label: 'reminder',
    bgColor: 'bg-purple-600',
    animation: 'animate-bob',
    eyeState: 'wide',
    message: 'Hey… your eyes need this.',
  },
  sad: {
    id: 'sad',
    label: 'disappointed',
    bgColor: 'bg-blue-600',
    animation: '',
    eyeState: 'droopy',
    message: 'Fine. Pixel will wait. (disappointed)',
  },
  angry: {
    id: 'angry',
    label: 'fuming',
    bgColor: 'bg-red-600',
    animation: 'animate-shake',
    eyeState: 'glare',
    message: 'THREE snoozes?! Pixel is devastated.',
  },
  happy: {
    id: 'happy',
    label: 'happy',
    bgColor: 'bg-green-600',
    animation: 'animate-bob',
    eyeState: 'happy',
    message: "See? That wasn't so hard.",
  },
}

/** Idle behaviors that cycle while the base mood is 'sleeping'. */
export const IDLE_BEHAVIORS = [
  { name: 'sleeping', weight: 70 },
  { name: 'stretching', weight: 10 },
  { name: 'looking', weight: 10 },
  { name: 'yawning', weight: 7 },
  { name: 'pawing', weight: 3 },
]

export function pickWeightedBehavior() {
  const total = IDLE_BEHAVIORS.reduce((s, b) => s + b.weight, 0)
  let r = Math.random() * total
  for (const b of IDLE_BEHAVIORS) {
    r -= b.weight
    if (r <= 0) return b.name
  }
  return 'sleeping'
}

export function getMoodForSnoozeCount(count) {
  if (count >= 3) return 'angry'
  if (count >= 1) return 'sad'
  return 'reminder'
}
