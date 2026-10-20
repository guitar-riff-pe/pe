import { create } from 'zustand'

interface CounterState {
  count: number
  increment: () => void
}

// Client UI state only. Do not put request-specific SSR data in this singleton.
export const useCounterStore = create<CounterState>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}))
