'use client'

// API connection and WebSocket hook

import { useEffect, useCallback, useRef, useState } from 'react'
import { getComfyClient, type ComfyClientEvents } from '@/lib/api'
import { useQueueStore } from '@/stores'
import type { QueueProgress } from '@/types/queue'

interface UseComfyAPIOptions {
  baseUrl?: string
  autoConnect?: boolean
}

interface UseComfyAPIReturn {
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  connect: () => void
  disconnect: () => void
  queuePrompt: (workflow: Record<string, unknown>) => Promise<string | null>
  interrupt: () => Promise<void>
  clearQueue: () => Promise<void>
  getObjectInfo: () => Promise<Record<string, unknown>>
}

export function useComfyAPI(options: UseComfyAPIOptions = {}): UseComfyAPIReturn {
  const { baseUrl = 'http://127.0.0.1:8188', autoConnect = true } = options

  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clientRef = useRef(getComfyClient({ baseUrl }))
  const { setProgress, setRunning, completeRunning } = useQueueStore()

  const handleProgress = useCallback(
    (progress: QueueProgress) => {
      setProgress(progress)
    },
    [setProgress]
  )

  const handleExecutionComplete = useCallback(
    (promptId: string) => {
      completeRunning()
    },
    [completeRunning]
  )

  const handleExecutionError = useCallback(
    (promptId: string, errorMessage: string) => {
      completeRunning(undefined, errorMessage)
    },
    [completeRunning]
  )

  const handleConnected = useCallback(() => {
    setIsConnected(true)
    setIsConnecting(false)
    setError(null)
  }, [])

  const handleDisconnected = useCallback(() => {
    setIsConnected(false)
  }, [])

  const connect = useCallback(() => {
    setIsConnecting(true)
    setError(null)

    const events: ComfyClientEvents = {
      onProgress: handleProgress,
      onExecutionComplete: handleExecutionComplete,
      onExecutionError: handleExecutionError,
      onConnected: handleConnected,
      onDisconnected: handleDisconnected,
    }

    clientRef.current.connect(events)
  }, [handleProgress, handleExecutionComplete, handleExecutionError, handleConnected, handleDisconnected])

  const disconnect = useCallback(() => {
    clientRef.current.disconnect()
    setIsConnected(false)
  }, [])

  const queuePrompt = useCallback(
    async (workflow: Record<string, unknown>): Promise<string | null> => {
      try {
        const result = await clientRef.current.queuePrompt(workflow)
        return result.prompt_id
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to queue prompt')
        return null
      }
    },
    []
  )

  const interrupt = useCallback(async () => {
    try {
      await clientRef.current.interrupt()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to interrupt')
    }
  }, [])

  const clearQueue = useCallback(async () => {
    try {
      await clientRef.current.clearQueue()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear queue')
    }
  }, [])

  const getObjectInfo = useCallback(async () => {
    try {
      return await clientRef.current.getObjectInfo()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get object info')
      return {}
    }
  }, [])

  useEffect(() => {
    if (autoConnect) {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [autoConnect, connect, disconnect])

  return {
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    queuePrompt,
    interrupt,
    clearQueue,
    getObjectInfo,
  }
}
