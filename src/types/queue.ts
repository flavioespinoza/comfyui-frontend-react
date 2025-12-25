// Queue item types

export type QueueItemStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'

export interface QueueItem {
  id: string
  prompt: PromptData
  status: QueueItemStatus
  createdAt: Date
  startedAt?: Date
  completedAt?: Date
  error?: string
  outputs?: QueueOutput[]
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
  node: string
  value: number
  max?: number
}

export interface QueueStats {
  pending: number
  running: number
  completed: number
  failed: number
}
