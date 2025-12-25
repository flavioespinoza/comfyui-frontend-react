// src/types/queue.ts
// Date: December 25, 2025
// Version: v1

export type QueueItemStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'

export interface QueueItem {
	id: string
	promptId: string
	workflow: unknown
	status: 'pending' | 'running' | 'completed' | 'failed'
	createdAt: Date
	startedAt?: Date
	completedAt?: Date
	error?: string
	outputs?: Record<string, unknown>
}

export interface PromptData {
	workflow: Record<string, unknown>
	clientId: string
	extraData?: Record<string, unknown>
}

export interface QueueOutput {
	nodeId: string
	type: 'image' | 'video' | 'audio' | 'text' | 'data'
	data: unknown
}

export interface QueueProgress {
	nodeId: string
	nodeLabel: string
	value: number
	max: number
}

export interface QueueStats {
	pending: number
	running: number
	completed: number
	failed: number
}

export interface QueueState {
	pending: QueueItem[]
	running: QueueItem | null
	history: QueueItem[]
	progress: QueueProgress | null

	addToQueue: (item: Omit<QueueItem, 'id' | 'createdAt' | 'status'>) => void
	removeFromQueue: (id: string) => void
	setRunning: (item: QueueItem | null) => void
	completeRunning: (outputs?: Record<string, unknown>) => void
	failRunning: (error: string) => void
	setProgress: (progress: QueueProgress | null) => void
	clearHistory: () => void
}
