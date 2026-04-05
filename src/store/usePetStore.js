import { create } from 'zustand'

const usePetStore = create((set) => ({
  mood: 'sleeping',
  petName: 'Pixel',
  streak: 0,
  isHovered: false,
  idleBehavior: 'sleeping',

  setMood: (mood) => set({ mood }),
  setPetName: (name) => set({ petName: name }),
  setStreak: (streak) => set({ streak }),
  setIsHovered: (isHovered) => set({ isHovered }),
  setIdleBehavior: (idleBehavior) => set({ idleBehavior }),
}))

export default usePetStore
