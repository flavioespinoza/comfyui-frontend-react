// ComfyUI API wrapper (HTTP + WebSocket)
// Date: December 25, 2025
// Version: v2

import type { QueueProgress } from '@/types/queue'

// ============================================
// Types
// ============================================

export interface ComfyClientConfig {
  baseUrl: string
  clientId?: string
}

export interface ImageInfo {
  filename: string
  subfolder: string
  type: 'output' | 'input' | 'temp'
}

export interface HistoryItem {
  prompt: unknown[]
  outputs: Record<string, { images?: ImageInfo[] }>
  status: {
    status_str: string
    completed: boolean
    messages: unknown[]
  }
}

export interface QueueResponse {
  prompt_id: string
  number: number
  node_errors: Record<string, unknown>
}

export interface SystemStats {
  system: {
    os: string
    python_version: string
    embedded_python: boolean
  }
  devices: Array<{
    name: string
    type: string
    index: number
    vram_total: number
    vram_free: number
    torch_vram_total: number
    torch_vram_free: number
  }>
}

export interface ComfyClientEvents {
  onProgress?: (progress: QueueProgress) => void
  onExecuting?: (nodeId: string | null, promptId: string) => void
  onExecuted?: (nodeId: string, output: unknown, promptId: string) => void
  onExecutionStart?: (promptId: string) => void
  onExecutionComplete?: (promptId: string) => void
  onExecutionError?: (promptId: string, error: string, nodeId?: string, nodeType?: string) => void
  onExecutionCached?: (nodeIds: string[], promptId: string) => void
  onExecutionInterrupted?: (promptId: string) => void
  onStatus?: (status: { exec_info: { queue_remaining: number } }) => void
  onPreview?: (imageBlob: Blob) => void
  onConnected?: () => void
  onDisconnected?: () => void
}

export class ComfyClient {
  private baseUrl: string
  private clientId: string
  private ws: WebSocket | null = null
  private events: ComfyClientEvents = {}
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000

