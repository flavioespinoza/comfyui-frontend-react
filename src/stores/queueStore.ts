// src/stores/queueStore.ts
// Date: December 25, 2025
// Version: v1

import { create } from 'zustand'
import { nanoid } from 'nanoid'
import type { QueueItem, QueueProgress } from '@/types/queue'

interface QueueState {
	pending: QueueItem[]
	running: QueueItem | null
	history: QueueItem[]
	progress: QueueProgress | null

	// Actions
	addToQueue: (promptId: string, workflow: unknown) => string
	removeFromQueue: (id: string) => void
	startNext: () => QueueItem | null
	completeRunning: (outputs?: Record<string, unknown>) => void
	failRunning: (error: string) => void
	setProgress: (progress: QueueProgress | null) => void
	clearHistory: () => void
	clearPending: () => void
}

const MAX_HISTORY = 50

export const useQueueStore = create<QueueState>((set, get) => ({
	pending: [],
	running: null,
	history: [],
	progress: null,

	addToQueue: (promptId, workflow) => {
		const id = nanoid()
		const item: QueueItem = {
			id,
			promptId,
			workflow,
			status: 'pending',
			createdAt: new Date()
		}

		set((state) => ({
			pending: [...state.pending, item]
		}))

		return id
	},

	removeFromQueue: (id) => {
		set((state) => ({
			pending: state.pending.filter((item) => item.id !== id)
		}))
	},

	startNext: () => {
		const { pending, running } = get()
		if (running || pending.length === 0) return null

		const [next, ...rest] = pending
		const runningItem: QueueItem = {
			...next,
			status: 'running',
			startedAt: new Date()
		}

		set({
			pending: rest,
			running: runningItem,
			progress: null
		})

		return runningItem
	},

	completeRunning: (outputs) => {
		const { running, history } = get()
		if (!running) return

		const completedItem: QueueItem = {
			...running,
			status: 'completed',
			completedAt: new Date(),
			outputs
		}

		set({
			running: null,
			progress: null,
			history: [completedItem, ...history].slice(0, MAX_HISTORY)
		})
	},

	failRunning: (error) => {
		const { running, history } = get()
		if (!running) return

		const failedItem: QueueItem = {
			...running,
			status: 'failed',
			completedAt: new Date(),
			error
		}

		set({
			running: null,
			progress: null,
			history: [failedItem, ...history].slice(0, MAX_HISTORY)
		})
	},

	setProgress: (progress) => {
		set({ progress })
	},

	clearHistory: () => {
		set({ history: [] })
	},

	clearPending: () => {
		set({ pending: [] })
	}
}))
