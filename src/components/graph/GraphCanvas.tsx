// src/components/graph/GraphCanvas.tsx
// Date: December 25, 2025
// Version: v1

'use client'

import { useCallback, useMemo } from 'react'
import ReactFlow, {
	Background,
	Controls,
	MiniMap,
	type OnNodesChange,
	type OnEdgesChange,
	type OnConnect,
	type NodeTypes,
	type EdgeTypes,
	BackgroundVariant
} from 'reactflow'
import 'reactflow/dist/style.css'

import { useGraphStore } from '@/stores/graphStore'
import { nodeToReactFlowNode, edgeToReactFlowEdge } from '@/lib/utils/graphConverters'
import { ComfyNode } from '@/components/nodes/ComfyNode'
import { ComfyEdge } from './ComfyEdge'

const nodeTypes: NodeTypes = {
	comfyNode: ComfyNode
}

const edgeTypes: EdgeTypes = {
	comfyEdge: ComfyEdge
}

export function GraphCanvas() {
	const {
		nodes: storeNodes,
		edges: storeEdges,
		selectedNodeIds,
		viewport,
		addNode,
		updateNode,
		deleteNodes,
		addEdge: addStoreEdge,
		deleteEdges,
		selectNodes,
		clearSelection,
		setViewport
	} = useGraphStore()

	// Convert store data to React Flow format
	const nodes = useMemo(
		() =>
			Array.from(storeNodes.values()).map((node) => ({
				...nodeToReactFlowNode(node),
				selected: selectedNodeIds.has(node.id)
			})),
		[storeNodes, selectedNodeIds]
	)

	const edges = useMemo(
		() => Array.from(storeEdges.values()).map(edgeToReactFlowEdge),
		[storeEdges]
	)

	const onNodesChange: OnNodesChange = useCallback(
		(changes) => {
			changes.forEach((change) => {
				if (change.type === 'position' && change.position) {
					updateNode(change.id, { position: change.position })
				} else if (change.type === 'remove') {
					deleteNodes([change.id])
				} else if (change.type === 'select') {
					if (change.selected) {
						selectNodes([change.id], true)
					}
				}
			})
		},
		[updateNode, deleteNodes, selectNodes]
	)

	const onEdgesChange: OnEdgesChange = useCallback(
		(changes) => {
			changes.forEach((change) => {
				if (change.type === 'remove') {
					deleteEdges([change.id])
				}
			})
		},
		[deleteEdges]
	)

	const onConnect: OnConnect = useCallback(
		(connection) => {
			if (connection.source && connection.target) {
				addStoreEdge({
					source: connection.source,
					sourceHandle: connection.sourceHandle || '',
					target: connection.target,
					targetHandle: connection.targetHandle || '',
					type: 'comfyEdge'
				})
			}
		},
		[addStoreEdge]
	)

	const onMoveEnd = useCallback(
		(_: unknown, vp: { x: number; y: number; zoom: number }) => {
			setViewport(vp)
		},
		[setViewport]
	)

	const onPaneClick = useCallback(() => {
		clearSelection()
	}, [clearSelection])

	const onDrop = useCallback(
		(event: React.DragEvent) => {
			event.preventDefault()

			const nodeType = event.dataTransfer.getData('application/comfynode')
			if (!nodeType) return

			const reactFlowBounds = (event.target as HTMLElement)
				.closest('.react-flow')
				?.getBoundingClientRect()

			if (!reactFlowBounds) return

			const position = {
				x: (event.clientX - reactFlowBounds.left - viewport.x) / viewport.zoom,
				y: (event.clientY - reactFlowBounds.top - viewport.y) / viewport.zoom
			}

			// Parse the node data from the drag event
			try {
				const nodeData = JSON.parse(event.dataTransfer.getData('application/comfynode-data') || '{}')

				addNode({
					type: 'comfyNode',
					position,
					data: {
						label: nodeData.label || nodeType,
						type: nodeType,
						inputs: nodeData.inputs || [],
						outputs: nodeData.outputs || [],
						widgets: nodeData.widgets || []
					}
				})
			} catch {
				// Fallback for simple drag data
				addNode({
					type: 'comfyNode',
					position,
					data: {
						label: nodeType,
						type: nodeType,
						inputs: [],
						outputs: [],
						widgets: []
					}
				})
			}
		},
		[addNode, viewport]
	)

	const onDragOver = useCallback((event: React.DragEvent) => {
		event.preventDefault()
		event.dataTransfer.dropEffect = 'move'
	}, [])

	return (
		<div className="w-full h-full" onDrop={onDrop} onDragOver={onDragOver}>
			<ReactFlow
				nodes={nodes}
				edges={edges}
				nodeTypes={nodeTypes}
				edgeTypes={edgeTypes}
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
				onConnect={onConnect}
				onMoveEnd={onMoveEnd}
				onPaneClick={onPaneClick}
				defaultViewport={viewport}
				fitView
				snapToGrid
				snapGrid={[16, 16]}
				minZoom={0.1}
				maxZoom={4}
				deleteKeyCode={null} // We handle delete in useKeyboardShortcuts
				multiSelectionKeyCode="Shift"
				className="bg-comfy-bg"
			>
				<Background
					variant={BackgroundVariant.Dots}
					gap={20}
					size={1}
					color="var(--comfy-border)"
				/>
				<Controls className="bg-comfy-surface border-comfy-border" />
				<MiniMap
					nodeStrokeWidth={3}
					zoomable
					pannable
					className="bg-comfy-surface border-comfy-border"
					maskColor="rgba(26, 26, 46, 0.8)"
				/>
			</ReactFlow>
		</div>
	)
}
