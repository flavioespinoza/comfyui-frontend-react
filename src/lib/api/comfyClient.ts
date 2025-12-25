// ComfyUI API wrapper (HTTP + WebSocket)

import type { QueueItem, QueueProgress } from '@/types/queue'

export interface ComfyClientConfig {
  baseUrl: string
  clientId?: string
}

export interface ComfyClientEvents {
  onProgress?: (progress: QueueProgress) => void
  onExecuting?: (nodeId: string | null) => void
  onExecuted?: (nodeId: string, output: unknown) => void
  onExecutionStart?: (promptId: string) => void
  onExecutionComplete?: (promptId: string) => void
  onExecutionError?: (promptId: string, error: string) => void
  onStatus?: (status: { exec_info: { queue_remaining: number } }) => void
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
      case 'executing':
        this.events.onExecuting?.((message.data as { node: string | null }).node)
        break
      case 'executed':
        const execData = message.data as { node: string; output: unknown }
        this.events.onExecuted?.(execData.node, execData.output)
        break
      case 'execution_start':
        this.events.onExecutionStart?.((message.data as { prompt_id: string }).prompt_id)
        break
      case 'execution_complete':
        this.events.onExecutionComplete?.((message.data as { prompt_id: string }).prompt_id)
        break
      case 'execution_error':
        const errData = message.data as { prompt_id: string; exception_message: string }
        this.events.onExecutionError?.(errData.prompt_id, errData.exception_message)
        break
      case 'status':
        this.events.onStatus?.(message.data as { exec_info: { queue_remaining: number } })
        break
    }
  }

  // HTTP API methods
  async getSystemStats(): Promise<unknown> {
    const response = await fetch(`${this.baseUrl}/system_stats`)
    return response.json()
  }

  async getObjectInfo(): Promise<Record<string, unknown>> {
    const response = await fetch(`${this.baseUrl}/object_info`)
    return response.json()
  }

  async getQueue(): Promise<{ queue_running: unknown[]; queue_pending: unknown[] }> {
    const response = await fetch(`${this.baseUrl}/queue`)
    return response.json()
  }

  async getHistory(maxItems = 200): Promise<Record<string, unknown>> {
    const response = await fetch(`${this.baseUrl}/history?max_items=${maxItems}`)
    return response.json()
  }

  async queuePrompt(workflow: Record<string, unknown>, extraData?: Record<string, unknown>): Promise<{ prompt_id: string }> {
    const response = await fetch(`${this.baseUrl}/prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: workflow,
        client_id: this.clientId,
        extra_data: extraData,
      }),
    })
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

  async getEmbeddings(): Promise<string[]> {
    const response = await fetch(`${this.baseUrl}/embeddings`)
    return response.json()
  }

  async uploadImage(file: File, subfolder = '', overwrite = false): Promise<{ name: string; subfolder: string; type: string }> {
    const formData = new FormData()
    formData.append('image', file)
    formData.append('subfolder', subfolder)
    formData.append('overwrite', String(overwrite))

    const response = await fetch(`${this.baseUrl}/upload/image`, {
      method: 'POST',
      body: formData,
    })
    return response.json()
  }

  async viewImage(filename: string, subfolder = '', type = 'output'): Promise<Blob> {
    const params = new URLSearchParams({ filename, subfolder, type })
    const response = await fetch(`${this.baseUrl}/view?${params}`)
    return response.blob()
  }

  getImageUrl(filename: string, subfolder = '', type = 'output'): string {
    const params = new URLSearchParams({ filename, subfolder, type })
    return `${this.baseUrl}/view?${params}`
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
