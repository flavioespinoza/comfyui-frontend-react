// src/types/graph.ts
// Date: December 25, 2025
// Version: v1

export interface GraphNode {
	id: string
	type: string
	position: { x: number; y: number }
	data: ComfyNodeData
	selected?: boolean
	dragging?: boolean
	width?: number
	height?: number
}

export interface ComfyNodeData {
	label: string
	type: string
	widgets: WidgetConfig[]
	inputs: NodeInput[]
	outputs: NodeOutput[]
}

export interface NodeInput {
	id: string
	label: string
	type: string
	required?: boolean
}

export interface NodeOutput {
	id: string
	label: string
	type: string
}

export interface WidgetConfig {
	id: string
	label: string
	type: WidgetType
	value: unknown
	options?: string[]
	min?: number
	max?: number
	step?: number
}

export type WidgetType =
	| 'number'
	| 'text'
	| 'textarea'
	| 'select'
	| 'slider'
	| 'checkbox'
	| 'toggle'
	| 'color'
	| 'image'
	| 'combo'

export interface WidgetOptions {
	min?: number
	max?: number
	step?: number
	choices?: string[]
	placeholder?: string
	multiline?: boolean
}

export interface GraphEdge {
	id: string
	source: string
	sourceHandle: string
	target: string
	targetHandle: string
	type?: string
	animated?: boolean
	data?: {
		type?: string
	}
}

export interface GraphSnapshot {
	nodes: Map<string, GraphNode>
	edges: Map<string, GraphEdge>
}

export interface Viewport {
	x: number
	y: number
	zoom: number
}

export interface Clipboard {
	nodes: GraphNode[]
	edges: GraphEdge[]
}
