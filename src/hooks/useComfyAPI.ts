// src/hooks/useComfyAPI.ts
// Date: December 25, 2025
// Version: v1

'use client'

import { useCallback, useRef, useState, useEffect } from 'react'
import { useQueueStore } from '@/stores/queueStore'
import { useToast } from '@/components/ui/Toast'
import { graphToWorkflow } from '@/lib/utils/graphConverters'
import { useGraphStore } from '@/stores/graphStore'
import type { ComfyUIMessage, NodeDefinition } from '@/types/comfy'

const API_BASE = process.env.NEXT_PUBLIC_COMFY_API_URL || 'http://localhost:8188'

interface UseComfyAPIReturn {
	isConnected: boolean
	isConnecting: boolean
	nodeDefinitions: Record<string, NodeDefinition>
	connect: () => void
	disconnect: () => void
	queuePrompt: () => Promise<string | null>
	interrupt: () => Promise<void>
	fetchNodeDefinitions: () => Promise<void>
}

export function useComfyAPI(): UseComfyAPIReturn {
	const [isConnected, setIsConnected] = useState(false)
	const [isConnecting, setIsConnecting] = useState(false)
	const [nodeDefinitions, setNodeDefinitions] = useState<Record<string, NodeDefinition>>({})

	const wsRef = useRef<WebSocket | null>(null)
	const clientIdRef = useRef<string>(crypto.randomUUID())
	const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

	const { addToast } = useToast()
	const { setProgress, completeRunning, failRunning, addToQueue, startNext } = useQueueStore()
	const { nodes, edges } = useGraphStore()

	const handleMessage = useCallback(
		(event: MessageEvent) => {
			try {
				const message: ComfyUIMessage = JSON.parse(event.data)

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
							// Start next item if any
							startNext()
						}
						break

					case 'executed':
						// Node execution completed
						break

					case 'execution_error':
						failRunning(message.data.exception_message)
						addToast({
							type: 'error',
							message: `Execution failed: ${message.data.exception_message}`
						})
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
				throw new Error(error.error || 'Failed to queue prompt')
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
		} catch (err) {
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

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			disconnect()
		}
	}, [disconnect])

	return {
		isConnected,
		isConnecting,
		nodeDefinitions,
		connect,
		disconnect,
		queuePrompt,
		interrupt,
		fetchNodeDefinitions
	}
}
