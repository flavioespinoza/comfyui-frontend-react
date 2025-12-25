// src/hooks/useComfyAPI.ts
// Date: December 25, 2025
// Version: v2

'use client'

import { useCallback, useRef, useState, useEffect } from 'react'
import { useQueueStore } from '@/stores/queueStore'
import { useToast } from '@/components/ui/Toast'
import { graphToWorkflow } from '@/lib/utils/graphConverters'
import { useGraphStore } from '@/stores/graphStore'
import type { NodeDefinition } from '@/types/comfy'
import type { ImageInfo, SystemStats, HistoryItem } from '@/lib/api/comfyClient'

const API_BASE = process.env.NEXT_PUBLIC_COMFY_API_URL || 'http://localhost:8188'

interface UseComfyAPIReturn {
	// Connection state
	isConnected: boolean
	isConnecting: boolean
	nodeDefinitions: Record<string, NodeDefinition>
	previewImage: string | null

	// Connection methods
	connect: () => void
	disconnect: () => void

	// Workflow methods
	queuePrompt: () => Promise<string | null>
	interrupt: () => Promise<void>
	fetchNodeDefinitions: () => Promise<void>

	// Queue methods
	getQueue: () => Promise<{ queue_running: unknown[]; queue_pending: unknown[] }>
	clearQueue: () => Promise<void>

	// History methods
	getHistory: (promptId?: string) => Promise<Record<string, HistoryItem>>
	clearHistory: (promptIds?: string[]) => Promise<void>

	// Image methods
	uploadImage: (file: File, subfolder?: string, overwrite?: boolean) => Promise<ImageInfo>
	getImageUrl: (filename: string, subfolder?: string, type?: 'output' | 'input' | 'temp') => string

	// System methods
	getSystemStats: () => Promise<SystemStats>
	freeMemory: (unloadModels?: boolean, freeMemoryFlag?: boolean) => Promise<void>
	getExtensions: () => Promise<string[]>
	getEmbeddings: () => Promise<string[]>
}