  constructor(config: ComfyClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '')
    this.clientId = config.clientId || crypto.randomUUID()
  }

  // WebSocket connection
  connect(events: ComfyClientEvents = {}): void {
    this.events = events
    this.initWebSocket()
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  private initWebSocket(): void {
    const wsUrl = this.baseUrl.replace(/^http/, 'ws') + `/ws?clientId=${this.clientId}`
    this.ws = new WebSocket(wsUrl)

    this.ws.onopen = () => {
      this.reconnectAttempts = 0
      this.events.onConnected?.()
    }

    this.ws.onclose = () => {
      this.events.onDisconnected?.()
      this.attemptReconnect()
    }

    this.ws.onerror = () => {
      // Error handling is done in onclose
    }

    this.ws.onmessage = (event) => {
      // Handle binary messages (preview images)
      if (event.data instanceof Blob) {
        this.events.onPreview?.(event.data)
        return
      }

      try {
        const message = JSON.parse(event.data)
        this.handleMessage(message)
      } catch {
        console.error('Failed to parse WebSocket message')
      }
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      setTimeout(() => this.initWebSocket(), this.reconnectDelay * this.reconnectAttempts)
    }
  }

  private handleMessage(message: { type: string; data: unknown }): void {
    switch (message.type) {
      case 'progress':
        this.events.onProgress?.(message.data as QueueProgress)
        break
      case 'executing': {
        const data = message.data as { node: string | null; prompt_id: string }
        this.events.onExecuting?.(data.node, data.prompt_id)
        break
      }
      case 'executed': {
        const data = message.data as { node: string; output: unknown; prompt_id: string }
        this.events.onExecuted?.(data.node, data.output, data.prompt_id)
        break
      }
      case 'execution_start':
        this.events.onExecutionStart?.((message.data as { prompt_id: string }).prompt_id)
        break
      case 'execution_success':
      case 'execution_complete':
        this.events.onExecutionComplete?.((message.data as { prompt_id: string }).prompt_id)
        break
      case 'execution_error': {
        const data = message.data as {
          prompt_id: string
          exception_message: string
          node_id?: string
          node_type?: string
        }
        this.events.onExecutionError?.(data.prompt_id, data.exception_message, data.node_id, data.node_type)
        break
      }
      case 'execution_cached': {
        const data = message.data as { nodes: string[]; prompt_id: string }
        this.events.onExecutionCached?.(data.nodes, data.prompt_id)
        break
      }
      case 'execution_interrupted':
        this.events.onExecutionInterrupted?.((message.data as { prompt_id: string }).prompt_id)
        break
      case 'status':
        this.events.onStatus?.(message.data as { exec_info: { queue_remaining: number } })
        break
    }
  }

  // ============================================
  // HTTP API Methods
  // ============================================

  async getSystemStats(): Promise<SystemStats> {
    const response = await fetch(`${this.baseUrl}/system_stats`)
    if (!response.ok) {
      throw new Error(`Failed to get system stats: ${response.statusText}`)
    }
    return response.json()
  }

  async getObjectInfo(): Promise<Record<string, unknown>> {
    const response = await fetch(`${this.baseUrl}/object_info`)
    if (!response.ok) {
      throw new Error(`Failed to get object info: ${response.statusText}`)
    }
    return response.json()
  }

  async getQueue(): Promise<{ queue_running: unknown[]; queue_pending: unknown[] }> {
    const response = await fetch(`${this.baseUrl}/queue`)
    if (!response.ok) {
      throw new Error(`Failed to get queue: ${response.statusText}`)
    }
    return response.json()
  }

  async getHistory(promptId?: string): Promise<Record<string, HistoryItem>> {
    const url = promptId
      ? `${this.baseUrl}/history/${promptId}`
      : `${this.baseUrl}/history`
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to get history: ${response.statusText}`)
    }
    return response.json()
  }

  async clearHistory(promptIds?: string[]): Promise<void> {
    await fetch(`${this.baseUrl}/history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(promptIds ? { delete: promptIds } : { clear: true }),
    })
  }

  async queuePrompt(workflow: Record<string, unknown>, extraData?: Record<string, unknown>): Promise<QueueResponse> {
    const response = await fetch(`${this.baseUrl}/prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: workflow,
        client_id: this.clientId,
        extra_data: extraData,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Failed to queue prompt')
    }

    return response.json()
  }

  async deleteFromQueue(deleteIds: string[]): Promise<void> {
    await fetch(`${this.baseUrl}/queue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ delete: deleteIds }),
    })
  }

  async clearQueue(): Promise<void> {
    await fetch(`${this.baseUrl}/queue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clear: true }),
    })
  }

  async interrupt(): Promise<void> {
    await fetch(`${this.baseUrl}/interrupt`, { method: 'POST' })
  }

  async freeMemory(unloadModels = true, freeMemory = true): Promise<void> {
    await fetch(`${this.baseUrl}/free`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        unload_models: unloadModels,
        free_memory: freeMemory,
      }),
    })
  }

  async getEmbeddings(): Promise<string[]> {
    const response = await fetch(`${this.baseUrl}/embeddings`)
    if (!response.ok) {
      throw new Error(`Failed to get embeddings: ${response.statusText}`)
    }
    return response.json()
  }

  async getExtensions(): Promise<string[]> {
    const response = await fetch(`${this.baseUrl}/extensions`)
    if (!response.ok) {
      throw new Error(`Failed to get extensions: ${response.statusText}`)
    }
    return response.json()
  }

  // ============================================
  // Image Methods
  // ============================================

  async uploadImage(file: File, subfolder = '', overwrite = false): Promise<ImageInfo> {
    const formData = new FormData()
    formData.append('image', file)
    formData.append('type', 'input')
    formData.append('subfolder', subfolder)
    formData.append('overwrite', String(overwrite))

    const response = await fetch(`${this.baseUrl}/upload/image`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`Failed to upload image: ${response.statusText}`)
    }

    return response.json()
  }

  async uploadMask(file: File, originalRef: ImageInfo): Promise<ImageInfo> {
    const formData = new FormData()
    formData.append('image', file)
    formData.append('type', 'input')
    formData.append('subfolder', 'masks')
    formData.append('original_ref', JSON.stringify(originalRef))

    const response = await fetch(`${this.baseUrl}/upload/mask`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`Failed to upload mask: ${response.statusText}`)
    }

    return response.json()
  }

  async viewImage(filename: string, subfolder = '', type: 'output' | 'input' | 'temp' = 'output'): Promise<Blob> {
    const params = new URLSearchParams({ filename, subfolder, type })
    const response = await fetch(`${this.baseUrl}/view?${params}`)
    if (!response.ok) {
      throw new Error(`Failed to view image: ${response.statusText}`)
    }
    return response.blob()
  }

  getImageUrl(filename: string, subfolder = '', type: 'output' | 'input' | 'temp' = 'output'): string {
    const params = new URLSearchParams({ filename, subfolder, type })
    return `${this.baseUrl}/view?${params}`
  }

  // ============================================
  // Utility Methods
  // ============================================

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }

  get id(): string {
    return this.clientId
  }
}

// Singleton instance
let clientInstance: ComfyClient | null = null

export function getComfyClient(config?: ComfyClientConfig): ComfyClient {
  if (!clientInstance) {
    clientInstance = new ComfyClient(config || { baseUrl: 'http://127.0.0.1:8188' })
  }
  return clientInstance
}

export function resetComfyClient(): void {
  if (clientInstance) {
    clientInstance.disconnect()
    clientInstance = null
  }
}
