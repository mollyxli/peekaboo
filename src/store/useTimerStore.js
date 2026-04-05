import { create } from 'zustand'

const useTimerStore = create((set, get) => ({
  countdown: 20 * 60,
  snoozeCount: 0,
  isPaused: false,

  setCountdown: (seconds) => set({ countdown: seconds }),
  setSnoozeCount: (count) => set({ snoozeCount: count }),
  setIsPaused: (isPaused) => set({ isPaused }),

  formatTime() {
    const { countdown } = get()
    const m = Math.floor(countdown / 60)
    const s = countdown % 60
    return `${m}:${String(s).padStart(2, '0')}`
  },
}))

export default useTimerStore