export function useComfyAPI(): UseComfyAPIReturn {
	const [isConnected, setIsConnected] = useState(false)
	const [isConnecting, setIsConnecting] = useState(false)
	const [nodeDefinitions, setNodeDefinitions] = useState<Record<string, NodeDefinition>>({})
	const [previewImage, setPreviewImage] = useState<string | null>(null)

	const wsRef = useRef<WebSocket | null>(null)
	const clientIdRef = useRef<string>(crypto.randomUUID())
	const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
	const previewUrlRef = useRef<string | null>(null)

	const { addToast } = useToast()
	const { setProgress, completeRunning, failRunning, addToQueue, startNext } = useQueueStore()
	const { nodes, edges } = useGraphStore()

	const handleMessage = useCallback(
		(event: MessageEvent) => {
			// Handle binary messages (preview images)
			if (event.data instanceof Blob) {
				// Revoke previous preview URL to prevent memory leaks
				if (previewUrlRef.current) {
					URL.revokeObjectURL(previewUrlRef.current)
				}
				const url = URL.createObjectURL(event.data)
				previewUrlRef.current = url
				setPreviewImage(url)
				return
			}

			try {
				const message = JSON.parse(event.data)

				switch (message.type) {
					case 'progress':
						setProgress({
							nodeId: message.data.node,
							nodeLabel: message.data.node,
							value: message.data.value,
							max: message.data.max
						})
						break

					case 'executing':
						if (message.data.node === null) {
							// Execution complete
							completeRunning()
							// Clear preview image
							if (previewUrlRef.current) {
								URL.revokeObjectURL(previewUrlRef.current)
								previewUrlRef.current = null
								setPreviewImage(null)
							}
							// Start next item if any
							startNext()
						}
						break

					case 'executed':
						// Node execution completed - could store output here if needed
						break

					case 'execution_start':
						// Workflow execution started
						break

					case 'execution_success':
						// Workflow completed successfully
						break

					case 'execution_cached':
						// Nodes were cached and skipped
						break

					case 'execution_interrupted':
						addToast({ type: 'warning', message: 'Execution interrupted' })
						break

					case 'execution_error':
						failRunning(message.data.exception_message)
						addToast({
							type: 'error',
							message: `Execution failed: ${message.data.exception_message}`
						})
						break

					case 'status':
						// Queue status update
						break
				}
			} catch (err) {
				console.error('Failed to parse WebSocket message:', err)
			}
		},
		[setProgress, completeRunning, failRunning, startNext, addToast]
	)

	const connect = useCallback(() => {
		if (wsRef.current?.readyState === WebSocket.OPEN) return

		setIsConnecting(true)

		const wsUrl = `${API_BASE.replace('http', 'ws')}/ws?clientId=${clientIdRef.current}`
		const ws = new WebSocket(wsUrl)

		ws.onopen = () => {
			setIsConnected(true)
			setIsConnecting(false)
			addToast({ type: 'success', message: 'Connected to ComfyUI' })
		}

		ws.onclose = () => {
			setIsConnected(false)
			setIsConnecting(false)

			// Attempt reconnection after 3 seconds
			reconnectTimeoutRef.current = setTimeout(() => {
				if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
					connect()
				}
			}, 3000)
		}

		ws.onerror = () => {
			setIsConnecting(false)
			addToast({ type: 'error', message: 'Failed to connect to ComfyUI' })
		}

		ws.onmessage = handleMessage

		wsRef.current = ws
	}, [handleMessage, addToast])

	const disconnect = useCallback(() => {
		if (reconnectTimeoutRef.current) {
			clearTimeout(reconnectTimeoutRef.current)
		}

		if (wsRef.current) {
			wsRef.current.close()
			wsRef.current = null
		}

		// Clean up preview URL
		if (previewUrlRef.current) {
			URL.revokeObjectURL(previewUrlRef.current)
			previewUrlRef.current = null
			setPreviewImage(null)
		}

		setIsConnected(false)
	}, [])

	const queuePrompt = useCallback(async (): Promise<string | null> => {
		try {
			const workflow = graphToWorkflow(nodes, edges)

			const response = await fetch(`${API_BASE}/prompt`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					prompt: workflow,
					client_id: clientIdRef.current
				})
			})

			if (!response.ok) {
				const error = await response.json()
				throw new Error(error.error?.message || error.error || 'Failed to queue prompt')
			}

			const data = await response.json()
			const promptId = data.prompt_id

			// Add to queue store
			addToQueue(promptId, workflow)
			startNext()

			addToast({ type: 'info', message: 'Prompt queued' })
			return promptId
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to queue prompt'
			addToast({ type: 'error', message })
			return null
		}
	}, [nodes, edges, addToQueue, startNext, addToast])

	const interrupt = useCallback(async () => {
		try {
			await fetch(`${API_BASE}/interrupt`, { method: 'POST' })
			addToast({ type: 'warning', message: 'Execution interrupted' })
		} catch {
			addToast({ type: 'error', message: 'Failed to interrupt' })
		}
	}, [addToast])

	const fetchNodeDefinitions = useCallback(async () => {
		try {
			const response = await fetch(`${API_BASE}/object_info`)
			if (!response.ok) throw new Error('Failed to fetch node definitions')

			const data = await response.json()
			setNodeDefinitions(data)
		} catch (err) {
			console.error('Failed to fetch node definitions:', err)
		}
	}, [])

	// Queue methods
	const getQueue = useCallback(async () => {
		const response = await fetch(`${API_BASE}/queue`)
		if (!response.ok) throw new Error('Failed to get queue')
		return response.json()
	}, [])

	const clearQueue = useCallback(async () => {
		await fetch(`${API_BASE}/queue`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ clear: true })
		})
	}, [])

	// History methods
	const getHistory = useCallback(async (promptId?: string): Promise<Record<string, HistoryItem>> => {
		const url = promptId ? `${API_BASE}/history/${promptId}` : `${API_BASE}/history`
		const response = await fetch(url)
		if (!response.ok) throw new Error('Failed to get history')
		return response.json()
	}, [])

	const clearHistory = useCallback(async (promptIds?: string[]) => {
		await fetch(`${API_BASE}/history`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(promptIds ? { delete: promptIds } : { clear: true })
		})
	}, [])

	// Image methods
	const uploadImage = useCallback(
		async (file: File, subfolder = '', overwrite = false): Promise<ImageInfo> => {
			const formData = new FormData()
			formData.append('image', file)
			formData.append('type', 'input')
			formData.append('subfolder', subfolder)
			formData.append('overwrite', String(overwrite))

			const response = await fetch(`${API_BASE}/upload/image`, {
				method: 'POST',
				body: formData
			})

			if (!response.ok) throw new Error('Failed to upload image')
			return response.json()
		},
		[]
	)

	const getImageUrl = useCallback(
		(filename: string, subfolder = '', type: 'output' | 'input' | 'temp' = 'output'): string => {
			const params = new URLSearchParams({ filename, subfolder, type })
			return `${API_BASE}/view?${params}`
		},
		[]
	)

	// System methods
	const getSystemStats = useCallback(async (): Promise<SystemStats> => {
		const response = await fetch(`${API_BASE}/system_stats`)
		if (!response.ok) throw new Error('Failed to get system stats')
		return response.json()
	}, [])

	const freeMemory = useCallback(async (unloadModels = true, freeMemoryFlag = true) => {
		await fetch(`${API_BASE}/free`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				unload_models: unloadModels,
				free_memory: freeMemoryFlag
			})
		})
	}, [])

	const getExtensions = useCallback(async (): Promise<string[]> => {
		const response = await fetch(`${API_BASE}/extensions`)
		if (!response.ok) throw new Error('Failed to get extensions')
		return response.json()
	}, [])

	const getEmbeddings = useCallback(async (): Promise<string[]> => {
		const response = await fetch(`${API_BASE}/embeddings`)
		if (!response.ok) throw new Error('Failed to get embeddings')
		return response.json()
	}, [])

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			disconnect()
		}
	}, [disconnect])

	return {
		// Connection state
		isConnected,
		isConnecting,
		nodeDefinitions,
		previewImage,

		// Connection methods
		connect,
		disconnect,

		// Workflow methods
		queuePrompt,
		interrupt,
		fetchNodeDefinitions,

		// Queue methods
		getQueue,
		clearQueue,

		// History methods
		getHistory,
		clearHistory,

		// Image methods
		uploadImage,
		getImageUrl,

		// System methods
		getSystemStats,
		freeMemory,
		getExtensions,
		getEmbeddings
	}
}
