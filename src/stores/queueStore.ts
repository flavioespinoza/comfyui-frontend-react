import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { QueueItem, QueueProgress } from '@/types/queue'

interface QueueState {
  pending: QueueItem[]
  running: QueueItem | null
  history: QueueItem[]
  progress: QueueProgress | null

  // Actions
  addToQueue: (item: QueueItem) => void
  removeFromQueue: (id: string) => void
  setRunning: (item: QueueItem | null) => void
  completeRunning: (outputs?: QueueItem['outputs'], error?: string) => void
  setProgress: (progress: QueueProgress | null) => void
  clearHistory: () => void
  clearPending: () => void
}

const MAX_HISTORY = 100

export const useQueueStore = create<QueueState>()(
  immer((set) => ({
    pending: [],
    running: null,
    history: [],
    progress: null,

    addToQueue: (item) => {
      set((state) => {
        state.pending.push(item)
      })
    },

    removeFromQueue: (id) => {
      set((state) => {
        const index = state.pending.findIndex((item) => item.id === id)
        if (index !== -1) {
          state.pending.splice(index, 1)
        }
      })
    },

    setRunning: (item) => {
      set((state) => {
        if (item) {
          // Remove from pending if present
          const index = state.pending.findIndex((p) => p.id === item.id)
          if (index !== -1) {
            state.pending.splice(index, 1)
          }
          state.running = { ...item, status: 'running', startedAt: new Date() }
        } else {
          state.running = null
        }
        state.progress = null
      })
    },

    completeRunning: (outputs, error) => {
      set((state) => {
        if (state.running) {
          const completedItem: QueueItem = {
            ...state.running,
            status: error ? 'failed' : 'completed',
            completedAt: new Date(),
            outputs,
            error,
          }
          state.history.unshift(completedItem)
          if (state.history.length > MAX_HISTORY) {
            state.history.pop()
          }
          state.running = null
          state.progress = null
        }
      })
    },

    setProgress: (progress) => {
      set((state) => {
        state.progress = progress
      })
    },

    clearHistory: () => {
      set((state) => {
        state.history = []
      })
    },

    clearPending: () => {
      set((state) => {
        state.pending = []
      })
    },
  }))
)
