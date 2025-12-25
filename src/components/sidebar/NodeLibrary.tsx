// src/components/sidebar/NodeLibrary.tsx
// Date: December 25, 2025
// Version: v1

'use client'

import { useState, useMemo, useEffect } from 'react'
import { Search, ChevronRight, ChevronDown } from 'lucide-react'
import { useComfyAPI } from '@/hooks/useComfyAPI'
import { nodeDefToGraphNode } from '@/lib/utils/graphConverters'
import type { NodeDefinition } from '@/types/comfy'

interface NodeItem {
	type: string
	label: string
	category: string
	definition: NodeDefinition
}

export function NodeLibrary() {
	const { nodeDefinitions, fetchNodeDefinitions, isConnected } = useComfyAPI()
	const [search, setSearch] = useState('')
	const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
		new Set(['sampling', 'loaders', 'conditioning'])
	)

	// Fetch node definitions when connected
	useEffect(() => {
		if (isConnected) {
			fetchNodeDefinitions()
		}
	}, [isConnected, fetchNodeDefinitions])

	// Convert node definitions to list format
	const nodeList = useMemo<NodeItem[]>(() => {
		return Object.entries(nodeDefinitions).map(([type, def]) => ({
			type,
			label: def.display_name || type,
			category: def.category.split('/')[0] || 'uncategorized',
			definition: def
		}))
	}, [nodeDefinitions])

	// Filter nodes by search
	const filteredNodes = useMemo(() => {
		if (!search) return nodeList
		const searchLower = search.toLowerCase()
		return nodeList.filter(
			(node) =>
				node.label.toLowerCase().includes(searchLower) ||
				node.type.toLowerCase().includes(searchLower) ||
				node.category.toLowerCase().includes(searchLower)
		)
	}, [nodeList, search])

	// Group nodes by category
	const nodesByCategory = useMemo(() => {
		const grouped: Record<string, NodeItem[]> = {}
		filteredNodes.forEach((node) => {
			if (!grouped[node.category]) {
				grouped[node.category] = []
			}
			grouped[node.category].push(node)
		})
		// Sort categories alphabetically
		return Object.fromEntries(
			Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b))
		)
	}, [filteredNodes])

	const toggleCategory = (category: string) => {
		setExpandedCategories((prev) => {
			const next = new Set(prev)
			if (next.has(category)) {
				next.delete(category)
			} else {
				next.add(category)
			}
			return next
		})
	}

	const handleDragStart = (event: React.DragEvent, node: NodeItem) => {
		event.dataTransfer.setData('application/comfynode', node.type)

		// Create node data for drop
		const graphNode = nodeDefToGraphNode(node.definition, { x: 0, y: 0 })
		event.dataTransfer.setData(
			'application/comfynode-data',
			JSON.stringify(graphNode.data)
		)
		event.dataTransfer.effectAllowed = 'move'
	}

	return (
		<div className="flex flex-col h-full">
			{/* Search input */}
			<div className="p-3 border-b border-comfy-border">
				<div className="relative">
					<Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-comfy-muted" />
					<input
						type="text"
						placeholder="Search nodes..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="w-full pl-9 pr-3 py-2 text-sm rounded border bg-comfy-bg border-comfy-border text-comfy-text placeholder:text-comfy-muted focus:outline-none focus:ring-1 focus:ring-comfy-accent focus:border-comfy-accent"
					/>
				</div>
			</div>

			{/* Node list */}
			<div className="flex-1 overflow-y-auto">
				{Object.keys(nodesByCategory).length === 0 ? (
					<div className="p-4 text-sm text-comfy-muted text-center">
						{isConnected
							? 'Loading nodes...'
							: 'Connect to ComfyUI to load nodes'}
					</div>
				) : (
					Object.entries(nodesByCategory).map(([category, nodes]) => (
						<div key={category} className="border-b border-comfy-border last:border-b-0">
							<button
								onClick={() => toggleCategory(category)}
								className="w-full px-3 py-2 flex items-center gap-2 text-sm font-medium text-comfy-text hover:bg-comfy-bg/50"
							>
								{expandedCategories.has(category) ? (
									<ChevronDown className="w-4 h-4 text-comfy-muted" />
								) : (
									<ChevronRight className="w-4 h-4 text-comfy-muted" />
								)}
								<span className="capitalize flex-1 text-left">{category}</span>
								<span className="text-xs text-comfy-muted">
									{nodes.length}
								</span>
							</button>
							{expandedCategories.has(category) && (
								<div className="pb-2">
									{nodes.map((node) => (
										<div
											key={node.type}
											draggable
											onDragStart={(e) => handleDragStart(e, node)}
											className="mx-2 px-3 py-2 text-sm rounded cursor-grab hover:bg-comfy-bg active:cursor-grabbing transition-colors"
										>
											<div className="font-medium text-comfy-text">
												{node.label}
											</div>
											<div className="text-xs text-comfy-muted truncate">
												{node.type}
											</div>
										</div>
									))}
								</div>
							)}
						</div>
					))
				)}
			</div>
		</div>
	)
}
