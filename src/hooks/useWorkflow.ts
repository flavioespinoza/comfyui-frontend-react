// src/hooks/useWorkflow.ts
// Date: December 25, 2025
// Version: v1

'use client'

import { useCallback, useState } from 'react'
import { useGraphStore } from '@/stores'
import { graphToWorkflow } from '@/lib/utils/graphConverters'
import type { GraphNode, GraphEdge } from '@/types/graph'

interface WorkflowMetadata {
	name: string
	description?: string
	author?: string
	createdAt: Date
	updatedAt: Date
	version: string
}

interface SavedWorkflow {
	metadata: WorkflowMetadata
	graph: {
		nodes: GraphNode[]
		edges: GraphEdge[]
	}
}

interface UseWorkflowReturn {
	currentWorkflow: WorkflowMetadata | null
	isDirty: boolean
	isSaving: boolean
	isLoading: boolean
	error: string | null
	saveWorkflow: (name?: string) => Promise<void>
	loadWorkflow: (file: File) => Promise<void>
	loadWorkflowFromJson: (json: string) => void
	exportWorkflow: () => string
	exportAsComfyUI: () => Record<string, unknown>
	newWorkflow: () => void
	setDirty: (dirty: boolean) => void
}

// Helper to deserialize graph from JSON
function deserializeGraph(json: string): { nodes: GraphNode[]; edges: GraphEdge[] } {
	const data = JSON.parse(json)
	if (data.graph) {
		return { nodes: data.graph.nodes || [], edges: data.graph.edges || [] }
	}
	if (data.nodes && data.edges) {
		return { nodes: data.nodes, edges: data.edges }
	}
	throw new Error('Invalid workflow format')
}

// Helper to serialize graph to JSON
function serializeGraph(nodes: Map<string, GraphNode>, edges: Map<string, GraphEdge>): string {
	return JSON.stringify(
		{
			nodes: Array.from(nodes.values()),
			edges: Array.from(edges.values())
		},
		null,
		2
	)
}

export function useWorkflow(): UseWorkflowReturn {
	const { nodes, edges, loadGraph, clearGraph } = useGraphStore()

	const [currentWorkflow, setCurrentWorkflow] = useState<WorkflowMetadata | null>(null)
	const [isDirty, setIsDirty] = useState(false)
	const [isSaving, setIsSaving] = useState(false)
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const saveWorkflow = useCallback(
		async (name?: string) => {
			setIsSaving(true)
			setError(null)

			try {
				const metadata: WorkflowMetadata = {
					name: name || currentWorkflow?.name || 'Untitled Workflow',
					description: currentWorkflow?.description,
					author: currentWorkflow?.author,
					createdAt: currentWorkflow?.createdAt || new Date(),
					updatedAt: new Date(),
					version: '1.0.0'
				}

				const workflow: SavedWorkflow = {
					metadata,
					graph: {
						nodes: Array.from(nodes.values()),
						edges: Array.from(edges.values())
					}
				}

				const json = JSON.stringify(workflow, null, 2)
				const blob = new Blob([json], { type: 'application/json' })
				const url = URL.createObjectURL(blob)

				const link = document.createElement('a')
				link.href = url
				link.download = `${metadata.name.replace(/[^a-z0-9]/gi, '_')}.json`
				document.body.appendChild(link)
				link.click()
				document.body.removeChild(link)
				URL.revokeObjectURL(url)

				setCurrentWorkflow(metadata)
				setIsDirty(false)
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Failed to save workflow')
			} finally {
				setIsSaving(false)
			}
		},
		[nodes, edges, currentWorkflow]
	)

	const loadWorkflow = useCallback(
		async (file: File) => {
			setIsLoading(true)
			setError(null)

			try {
				const text = await file.text()
				const data = JSON.parse(text) as SavedWorkflow

				if (data.graph?.nodes && data.graph?.edges) {
					loadGraph(data.graph.nodes, data.graph.edges)
					setCurrentWorkflow(data.metadata)
					setIsDirty(false)
				} else {
					const { nodes: graphNodes, edges: graphEdges } = deserializeGraph(text)
					loadGraph(graphNodes, graphEdges)
					setCurrentWorkflow({
						name: file.name.replace(/\.json$/, ''),
						createdAt: new Date(),
						updatedAt: new Date(),
						version: '1.0.0'
					})
					setIsDirty(false)
				}
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Failed to load workflow')
			} finally {
				setIsLoading(false)
			}
		},
		[loadGraph]
	)

	const loadWorkflowFromJson = useCallback(
		(json: string) => {
			try {
				const { nodes: graphNodes, edges: graphEdges } = deserializeGraph(json)
				loadGraph(graphNodes, graphEdges)
				setIsDirty(false)
				setError(null)
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Failed to parse workflow JSON')
			}
		},
		[loadGraph]
	)

	const exportWorkflow = useCallback(() => {
		return serializeGraph(nodes, edges)
	}, [nodes, edges])

	const exportAsComfyUI = useCallback(() => {
		return graphToWorkflow(nodes, edges)
	}, [nodes, edges])

	const newWorkflow = useCallback(() => {
		clearGraph()
		setCurrentWorkflow(null)
		setIsDirty(false)
		setError(null)
	}, [clearGraph])

	const setDirtyFn = useCallback((dirty: boolean) => {
		setIsDirty(dirty)
	}, [])

	return {
		currentWorkflow,
		isDirty,
		isSaving,
		isLoading,
		error,
		saveWorkflow,
		loadWorkflow,
		loadWorkflowFromJson,
		exportWorkflow,
		exportAsComfyUI,
		newWorkflow,
		setDirty: setDirtyFn
	}
}
