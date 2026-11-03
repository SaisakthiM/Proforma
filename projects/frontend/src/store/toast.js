import { create } from 'zustand'

let nextId = 1

export const useToast = create((set) => ({
  messages: [],
  push: (message, tone = 'default') => {
    const id = nextId++
    set((state) => ({ messages: [...state.messages, { id, message, tone }] }))
    setTimeout(() => {
      set((state) => ({ messages: state.messages.filter((item) => item.id !== id) }))
    }, 3800)
  },
  dismiss: (id) =>
    set((state) => ({ messages: state.messages.filter((item) => item.id !== id) }))
}))