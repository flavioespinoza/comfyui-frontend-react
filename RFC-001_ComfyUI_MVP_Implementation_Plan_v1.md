# ComfyUI Frontend React - MVP Implementation Plan

**Project**: comfyui-frontend-react  
**Date**: December 25, 2025  
**Version**: v1  
**Target**: Claude Code in VSCode

---

## Overview

This document contains complete implementation instructions for building the MVP of the ComfyUI React frontend. Execute these tasks in order. Each section contains the complete code for that file.

**Estimated Time**: 74 hours  
**Prerequisites**: Node.js 20+, npm/pnpm

---

## Table of Contents

1. [Project Setup](#1-project-setup)
2. [Configuration Files](#2-configuration-files)
3. [Type Definitions](#3-type-definitions)
4. [App Shell](#4-app-shell)
5. [Graph Converters](#5-graph-converters)
6. [API Hook](#6-api-hook)
7. [Workflow Hook](#7-workflow-hook)
8. [Node Library](#8-node-library)
9. [Custom Edge](#9-custom-edge)
10. [Context Menu](#10-context-menu)
11. [Queue Controls](#11-queue-controls)
12. [Queue Panel](#12-queue-panel)
13. [Image Widget](#13-image-widget)
14. [Toast Notifications](#14-toast-notifications)
15. [Final Integration](#15-final-integration)

---

## 1. Project Setup

### 1.1 Initialize Project

```bash
cd comfyui-frontend-react
npm install
```

### 1.2 Install Additional Dependencies

```bash
npm install clsx tailwind-merge @dnd-kit/core @dnd-kit/sortable
npm install -D @types/node postcss autoprefixer
```

---

## 2. Configuration Files

### 2.1 next.config.ts

```typescript
// next.config.ts
// Date: December 25, 2025
// Version: v1

import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
	reactStrictMode: true,
	experimental: {
		reactCompiler: true
	},
	images: {
		remotePatterns: [
			{
				protocol: 'http',
				hostname: 'localhost',
				port: '8188',
				pathname: '/view/**'
			}
		]
	},
	async rewrites() {
		return [
			{
				source: '/api/comfy/:path*',
				destination: 'http://localhost:8188/:path*'
			}
		]
	}
}

export default nextConfig
```

### 2.2 tailwind.config.ts

```typescript
// tailwind.config.ts
// Date: December 25, 2025
// Version: v1

import type { Config } from 'tailwindcss'

const config: Config = {
	content: [
		'./src/pages/**/*.{js,ts,jsx,tsx,mdx}',
		'./src/components/**/*.{js,ts,jsx,tsx,mdx}',
		'./src/app/**/*.{js,ts,jsx,tsx,mdx}'
	],
	theme: {
		extend: {
			colors: {
				comfy: {
					bg: '#1a1a2e',
					surface: '#16213e',
					border: '#0f3460',
					accent: '#e94560',
					text: '#eaeaea',
					muted: '#7f8c8d'
				}
			}
		}
	},
	plugins: []
}

export default config
```

### 2.3 postcss.config.js

```javascript
// postcss.config.js
// Date: December 25, 2025
// Version: v1

module.exports = {
	plugins: {
		tailwindcss: {},
		autoprefixer: {}
	}
}
```

### 2.4 tsconfig.json

```json
{
	"compilerOptions": {
		"target": "ES2017",
		"lib": ["dom", "dom.iterable", "esnext"],
		"allowJs": true,
		"skipLibCheck": true,
		"strict": true,
		"noEmit": true,
		"esModuleInterop": true,
		"module": "esnext",
		"moduleResolution": "bundler",
		"resolveJsonModule": true,
		"isolatedModules": true,
		"jsx": "preserve",
		"incremental": true,
		"plugins": [
			{
				"name": "next"
			}
		],
		"paths": {
			"@/*": ["./src/*"]
		}
	},
	"include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
	"exclude": ["node_modules"]
}
```

### 2.5 .env.local

```bash
# .env.local
# Date: December 25, 2025
# Version: v1

NEXT_PUBLIC_COMFY_API_URL=http://localhost:8188
```

---

## 3. Type Definitions

### 3.1 src/types/ui.ts

```typescript
// src/types/ui.ts
// Date: December 25, 2025
// Version: v1

export type SidebarTab = 'nodes' | 'queue' | 'workflows'
export type Theme = 'dark' | 'light'
export type ViewMode = 'graph' | 'linear'

export interface UIState {
	sidebarOpen: boolean
	sidebarTab: SidebarTab
	queuePanelOpen: boolean
	settingsPanelOpen: boolean
	activeModal: string | null
	modalData: unknown
	theme: Theme
	viewMode: ViewMode

	toggleSidebar: () => void
	setSidebarTab: (tab: SidebarTab) => void
	toggleQueuePanel: () => void
	toggleSettingsPanel: () => void
	openModal: (modal: string, data?: unknown) => void
	closeModal: () => void
	setTheme: (theme: Theme) => void
	setViewMode: (mode: ViewMode) => void
}
```

### 3.2 src/types/queue.ts

```typescript
// src/types/queue.ts
// Date: December 25, 2025
// Version: v1

export interface QueueItem {
	id: string
	promptId: string
	workflow: unknown
	status: 'pending' | 'running' | 'completed' | 'failed'
	createdAt: number
	completedAt?: number
	error?: string
	outputs?: Record<string, unknown>
}

export interface QueueProgress {
	nodeId: string
	nodeLabel: string
	value: number
	max: number
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
```

### 3.3 src/types/shortcuts.ts

```typescript
// src/types/shortcuts.ts
// Date: December 25, 2025
// Version: v1

export type ModifierKey = 'ctrl' | 'meta' | 'shift' | 'alt'

export interface ShortcutDefinition {
	key: string
	modifiers?: ModifierKey[]
	action: () => void
	when?: () => boolean
	description: string
}

export interface ShortcutGroup {
	name: string
	shortcuts: ShortcutDefinition[]
}
```

### 3.4 src/types/comfy.ts (NEW FILE)

```typescript
// src/types/comfy.ts
// Date: December 25, 2025
// Version: v1

export interface ComfyUIWorkflow {
	[nodeId: string]: ComfyUINode
}

export interface ComfyUINode {
	class_type: string
	inputs: Record<string, unknown>
	_meta?: {
		title?: string
	}
}

export interface NodeDefinition {
	name: string
	display_name: string
	category: string
	description?: string
	input: {
		required?: Record<string, InputDefinition>
		optional?: Record<string, InputDefinition>
		hidden?: Record<string, InputDefinition>
	}
	output: string[]
	output_name: string[]
	output_is_list: boolean[]
	output_node: boolean
}

export type InputDefinition = [string, InputConfig?]

export interface InputConfig {
	default?: unknown
	min?: number
	max?: number
	step?: number
	multiline?: boolean
	dynamicPrompts?: boolean
	tooltip?: string
}

export interface ComfyUIProgress {
	type: 'progress'
	data: {
		value: number
		max: number
		prompt_id: string
		node: string
	}
}

export interface ComfyUIExecuting {
	type: 'executing'
	data: {
		node: string | null
		prompt_id: string
	}
}

export interface ComfyUIExecuted {
	type: 'executed'
	data: {
		node: string
		output: Record<string, unknown>
		prompt_id: string
	}
}

export interface ComfyUIError {
	type: 'execution_error'
	data: {
		prompt_id: string
		node_id: string
		node_type: string
		exception_message: string
		exception_type: string
	}
}

export type ComfyUIMessage =
	| ComfyUIProgress
	| ComfyUIExecuting
	| ComfyUIExecuted
	| ComfyUIError
```

### 3.5 src/types/index.ts

```typescript
// src/types/index.ts
// Date: December 25, 2025
// Version: v1

export * from './graph'
export * from './extensions'
export * from './ui'
export * from './queue'
export * from './shortcuts'
export * from './comfy'
```

---

## 4. App Shell

### 4.1 src/app/globals.css

```css
/* src/app/globals.css */
/* Date: December 25, 2025 */
/* Version: v1 */

@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
	--comfy-bg: #1a1a2e;
	--comfy-surface: #16213e;
	--comfy-border: #0f3460;
	--comfy-accent: #e94560;
	--comfy-text: #eaeaea;
	--comfy-muted: #7f8c8d;
}

* {
	box-sizing: border-box;
}

body {
	margin: 0;
	padding: 0;
	background-color: var(--comfy-bg);
	color: var(--comfy-text);
	font-family: system-ui, -apple-system, sans-serif;
}

/* React Flow overrides */
.react-flow__node {
	font-size: 12px;
}

.react-flow__handle {
	width: 12px;
	height: 12px;
}

.react-flow__edge-path {
	stroke-width: 2;
}

.react-flow__background {
	background-color: var(--comfy-bg);
}

/* Scrollbar styling */
::-webkit-scrollbar {
	width: 8px;
	height: 8px;
}

::-webkit-scrollbar-track {
	background: var(--comfy-surface);
}

::-webkit-scrollbar-thumb {
	background: var(--comfy-border);
	border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
	background: var(--comfy-muted);
}
```

### 4.2 src/app/layout.tsx

```typescript
// src/app/layout.tsx
// Date: December 25, 2025
// Version: v1

import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
	title: 'ComfyUI',
	description: 'ComfyUI - Node-based Stable Diffusion Interface'
}

export default function RootLayout({
	children
}: {
	children: React.ReactNode
}) {
	return (
		<html lang="en" className="dark">
			<body className="min-h-screen bg-comfy-bg text-comfy-text antialiased">
				{children}
			</body>
		</html>
	)
}
```

### 4.3 src/app/page.tsx

```typescript
// src/app/page.tsx
// Date: December 25, 2025
// Version: v1

'use client'

import { useEffect } from 'react'
import { ReactFlowProvider } from 'reactflow'
import { GraphCanvas } from '@/components/graph/GraphCanvas'
import { Sidebar } from '@/components/sidebar/Sidebar'
import { QueuePanel } from '@/components/queue/QueuePanel'
import { ToastContainer } from '@/components/ui/Toast'
import { useComfyAPI } from '@/hooks/useComfyAPI'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useUIStore } from '@/stores/uiStore'

export default function Home() {
	const { connect, disconnect } = useComfyAPI()
	const queuePanelOpen = useUIStore((s) => s.queuePanelOpen)

	// Connect to ComfyUI on mount
	useEffect(() => {
		connect()
		return () => disconnect()
	}, [connect, disconnect])

	// Initialize keyboard shortcuts
	useKeyboardShortcuts()

	return (
		<ReactFlowProvider>
			<div className="flex h-screen w-screen overflow-hidden">
				{/* Sidebar */}
				<Sidebar />

				{/* Main Canvas */}
				<main className="flex-1 relative">
					<GraphCanvas />
				</main>

				{/* Queue Panel (right side) */}
				{queuePanelOpen && (
					<aside className="w-80 border-l border-comfy-border">
						<QueuePanel />
					</aside>
				)}

				{/* Toast Notifications */}
				<ToastContainer />
			</div>
		</ReactFlowProvider>
	)
}
```

---

## 5. Graph Converters

### 5.1 src/lib/utils/graphConverters.ts

```typescript
// src/lib/utils/graphConverters.ts
// Date: December 25, 2025
// Version: v1

import { nanoid } from 'nanoid'
import type { Node as ReactFlowNode, Edge as ReactFlowEdge } from 'reactflow'
import type {
	GraphNode,
	GraphEdge,
	ComfyNodeData,
	WidgetConfig,
	NodeInput,
	NodeOutput
} from '@/types/graph'
import type {
	ComfyUIWorkflow,
	ComfyUINode,
	NodeDefinition,
	InputDefinition
} from '@/types/comfy'

/**
 * Convert internal GraphNode to React Flow Node format
 */
export function nodeToReactFlowNode(node: GraphNode): ReactFlowNode<ComfyNodeData> {
	return {
		id: node.id,
		type: 'comfyNode',
		position: node.position,
		data: node.data,
		selected: node.selected,
		dragging: node.dragging
	}
}

/**
 * Convert internal GraphEdge to React Flow Edge format
 */
export function edgeToReactFlowEdge(edge: GraphEdge): ReactFlowEdge {
	return {
		id: edge.id,
		source: edge.source,
		sourceHandle: edge.sourceHandle,
		target: edge.target,
		targetHandle: edge.targetHandle,
		type: 'comfyEdge',
		animated: edge.animated
	}
}

/**
 * Convert graph state to ComfyUI workflow format for API
 */
export function graphToWorkflow(
	nodes: Map<string, GraphNode>,
	edges: Map<string, GraphEdge>
): ComfyUIWorkflow {
	const workflow: ComfyUIWorkflow = {}

	// Build a map of edge connections: targetNodeId:targetHandle -> sourceNodeId:sourceHandle
	const connectionMap = new Map<string, { nodeId: string; slotIndex: number }>()

	nodes.forEach((node) => {
		node.data.outputs.forEach((output, index) => {
			// Find edges from this output
			edges.forEach((edge) => {
				if (edge.source === node.id && edge.sourceHandle === output.id) {
					const key = `${edge.target}:${edge.targetHandle}`
					connectionMap.set(key, { nodeId: node.id, slotIndex: index })
				}
			})
		})
	})

	// Convert each node
	nodes.forEach((node, nodeId) => {
		const inputs: Record<string, unknown> = {}

		// Process widget values
		node.data.widgets.forEach((widget) => {
			inputs[widget.id] = widget.value
		})

		// Process connections (inputs that come from other nodes)
		node.data.inputs.forEach((input, index) => {
			const connectionKey = `${nodeId}:${input.id}`
			const connection = connectionMap.get(connectionKey)

			if (connection) {
				// Input is connected to another node's output
				inputs[input.id] = [connection.nodeId, connection.slotIndex]
			}
		})

		workflow[nodeId] = {
			class_type: node.data.type,
			inputs,
			_meta: {
				title: node.data.label
			}
		}
	})

	return workflow
}

/**
 * Convert ComfyUI workflow format to internal graph state
 */
export function workflowToGraph(
	workflow: ComfyUIWorkflow,
	nodeDefinitions: Record<string, NodeDefinition>
): { nodes: GraphNode[]; edges: GraphEdge[] } {
	const nodes: GraphNode[] = []
	const edges: GraphEdge[] = []
	const positions = new Map<string, { x: number; y: number }>()

	// Calculate grid positions for nodes
	let gridX = 0
	let gridY = 0
	const gridSpacingX = 300
	const gridSpacingY = 200
	const nodesPerRow = 4

	Object.keys(workflow).forEach((nodeId, index) => {
		positions.set(nodeId, {
			x: (index % nodesPerRow) * gridSpacingX + 50,
			y: Math.floor(index / nodesPerRow) * gridSpacingY + 50
		})
	})

	// Convert each workflow node
	Object.entries(workflow).forEach(([nodeId, workflowNode]) => {
		const nodeDef = nodeDefinitions[workflowNode.class_type]

		if (!nodeDef) {
			console.warn(`Unknown node type: ${workflowNode.class_type}`)
			return
		}

		const { inputs: inputDefs, widgets } = parseNodeDefinition(nodeDef)
		const nodeInputs: NodeInput[] = []
		const nodeWidgets: WidgetConfig[] = []

		// Process inputs and determine which are connections vs widgets
		Object.entries(workflowNode.inputs).forEach(([inputName, inputValue]) => {
			const isConnection = Array.isArray(inputValue) && inputValue.length === 2

			if (isConnection) {
				// This is a connection from another node
				const [sourceNodeId, sourceSlotIndex] = inputValue as [string, number]
				const sourceNode = workflow[sourceNodeId]
				const sourceNodeDef = sourceNode ? nodeDefinitions[sourceNode.class_type] : null
				const sourceOutputName = sourceNodeDef?.output_name?.[sourceSlotIndex] || `output_${sourceSlotIndex}`

				edges.push({
					id: nanoid(),
					source: sourceNodeId,
					sourceHandle: sourceOutputName,
					target: nodeId,
					targetHandle: inputName,
					animated: false
				})

				// Add as input slot
				const inputDef = inputDefs.get(inputName)
				nodeInputs.push({
					id: inputName,
					label: inputName,
					type: inputDef?.[0] || 'UNKNOWN',
					required: true
				})
			} else {
				// This is a widget value
				const inputDef = inputDefs.get(inputName)
				if (inputDef) {
					const widget = createWidgetFromDefinition(inputName, inputDef, inputValue)
					if (widget) {
						nodeWidgets.push(widget)
					}
				}
			}
		})

		// Add remaining inputs that weren't in the workflow (optional inputs)
		inputDefs.forEach((def, name) => {
			const alreadyProcessed = nodeInputs.some((i) => i.id === name) ||
				nodeWidgets.some((w) => w.id === name)

			if (!alreadyProcessed) {
				// Determine if it should be an input slot or widget
				const inputType = def[0]
				const isConnectionType = ['MODEL', 'CLIP', 'VAE', 'CONDITIONING', 'LATENT', 'IMAGE', 'MASK'].includes(inputType)

				if (isConnectionType) {
					nodeInputs.push({
						id: name,
						label: name,
						type: inputType,
						required: false
					})
				} else {
					const widget = createWidgetFromDefinition(name, def, def[1]?.default)
					if (widget) {
						nodeWidgets.push(widget)
					}
				}
			}
		})

		// Create outputs
		const nodeOutputs: NodeOutput[] = nodeDef.output_name.map((name, index) => ({
			id: name,
			label: name,
			type: nodeDef.output[index]
		}))

		const position = positions.get(nodeId) || { x: 0, y: 0 }

		nodes.push({
			id: nodeId,
			type: 'comfyNode',
			position,
			data: {
				label: workflowNode._meta?.title || nodeDef.display_name || workflowNode.class_type,
				type: workflowNode.class_type,
				widgets: nodeWidgets,
				inputs: nodeInputs,
				outputs: nodeOutputs
			},
			selected: false,
			dragging: false
		})
	})

	return { nodes, edges }
}

/**
 * Convert ComfyUI node definition to internal format
 */
export function nodeDefToGraphNode(
	nodeDef: NodeDefinition,
	position: { x: number; y: number }
): Omit<GraphNode, 'id'> {
	const { inputs, widgets } = parseNodeDefinition(nodeDef)

	const nodeInputs: NodeInput[] = []
	const nodeWidgets: WidgetConfig[] = []

	inputs.forEach((def, name) => {
		const inputType = def[0]
		const isConnectionType = ['MODEL', 'CLIP', 'VAE', 'CONDITIONING', 'LATENT', 'IMAGE', 'MASK', 'CONTROL_NET'].includes(inputType)

		if (isConnectionType) {
			nodeInputs.push({
				id: name,
				label: name,
				type: inputType,
				required: nodeDef.input.required?.[name] !== undefined
			})
		} else {
			const widget = createWidgetFromDefinition(name, def, def[1]?.default)
			if (widget) {
				nodeWidgets.push(widget)
			}
		}
	})

	const nodeOutputs: NodeOutput[] = nodeDef.output_name.map((name, index) => ({
		id: name,
		label: name,
		type: nodeDef.output[index]
	}))

	return {
		type: 'comfyNode',
		position,
		data: {
			label: nodeDef.display_name || nodeDef.name,
			type: nodeDef.name,
			widgets: nodeWidgets,
			inputs: nodeInputs,
			outputs: nodeOutputs
		},
		selected: false,
		dragging: false
	}
}

/**
 * Parse node definition inputs into a map
 */
function parseNodeDefinition(nodeDef: NodeDefinition): {
	inputs: Map<string, InputDefinition>
	widgets: Map<string, InputDefinition>
} {
	const inputs = new Map<string, InputDefinition>()
	const widgets = new Map<string, InputDefinition>()

	if (nodeDef.input.required) {
		Object.entries(nodeDef.input.required).forEach(([name, def]) => {
			inputs.set(name, def)
		})
	}

	if (nodeDef.input.optional) {
		Object.entries(nodeDef.input.optional).forEach(([name, def]) => {
			inputs.set(name, def)
		})
	}

	return { inputs, widgets }
}

/**
 * Create a widget configuration from a node definition input
 */
function createWidgetFromDefinition(
	name: string,
	def: InputDefinition,
	value?: unknown
): WidgetConfig | null {
	const [inputType, config] = def

	// Handle combo/select inputs
	if (Array.isArray(inputType)) {
		return {
			id: name,
			label: name,
			type: 'select',
			value: value ?? inputType[0],
			options: inputType
		}
	}

	switch (inputType) {
		case 'INT':
			return {
				id: name,
				label: name,
				type: 'number',
				value: value ?? config?.default ?? 0,
				min: config?.min,
				max: config?.max,
				step: config?.step ?? 1
			}

		case 'FLOAT':
			return {
				id: name,
				label: name,
				type: 'slider',
				value: value ?? config?.default ?? 0,
				min: config?.min ?? 0,
				max: config?.max ?? 1,
				step: config?.step ?? 0.01
			}

		case 'STRING':
			return {
				id: name,
				label: name,
				type: config?.multiline ? 'textarea' : 'text',
				value: value ?? config?.default ?? ''
			}

		case 'BOOLEAN':
			return {
				id: name,
				label: name,
				type: 'checkbox',
				value: value ?? config?.default ?? false
			}

		default:
			// Unknown type, skip
			return null
	}
}
```

---

## 6. API Hook

### 6.1 src/hooks/useComfyAPI.ts

```typescript
// src/hooks/useComfyAPI.ts
// Date: December 25, 2025
// Version: v1

import { useEffect, useCallback, useRef, useState } from 'react'
import { useQueueStore } from '@/stores/queueStore'
import { comfyAPI } from '@/lib/api/comfyClient'
import type { NodeDefinition, ComfyUIMessage } from '@/types/comfy'

interface UseComfyAPIReturn {
	connected: boolean
	connecting: boolean
	nodeDefinitions: Record<string, NodeDefinition>
	connect: () => void
	disconnect: () => void
	queuePrompt: (workflow: unknown) => Promise<string>
	interrupt: () => Promise<void>
	clearQueue: () => Promise<void>
}

export function useComfyAPI(): UseComfyAPIReturn {
	const [connected, setConnected] = useState(false)
	const [connecting, setConnecting] = useState(false)
	const [nodeDefinitions, setNodeDefinitions] = useState<Record<string, NodeDefinition>>({})

	const setProgress = useQueueStore((s) => s.setProgress)
	const setRunning = useQueueStore((s) => s.setRunning)
	const completeRunning = useQueueStore((s) => s.completeRunning)
	const failRunning = useQueueStore((s) => s.failRunning)

	const unsubscribeRef = useRef<(() => void)[]>([])

	const connect = useCallback(async () => {
		if (connected || connecting) return

		setConnecting(true)

		try {
			// Fetch node definitions
			const definitions = await comfyAPI.getNodeDefinitions()
			setNodeDefinitions(definitions)

			// Connect WebSocket
			comfyAPI.connect()

			// Subscribe to events
			const unsubs: (() => void)[] = []

			unsubs.push(
				comfyAPI.on('progress', (data: unknown) => {
					const msg = data as ComfyUIMessage
					if (msg.type === 'progress') {
						setProgress({
							nodeId: msg.data.node,
							nodeLabel: msg.data.node,
							value: msg.data.value,
							max: msg.data.max
						})
					}
				})
			)

			unsubs.push(
				comfyAPI.on('executing', (data: unknown) => {
					const msg = data as ComfyUIMessage
					if (msg.type === 'executing') {
						if (msg.data.node === null) {
							// Execution complete
							completeRunning()
							setProgress(null)
						}
					}
				})
			)

			unsubs.push(
				comfyAPI.on('execution_error', (data: unknown) => {
					const msg = data as ComfyUIMessage
					if (msg.type === 'execution_error') {
						failRunning(msg.data.exception_message)
						setProgress(null)
					}
				})
			)

			unsubscribeRef.current = unsubs
			setConnected(true)
		} catch (error) {
			console.error('[useComfyAPI] Failed to connect:', error)
		} finally {
			setConnecting(false)
		}
	}, [connected, connecting, setProgress, completeRunning, failRunning])

	const disconnect = useCallback(() => {
		unsubscribeRef.current.forEach((unsub) => unsub())
		unsubscribeRef.current = []
		comfyAPI.disconnect()
		setConnected(false)
	}, [])

	const queuePrompt = useCallback(async (workflow: unknown): Promise<string> => {
		const response = await comfyAPI.queuePrompt(workflow)
		return response.prompt_id
	}, [])

	const interrupt = useCallback(async () => {
		await comfyAPI.interrupt()
	}, [])

	const clearQueue = useCallback(async () => {
		await comfyAPI.cancelQueue()
	}, [])

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			disconnect()
		}
	}, [disconnect])

	return {
		connected,
		connecting,
		nodeDefinitions,
		connect,
		disconnect,
		queuePrompt,
		interrupt,
		clearQueue
	}
}
```

---

## 7. Workflow Hook

### 7.1 src/hooks/useWorkflow.ts

```typescript
// src/hooks/useWorkflow.ts
// Date: December 25, 2025
// Version: v1

import { useCallback } from 'react'
import { useGraphStore } from '@/stores/graphStore'
import { useQueueStore } from '@/stores/queueStore'
import { useComfyAPI } from './useComfyAPI'
import { graphToWorkflow, workflowToGraph } from '@/lib/utils/graphConverters'
import { useToast } from '@/components/ui/Toast'
import type { ComfyUIWorkflow } from '@/types/comfy'

interface UseWorkflowReturn {
	saveWorkflow: (filename?: string) => void
	loadWorkflow: (file: File) => Promise<void>
	exportWorkflow: () => ComfyUIWorkflow
	importWorkflow: (workflow: ComfyUIWorkflow) => void
	newWorkflow: () => void
	queueWorkflow: () => Promise<void>
}

export function useWorkflow(): UseWorkflowReturn {
	const nodes = useGraphStore((s) => s.nodes)
	const edges = useGraphStore((s) => s.edges)
	const addNode = useGraphStore((s) => s.addNode)
	const addEdge = useGraphStore((s) => s.addEdge)
	const deleteNodes = useGraphStore((s) => s.deleteNodes)
	const deleteEdges = useGraphStore((s) => s.deleteEdges)

	const addToQueue = useQueueStore((s) => s.addToQueue)
	const setRunning = useQueueStore((s) => s.setRunning)

	const { queuePrompt, nodeDefinitions } = useComfyAPI()
	const { addToast } = useToast()

	const exportWorkflow = useCallback((): ComfyUIWorkflow => {
		return graphToWorkflow(nodes, edges)
	}, [nodes, edges])

	const importWorkflow = useCallback(
		(workflow: ComfyUIWorkflow) => {
			// Clear existing graph
			const nodeIds = Array.from(nodes.keys())
			const edgeIds = Array.from(edges.keys())
			deleteNodes(nodeIds)
			deleteEdges(edgeIds)

			// Import new workflow
			const { nodes: newNodes, edges: newEdges } = workflowToGraph(
				workflow,
				nodeDefinitions
			)

			newNodes.forEach((node) => {
				addNode(node)
			})

			newEdges.forEach((edge) => {
				addEdge(edge)
			})

			addToast({
				type: 'success',
				message: `Imported ${newNodes.length} nodes`
			})
		},
		[nodes, edges, nodeDefinitions, deleteNodes, deleteEdges, addNode, addEdge, addToast]
	)

	const saveWorkflow = useCallback(
		(filename = 'workflow.json') => {
			const workflow = exportWorkflow()
			const blob = new Blob([JSON.stringify(workflow, null, 2)], {
				type: 'application/json'
			})
			const url = URL.createObjectURL(blob)
			const a = document.createElement('a')
			a.href = url
			a.download = filename
			a.click()
			URL.revokeObjectURL(url)

			addToast({
				type: 'success',
				message: `Saved workflow as ${filename}`
			})
		},
		[exportWorkflow, addToast]
	)

	const loadWorkflow = useCallback(
		async (file: File) => {
			try {
				const text = await file.text()
				const workflow = JSON.parse(text) as ComfyUIWorkflow
				importWorkflow(workflow)
			} catch (error) {
				addToast({
					type: 'error',
					message: 'Failed to load workflow: Invalid JSON'
				})
			}
		},
		[importWorkflow, addToast]
	)

	const newWorkflow = useCallback(() => {
		const nodeIds = Array.from(nodes.keys())
		const edgeIds = Array.from(edges.keys())
		deleteNodes(nodeIds)
		deleteEdges(edgeIds)

		addToast({
			type: 'info',
			message: 'Created new workflow'
		})
	}, [nodes, edges, deleteNodes, deleteEdges, addToast])

	const queueWorkflow = useCallback(async () => {
		try {
			const workflow = exportWorkflow()

			if (Object.keys(workflow).length === 0) {
				addToast({
					type: 'warning',
					message: 'No nodes to queue'
				})
				return
			}

			const promptId = await queuePrompt(workflow)

			const queueItem = {
				promptId,
				workflow,
				status: 'pending' as const
			}

			addToQueue(queueItem)
			setRunning({ ...queueItem, id: promptId, createdAt: Date.now() })

			addToast({
				type: 'success',
				message: 'Queued workflow for execution'
			})
		} catch (error) {
			addToast({
				type: 'error',
				message: 'Failed to queue workflow'
			})
		}
	}, [exportWorkflow, queuePrompt, addToQueue, setRunning, addToast])

	return {
		saveWorkflow,
		loadWorkflow,
		exportWorkflow,
		importWorkflow,
		newWorkflow,
		queueWorkflow
	}
}
```

---

## 8. Node Library

### 8.1 src/components/sidebar/NodeLibrary.tsx

```typescript
// src/components/sidebar/NodeLibrary.tsx
// Date: December 25, 2025
// Version: v1

'use client'

import { useState, useMemo, useCallback } from 'react'
import { Search, ChevronRight, ChevronDown, Plus } from 'lucide-react'
import { useComfyAPI } from '@/hooks/useComfyAPI'
import { useGraphStore } from '@/stores/graphStore'
import { nodeDefToGraphNode } from '@/lib/utils/graphConverters'
import { cn } from '@/lib/utils'
import type { NodeDefinition } from '@/types/comfy'

interface CategoryNode {
	name: string
	nodes: NodeDefinition[]
	subcategories: Map<string, CategoryNode>
}

export function NodeLibrary() {
	const [search, setSearch] = useState('')
	const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

	const { nodeDefinitions } = useComfyAPI()
	const addNode = useGraphStore((s) => s.addNode)
	const viewport = useGraphStore((s) => s.viewport)

	// Organize nodes by category
	const categoryTree = useMemo(() => {
		const root: CategoryNode = {
			name: 'root',
			nodes: [],
			subcategories: new Map()
		}

		Object.values(nodeDefinitions).forEach((nodeDef) => {
			const categoryPath = nodeDef.category.split('/')
			let current = root

			categoryPath.forEach((catName) => {
				if (!current.subcategories.has(catName)) {
					current.subcategories.set(catName, {
						name: catName,
						nodes: [],
						subcategories: new Map()
					})
				}
				current = current.subcategories.get(catName)!
			})

			current.nodes.push(nodeDef)
		})

		return root
	}, [nodeDefinitions])

	// Filter nodes by search
	const filteredNodes = useMemo(() => {
		if (!search.trim()) return null

		const searchLower = search.toLowerCase()
		return Object.values(nodeDefinitions).filter(
			(node) =>
				node.display_name.toLowerCase().includes(searchLower) ||
				node.name.toLowerCase().includes(searchLower) ||
				node.category.toLowerCase().includes(searchLower)
		)
	}, [nodeDefinitions, search])

	const toggleCategory = useCallback((path: string) => {
		setExpandedCategories((prev) => {
			const next = new Set(prev)
			if (next.has(path)) {
				next.delete(path)
			} else {
				next.add(path)
			}
			return next
		})
	}, [])

	const handleAddNode = useCallback(
		(nodeDef: NodeDefinition) => {
			// Add node at center of viewport
			const position = {
				x: -viewport.x + 400,
				y: -viewport.y + 300
			}

			const nodeData = nodeDefToGraphNode(nodeDef, position)
			addNode(nodeData)
		},
		[addNode, viewport]
	)

	const handleDragStart = useCallback(
		(e: React.DragEvent, nodeDef: NodeDefinition) => {
			e.dataTransfer.setData('application/comfyui-node', JSON.stringify(nodeDef))
			e.dataTransfer.effectAllowed = 'copy'
		},
		[]
	)

	const renderCategory = (category: CategoryNode, path: string = '') => {
		const fullPath = path ? `${path}/${category.name}` : category.name
		const isExpanded = expandedCategories.has(fullPath)

		const sortedSubcategories = Array.from(category.subcategories.values()).sort(
			(a, b) => a.name.localeCompare(b.name)
		)

		const sortedNodes = [...category.nodes].sort((a, b) =>
			a.display_name.localeCompare(b.display_name)
		)

		return (
			<div key={fullPath}>
				{category.name !== 'root' && (
					<button
						onClick={() => toggleCategory(fullPath)}
						className="flex items-center gap-1 w-full px-2 py-1.5 text-sm text-gray-300 hover:bg-gray-800 rounded"
					>
						{isExpanded ? (
							<ChevronDown size={14} />
						) : (
							<ChevronRight size={14} />
						)}
						<span className="font-medium">{category.name}</span>
						<span className="text-gray-500 text-xs ml-auto">
							{category.nodes.length + category.subcategories.size}
						</span>
					</button>
				)}

				{(category.name === 'root' || isExpanded) && (
					<div className={cn(category.name !== 'root' && 'ml-3 border-l border-gray-800 pl-2')}>
						{sortedSubcategories.map((subcat) => renderCategory(subcat, fullPath))}

						{sortedNodes.map((nodeDef) => (
							<div
								key={nodeDef.name}
								draggable
								onDragStart={(e) => handleDragStart(e, nodeDef)}
								onDoubleClick={() => handleAddNode(nodeDef)}
								className="flex items-center gap-2 px-2 py-1.5 text-sm text-gray-400 hover:bg-gray-800 hover:text-white rounded cursor-grab active:cursor-grabbing group"
							>
								<span className="truncate flex-1">{nodeDef.display_name}</span>
								<button
									onClick={(e) => {
										e.stopPropagation()
										handleAddNode(nodeDef)
									}}
									className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-gray-700 rounded"
								>
									<Plus size={14} />
								</button>
							</div>
						))}
					</div>
				)}
			</div>
		)
	}

	const renderSearchResults = () => {
		if (!filteredNodes) return null

		if (filteredNodes.length === 0) {
			return (
				<div className="px-4 py-8 text-center text-gray-500">
					No nodes found for "{search}"
				</div>
			)
		}

		return (
			<div className="space-y-1">
				{filteredNodes.map((nodeDef) => (
					<div
						key={nodeDef.name}
						draggable
						onDragStart={(e) => handleDragStart(e, nodeDef)}
						onDoubleClick={() => handleAddNode(nodeDef)}
						className="flex flex-col px-3 py-2 text-sm hover:bg-gray-800 rounded cursor-grab active:cursor-grabbing group"
					>
						<div className="flex items-center gap-2">
							<span className="text-white">{nodeDef.display_name}</span>
							<button
								onClick={(e) => {
									e.stopPropagation()
									handleAddNode(nodeDef)
								}}
								className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-gray-700 rounded ml-auto"
							>
								<Plus size={14} />
							</button>
						</div>
						<span className="text-xs text-gray-500">{nodeDef.category}</span>
					</div>
				))}
			</div>
		)
	}

	return (
		<div className="flex flex-col h-full">
			{/* Search */}
			<div className="p-3 border-b border-gray-800">
				<div className="relative">
					<Search
						size={16}
						className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
					/>
					<input
						type="text"
						placeholder="Search nodes..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
					/>
				</div>
			</div>

			{/* Node List */}
			<div className="flex-1 overflow-y-auto p-2">
				{filteredNodes ? renderSearchResults() : renderCategory(categoryTree)}
			</div>

			{/* Help Text */}
			<div className="p-3 border-t border-gray-800 text-xs text-gray-500">
				Double-click or drag to add nodes
			</div>
		</div>
	)
}
```

---

## 9. Custom Edge

### 9.1 src/components/graph/ComfyEdge.tsx

```typescript
// src/components/graph/ComfyEdge.tsx
// Date: December 25, 2025
// Version: v1

import { memo } from 'react'
import { EdgeProps, getBezierPath, EdgeLabelRenderer } from 'reactflow'

const typeColors: Record<string, string> = {
	MODEL: '#9b59b6',
	CLIP: '#f1c40f',
	VAE: '#e74c3c',
	CONDITIONING: '#e67e22',
	LATENT: '#ff69b4',
	IMAGE: '#3498db',
	MASK: '#2ecc71',
	CONTROL_NET: '#1abc9c',
	DEFAULT: '#6b7280'
}

export const ComfyEdge = memo(function ComfyEdge({
	id,
	sourceX,
	sourceY,
	targetX,
	targetY,
	sourcePosition,
	targetPosition,
	style = {},
	data,
	markerEnd,
	selected
}: EdgeProps) {
	const [edgePath, labelX, labelY] = getBezierPath({
		sourceX,
		sourceY,
		sourcePosition,
		targetX,
		targetY,
		targetPosition
	})

	const edgeType = data?.type || 'DEFAULT'
	const color = typeColors[edgeType] || typeColors.DEFAULT

	return (
		<>
			{/* Shadow for selected state */}
			{selected && (
				<path
					d={edgePath}
					fill="none"
					strokeWidth={6}
					stroke={color}
					strokeOpacity={0.3}
					className="react-flow__edge-path"
				/>
			)}

			{/* Main edge */}
			<path
				id={id}
				d={edgePath}
				fill="none"
				strokeWidth={selected ? 3 : 2}
				stroke={color}
				className="react-flow__edge-path"
				style={style}
				markerEnd={markerEnd}
			/>

			{/* Animated dash for running state */}
			{data?.animated && (
				<path
					d={edgePath}
					fill="none"
					strokeWidth={2}
					stroke={color}
					strokeDasharray="5,5"
					className="react-flow__edge-path animate-dash"
					style={{
						animation: 'dash 1s linear infinite'
					}}
				/>
			)}

			{/* Type label on hover */}
			{selected && data?.type && (
				<EdgeLabelRenderer>
					<div
						style={{
							position: 'absolute',
							transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
							pointerEvents: 'all'
						}}
						className="px-2 py-1 bg-gray-900 border border-gray-700 rounded text-xs text-gray-300"
					>
						{data.type}
					</div>
				</EdgeLabelRenderer>
			)}

			<style jsx global>{`
				@keyframes dash {
					to {
						stroke-dashoffset: -10;
					}
				}
			`}</style>
		</>
	)
})
```

---

## 10. Context Menu

### 10.1 src/components/graph/ContextMenu.tsx

```typescript
// src/components/graph/ContextMenu.tsx
// Date: December 25, 2025
// Version: v1

'use client'

import { useCallback, useEffect, useRef } from 'react'
import {
	Copy,
	Clipboard,
	Trash2,
	Scissors,
	RotateCcw,
	RotateCw,
	Maximize2
} from 'lucide-react'
import { useGraphStore } from '@/stores/graphStore'
import { cn } from '@/lib/utils'

interface ContextMenuProps {
	x: number
	y: number
	nodeId?: string
	onClose: () => void
}

interface MenuItem {
	label: string
	icon: React.ComponentType<{ size?: number }>
	action: () => void
	shortcut?: string
	disabled?: boolean
	divider?: boolean
}

export function ContextMenu({ x, y, nodeId, onClose }: ContextMenuProps) {
	const menuRef = useRef<HTMLDivElement>(null)

	const selectedNodeIds = useGraphStore((s) => s.selectedNodeIds)
	const copySelection = useGraphStore((s) => s.copySelection)
	const paste = useGraphStore((s) => s.paste)
	const deleteNodes = useGraphStore((s) => s.deleteNodes)
	const clipboard = useGraphStore((s) => s.clipboard)
	const undo = useGraphStore((s) => s.undo)
	const redo = useGraphStore((s) => s.redo)

	const hasSelection = selectedNodeIds.size > 0
	const hasClipboard = clipboard !== null

	const handleCopy = useCallback(() => {
		copySelection()
		onClose()
	}, [copySelection, onClose])

	const handleCut = useCallback(() => {
		copySelection()
		deleteNodes(Array.from(selectedNodeIds))
		onClose()
	}, [copySelection, deleteNodes, selectedNodeIds, onClose])

	const handlePaste = useCallback(() => {
		paste({ x, y })
		onClose()
	}, [paste, x, y, onClose])

	const handleDelete = useCallback(() => {
		if (nodeId) {
			deleteNodes([nodeId])
		} else {
			deleteNodes(Array.from(selectedNodeIds))
		}
		onClose()
	}, [deleteNodes, nodeId, selectedNodeIds, onClose])

	const handleUndo = useCallback(() => {
		undo()
		onClose()
	}, [undo, onClose])

	const handleRedo = useCallback(() => {
		redo()
		onClose()
	}, [redo, onClose])

	const menuItems: MenuItem[] = [
		{
			label: 'Cut',
			icon: Scissors,
			action: handleCut,
			shortcut: 'Ctrl+X',
			disabled: !hasSelection
		},
		{
			label: 'Copy',
			icon: Copy,
			action: handleCopy,
			shortcut: 'Ctrl+C',
			disabled: !hasSelection
		},
		{
			label: 'Paste',
			icon: Clipboard,
			action: handlePaste,
			shortcut: 'Ctrl+V',
			disabled: !hasClipboard
		},
		{
			label: 'Delete',
			icon: Trash2,
			action: handleDelete,
			shortcut: 'Del',
			disabled: !hasSelection && !nodeId,
			divider: true
		},
		{
			label: 'Undo',
			icon: RotateCcw,
			action: handleUndo,
			shortcut: 'Ctrl+Z'
		},
		{
			label: 'Redo',
			icon: RotateCw,
			action: handleRedo,
			shortcut: 'Ctrl+Shift+Z',
			divider: true
		},
		{
			label: 'Fit View',
			icon: Maximize2,
			action: () => {
				// This will be handled by React Flow
				onClose()
			},
			shortcut: 'F'
		}
	]

	// Close on click outside
	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
				onClose()
			}
		}

		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				onClose()
			}
		}

		document.addEventListener('mousedown', handleClickOutside)
		document.addEventListener('keydown', handleEscape)

		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
			document.removeEventListener('keydown', handleEscape)
		}
	}, [onClose])

	// Adjust position to stay in viewport
	const adjustedPosition = {
		x: Math.min(x, window.innerWidth - 200),
		y: Math.min(y, window.innerHeight - 300)
	}

	return (
		<div
			ref={menuRef}
			className="fixed z-50 min-w-[180px] bg-gray-900 border border-gray-700 rounded-lg shadow-xl py-1 overflow-hidden"
			style={{
				left: adjustedPosition.x,
				top: adjustedPosition.y
			}}
		>
			{menuItems.map((item, index) => (
				<div key={item.label}>
					{item.divider && index > 0 && (
						<div className="my-1 border-t border-gray-700" />
					)}
					<button
						onClick={item.action}
						disabled={item.disabled}
						className={cn(
							'flex items-center gap-3 w-full px-3 py-2 text-sm text-left',
							item.disabled
								? 'text-gray-600 cursor-not-allowed'
								: 'text-gray-300 hover:bg-gray-800 hover:text-white'
						)}
					>
						<item.icon size={16} />
						<span className="flex-1">{item.label}</span>
						{item.shortcut && (
							<span className="text-xs text-gray-500">{item.shortcut}</span>
						)}
					</button>
				</div>
			))}
		</div>
	)
}
```

---

## 11. Queue Controls

### 11.1 src/components/queue/QueueControls.tsx

```typescript
// src/components/queue/QueueControls.tsx
// Date: December 25, 2025
// Version: v1

'use client'

import { useCallback } from 'react'
import { Play, Square, ListOrdered, Loader2 } from 'lucide-react'
import { useWorkflow } from '@/hooks/useWorkflow'
import { useComfyAPI } from '@/hooks/useComfyAPI'
import { useQueueStore } from '@/stores/queueStore'
import { useUIStore } from '@/stores/uiStore'
import { cn } from '@/lib/utils'

export function QueueControls() {
	const { queueWorkflow } = useWorkflow()
	const { interrupt, connected } = useComfyAPI()

	const running = useQueueStore((s) => s.running)
	const pending = useQueueStore((s) => s.pending)
	const progress = useQueueStore((s) => s.progress)

	const toggleQueuePanel = useUIStore((s) => s.toggleQueuePanel)
	const queuePanelOpen = useUIStore((s) => s.queuePanelOpen)

	const isRunning = running !== null
	const pendingCount = pending.length

	const handleQueue = useCallback(async () => {
		await queueWorkflow()
	}, [queueWorkflow])

	const handleInterrupt = useCallback(async () => {
		await interrupt()
	}, [interrupt])

	return (
		<div className="flex items-center gap-2 bg-gray-900/90 backdrop-blur-sm rounded-lg p-2 border border-gray-700">
			{/* Queue Button */}
			<button
				onClick={handleQueue}
				disabled={!connected || isRunning}
				className={cn(
					'flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors',
					connected && !isRunning
						? 'bg-cyan-600 hover:bg-cyan-500 text-white'
						: 'bg-gray-700 text-gray-400 cursor-not-allowed'
				)}
			>
				{isRunning ? (
					<>
						<Loader2 size={16} className="animate-spin" />
						<span>Running...</span>
					</>
				) : (
					<>
						<Play size={16} />
						<span>Queue Prompt</span>
					</>
				)}
			</button>

			{/* Interrupt Button */}
			{isRunning && (
				<button
					onClick={handleInterrupt}
					className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium text-sm transition-colors"
				>
					<Square size={16} />
					<span>Stop</span>
				</button>
			)}

			{/* Progress */}
			{progress && (
				<div className="flex items-center gap-2 px-3">
					<div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
						<div
							className="h-full bg-cyan-500 transition-all duration-200"
							style={{ width: `${(progress.value / progress.max) * 100}%` }}
						/>
					</div>
					<span className="text-xs text-gray-400">
						{progress.value}/{progress.max}
					</span>
				</div>
			)}

			{/* Queue Panel Toggle */}
			<button
				onClick={toggleQueuePanel}
				className={cn(
					'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
					queuePanelOpen
						? 'bg-gray-700 text-white'
						: 'text-gray-400 hover:text-white hover:bg-gray-800'
				)}
			>
				<ListOrdered size={16} />
				{pendingCount > 0 && (
					<span className="bg-cyan-600 text-white text-xs px-1.5 py-0.5 rounded-full">
						{pendingCount}
					</span>
				)}
			</button>

			{/* Connection Status */}
			<div className="flex items-center gap-1.5 px-2">
				<div
					className={cn(
						'w-2 h-2 rounded-full',
						connected ? 'bg-green-500' : 'bg-red-500'
					)}
				/>
				<span className="text-xs text-gray-500">
					{connected ? 'Connected' : 'Disconnected'}
				</span>
			</div>
		</div>
	)
}
```

---

## 12. Queue Panel

### 12.1 src/components/queue/QueuePanel.tsx

```typescript
// src/components/queue/QueuePanel.tsx
// Date: December 25, 2025
// Version: v1

'use client'

import { useCallback } from 'react'
import { X, Trash2, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { useQueueStore } from '@/stores/queueStore'
import { useUIStore } from '@/stores/uiStore'
import { cn } from '@/lib/utils'
import type { QueueItem } from '@/types/queue'

function formatTime(timestamp: number): string {
	return new Date(timestamp).toLocaleTimeString()
}

function QueueItemCard({ item }: { item: QueueItem }) {
	const removeFromQueue = useQueueStore((s) => s.removeFromQueue)

	const statusIcon = {
		pending: <Clock size={14} className="text-yellow-500" />,
		running: <Loader2 size={14} className="text-cyan-500 animate-spin" />,
		completed: <CheckCircle size={14} className="text-green-500" />,
		failed: <XCircle size={14} className="text-red-500" />
	}

	const statusColor = {
		pending: 'border-yellow-500/30',
		running: 'border-cyan-500/30',
		completed: 'border-green-500/30',
		failed: 'border-red-500/30'
	}

	return (
		<div
			className={cn(
				'p-3 bg-gray-800 rounded-lg border-l-2',
				statusColor[item.status]
			)}
		>
			<div className="flex items-center gap-2">
				{statusIcon[item.status]}
				<span className="text-sm text-white font-medium flex-1 truncate">
					{item.promptId}
				</span>
				{item.status === 'pending' && (
					<button
						onClick={() => removeFromQueue(item.id)}
						className="p-1 text-gray-500 hover:text-red-400 hover:bg-gray-700 rounded"
					>
						<X size={14} />
					</button>
				)}
			</div>

			<div className="mt-1 text-xs text-gray-500">
				{formatTime(item.createdAt)}
				{item.completedAt && ` • Completed ${formatTime(item.completedAt)}`}
			</div>

			{item.error && (
				<div className="mt-2 p-2 bg-red-900/30 rounded text-xs text-red-300">
					{item.error}
				</div>
			)}
		</div>
	)
}

export function QueuePanel() {
	const pending = useQueueStore((s) => s.pending)
	const running = useQueueStore((s) => s.running)
	const history = useQueueStore((s) => s.history)
	const clearHistory = useQueueStore((s) => s.clearHistory)
	const toggleQueuePanel = useUIStore((s) => s.toggleQueuePanel)

	return (
		<div className="flex flex-col h-full bg-gray-900">
			{/* Header */}
			<div className="flex items-center justify-between p-3 border-b border-gray-800">
				<h2 className="font-semibold text-white">Queue</h2>
				<button
					onClick={toggleQueuePanel}
					className="p-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded"
				>
					<X size={18} />
				</button>
			</div>

			{/* Content */}
			<div className="flex-1 overflow-y-auto">
				{/* Running */}
				{running && (
					<div className="p-3 border-b border-gray-800">
						<h3 className="text-xs font-medium text-gray-500 uppercase mb-2">
							Running
						</h3>
						<QueueItemCard item={running} />
					</div>
				)}

				{/* Pending */}
				{pending.length > 0 && (
					<div className="p-3 border-b border-gray-800">
						<h3 className="text-xs font-medium text-gray-500 uppercase mb-2">
							Pending ({pending.length})
						</h3>
						<div className="space-y-2">
							{pending.map((item) => (
								<QueueItemCard key={item.id} item={item} />
							))}
						</div>
					</div>
				)}

				{/* History */}
				<div className="p-3">
					<div className="flex items-center justify-between mb-2">
						<h3 className="text-xs font-medium text-gray-500 uppercase">
							History ({history.length})
						</h3>
						{history.length > 0 && (
							<button
								onClick={clearHistory}
								className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-400"
							>
								<Trash2 size={12} />
								Clear
							</button>
						)}
					</div>
					{history.length === 0 ? (
						<div className="text-sm text-gray-500 text-center py-4">
							No history yet
						</div>
					) : (
						<div className="space-y-2">
							{history.slice(0, 20).map((item) => (
								<QueueItemCard key={item.id} item={item} />
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	)
}
```

---

## 13. Image Widget

### 13.1 src/components/nodes/ImageWidget.tsx

```typescript
// src/components/nodes/ImageWidget.tsx
// Date: December 25, 2025
// Version: v1

'use client'

import { useState, useCallback } from 'react'
import { Maximize2, Download, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImageWidgetProps {
	src: string
	alt?: string
	className?: string
}

export function ImageWidget({ src, alt = 'Output image', className }: ImageWidgetProps) {
	const [isFullscreen, setIsFullscreen] = useState(false)
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState(false)

	const handleLoad = useCallback(() => {
		setIsLoading(false)
	}, [])

	const handleError = useCallback(() => {
		setIsLoading(false)
		setError(true)
	}, [])

	const handleDownload = useCallback(() => {
		const link = document.createElement('a')
		link.href = src
		link.download = `comfyui-output-${Date.now()}.png`
		link.click()
	}, [src])

	if (error) {
		return (
			<div
				className={cn(
					'flex items-center justify-center bg-gray-800 rounded text-gray-500 text-sm',
					className
				)}
			>
				Failed to load image
			</div>
		)
	}

	return (
		<>
			{/* Thumbnail */}
			<div className={cn('relative group', className)}>
				{isLoading && (
					<div className="absolute inset-0 flex items-center justify-center bg-gray-800 rounded">
						<div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
					</div>
				)}

				<img
					src={src}
					alt={alt}
					onLoad={handleLoad}
					onError={handleError}
					className={cn(
						'w-full h-auto rounded cursor-pointer transition-opacity',
						isLoading ? 'opacity-0' : 'opacity-100'
					)}
					onClick={() => setIsFullscreen(true)}
				/>

				{/* Overlay buttons */}
				<div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
					<button
						onClick={() => setIsFullscreen(true)}
						className="p-1 bg-gray-900/80 hover:bg-gray-800 rounded text-white"
					>
						<Maximize2 size={14} />
					</button>
					<button
						onClick={handleDownload}
						className="p-1 bg-gray-900/80 hover:bg-gray-800 rounded text-white"
					>
						<Download size={14} />
					</button>
				</div>
			</div>

			{/* Fullscreen Modal */}
			{isFullscreen && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
					onClick={() => setIsFullscreen(false)}
				>
					<button
						className="absolute top-4 right-4 p-2 bg-gray-800 hover:bg-gray-700 rounded-full text-white"
						onClick={() => setIsFullscreen(false)}
					>
						<X size={24} />
					</button>

					<button
						className="absolute bottom-4 right-4 flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white"
						onClick={(e) => {
							e.stopPropagation()
							handleDownload()
						}}
					>
						<Download size={18} />
						Download
					</button>

					<img
						src={src}
						alt={alt}
						className="max-w-[90vw] max-h-[90vh] object-contain"
						onClick={(e) => e.stopPropagation()}
					/>
				</div>
			)}
		</>
	)
}
```

---

## 14. Toast Notifications

### 14.1 src/components/ui/Toast.tsx

```typescript
// src/components/ui/Toast.tsx
// Date: December 25, 2025
// Version: v1

'use client'

import {
	createContext,
	useContext,
	useState,
	useCallback,
	useEffect,
	ReactNode
} from 'react'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
	id: string
	type: ToastType
	message: string
	duration?: number
}

interface ToastContextValue {
	toasts: Toast[]
	addToast: (toast: Omit<Toast, 'id'>) => void
	removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
	const context = useContext(ToastContext)
	if (!context) {
		// Return a no-op if not in provider (for SSR safety)
		return {
			toasts: [],
			addToast: () => {},
			removeToast: () => {}
		}
	}
	return context
}

export function ToastProvider({ children }: { children: ReactNode }) {
	const [toasts, setToasts] = useState<Toast[]>([])

	const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
		const id = Math.random().toString(36).substring(2, 9)
		setToasts((prev) => [...prev, { ...toast, id }])
	}, [])

	const removeToast = useCallback((id: string) => {
		setToasts((prev) => prev.filter((t) => t.id !== id))
	}, [])

	return (
		<ToastContext.Provider value={{ toasts, addToast, removeToast }}>
			{children}
		</ToastContext.Provider>
	)
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
	useEffect(() => {
		const duration = toast.duration ?? 5000
		const timer = setTimeout(onRemove, duration)
		return () => clearTimeout(timer)
	}, [toast.duration, onRemove])

	const icons = {
		success: <CheckCircle size={18} className="text-green-400" />,
		error: <AlertCircle size={18} className="text-red-400" />,
		warning: <AlertTriangle size={18} className="text-yellow-400" />,
		info: <Info size={18} className="text-cyan-400" />
	}

	const colors = {
		success: 'border-green-500/30 bg-green-500/10',
		error: 'border-red-500/30 bg-red-500/10',
		warning: 'border-yellow-500/30 bg-yellow-500/10',
		info: 'border-cyan-500/30 bg-cyan-500/10'
	}

	return (
		<div
			className={cn(
				'flex items-start gap-3 p-4 bg-gray-900 border rounded-lg shadow-lg min-w-[300px] max-w-[400px]',
				colors[toast.type]
			)}
		>
			{icons[toast.type]}
			<p className="flex-1 text-sm text-white">{toast.message}</p>
			<button
				onClick={onRemove}
				className="p-1 text-gray-500 hover:text-white hover:bg-gray-800 rounded"
			>
				<X size={14} />
			</button>
		</div>
	)
}

export function ToastContainer() {
	const { toasts, removeToast } = useToast()

	if (toasts.length === 0) return null

	return (
		<div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
			{toasts.map((toast) => (
				<ToastItem
					key={toast.id}
					toast={toast}
					onRemove={() => removeToast(toast.id)}
				/>
			))}
		</div>
	)
}
```

---

## 15. Final Integration

### 15.1 Update src/app/layout.tsx

Add the ToastProvider:

```typescript
// src/app/layout.tsx
// Date: December 25, 2025
// Version: v2

import type { Metadata } from 'next'
import { ToastProvider } from '@/components/ui/Toast'
import './globals.css'

export const metadata: Metadata = {
	title: 'ComfyUI',
	description: 'ComfyUI - Node-based Stable Diffusion Interface'
}

export default function RootLayout({
	children
}: {
	children: React.ReactNode
}) {
	return (
		<html lang="en" className="dark">
			<body className="min-h-screen bg-comfy-bg text-comfy-text antialiased">
				<ToastProvider>{children}</ToastProvider>
			</body>
		</html>
	)
}
```

### 15.2 Update src/components/graph/GraphCanvas.tsx

Add context menu and drag-drop support:

```typescript
// src/components/graph/GraphCanvas.tsx
// Date: December 25, 2025
// Version: v2

'use client'

import { useCallback, useMemo, useState, useRef } from 'react'
import ReactFlow, {
	Background,
	Controls,
	MiniMap,
	Panel,
	Connection,
	NodeTypes,
	EdgeTypes,
	useReactFlow
} from 'reactflow'
import 'reactflow/dist/style.css'

import { useGraphStore } from '@/stores/graphStore'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { ComfyNode } from '@/components/nodes/ComfyNode'
import { ComfyEdge } from '@/components/graph/ComfyEdge'
import { ContextMenu } from '@/components/graph/ContextMenu'
import { QueueControls } from '@/components/queue/QueueControls'
import { nodeToReactFlowNode, edgeToReactFlowEdge, nodeDefToGraphNode } from '@/lib/utils/graphConverters'
import type { NodeDefinition } from '@/types/comfy'

const nodeTypes: NodeTypes = {
	comfyNode: ComfyNode
}

const edgeTypes: EdgeTypes = {
	comfyEdge: ComfyEdge
}

export function GraphCanvas() {
	const reactFlowWrapper = useRef<HTMLDivElement>(null)
	const [contextMenu, setContextMenu] = useState<{
		x: number
		y: number
		nodeId?: string
	} | null>(null)

	const { nodes, edges, addEdge: addGraphEdge, addNode, selectNodes, viewport } = useGraphStore()
	const { project } = useReactFlow()

	useKeyboardShortcuts()

	const reactFlowNodes = useMemo(
		() => Array.from(nodes.values()).map(nodeToReactFlowNode),
		[nodes]
	)

	const reactFlowEdges = useMemo(
		() => Array.from(edges.values()).map(edgeToReactFlowEdge),
		[edges]
	)

	const onConnect = useCallback(
		(connection: Connection) => {
			if (connection.source && connection.target) {
				addGraphEdge({
					source: connection.source,
					sourceHandle: connection.sourceHandle ?? 'default',
					target: connection.target,
					targetHandle: connection.targetHandle ?? 'default',
					animated: false
				})
			}
		},
		[addGraphEdge]
	)

	const onSelectionChange = useCallback(
		({ nodes: selectedNodes }: { nodes: any[] }) => {
			selectNodes(selectedNodes.map((n) => n.id))
		},
		[selectNodes]
	)

	const onContextMenu = useCallback(
		(event: React.MouseEvent) => {
			event.preventDefault()
			setContextMenu({
				x: event.clientX,
				y: event.clientY
			})
		},
		[]
	)

	const onNodeContextMenu = useCallback(
		(event: React.MouseEvent, node: any) => {
			event.preventDefault()
			setContextMenu({
				x: event.clientX,
				y: event.clientY,
				nodeId: node.id
			})
		},
		[]
	)

	const onDragOver = useCallback((event: React.DragEvent) => {
		event.preventDefault()
		event.dataTransfer.dropEffect = 'copy'
	}, [])

	const onDrop = useCallback(
		(event: React.DragEvent) => {
			event.preventDefault()

			const data = event.dataTransfer.getData('application/comfyui-node')
			if (!data) return

			const nodeDef = JSON.parse(data) as NodeDefinition

			// Get drop position relative to React Flow
			const bounds = reactFlowWrapper.current?.getBoundingClientRect()
			if (!bounds) return

			const position = project({
				x: event.clientX - bounds.left,
				y: event.clientY - bounds.top
			})

			const nodeData = nodeDefToGraphNode(nodeDef, position)
			addNode(nodeData)
		},
		[project, addNode]
	)

	return (
		<div ref={reactFlowWrapper} className="h-full w-full bg-gray-950">
			<ReactFlow
				nodes={reactFlowNodes}
				edges={reactFlowEdges}
				nodeTypes={nodeTypes}
				edgeTypes={edgeTypes}
				onConnect={onConnect}
				onSelectionChange={onSelectionChange}
				onContextMenu={onContextMenu}
				onNodeContextMenu={onNodeContextMenu}
				onDragOver={onDragOver}
				onDrop={onDrop}
				defaultViewport={viewport}
				fitView
				attributionPosition="bottom-left"
				className="comfyui-graph"
			>
				<Background variant="dots" gap={16} size={1} color="#374151" />
				<Controls className="bg-gray-800 border-gray-700" />
				<MiniMap
					nodeStrokeWidth={3}
					zoomable
					pannable
					className="bg-gray-900 border-gray-700"
				/>
				<Panel position="top-right">
					<QueueControls />
				</Panel>
			</ReactFlow>

			{/* Context Menu */}
			{contextMenu && (
				<ContextMenu
					x={contextMenu.x}
					y={contextMenu.y}
					nodeId={contextMenu.nodeId}
					onClose={() => setContextMenu(null)}
				/>
			)}
		</div>
	)
}
```

---

## Implementation Order

Execute in this order:

1. Configuration files (Section 2)
2. Type definitions (Section 3)
3. Globals CSS (Section 4.1)
4. Layout and page (Section 4.2, 4.3)
5. Toast component (Section 14)
6. Graph converters (Section 5)
7. API hook (Section 6)
8. Workflow hook (Section 7)
9. Custom edge (Section 9)
10. Context menu (Section 10)
11. Node library (Section 8)
12. Queue controls (Section 11)
13. Queue panel (Section 12)
14. Image widget (Section 13)
15. Final integration (Section 15)

---

## Testing Checklist

After implementation, verify:

- [ ] App loads without errors
- [ ] Can connect to ComfyUI backend
- [ ] Node library shows all available nodes
- [ ] Can add nodes by drag-drop
- [ ] Can add nodes by double-click
- [ ] Can connect nodes with edges
- [ ] Can delete nodes with Delete key
- [ ] Context menu works on right-click
- [ ] Can queue workflow for execution
- [ ] Progress shows during execution
- [ ] Can interrupt running workflow
- [ ] Toast notifications appear
- [ ] Can save workflow to JSON
- [ ] Can load workflow from JSON

---

**Version**: v1  
**Last Updated**: December 25, 2025
