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

		const { inputs: inputDefs } = parseNodeDefinition(nodeDef)
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
					type: inputDef ? getInputType(inputDef) : 'UNKNOWN',
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
				const inputType = getInputType(def)
				const isConnectionType = ['MODEL', 'CLIP', 'VAE', 'CONDITIONING', 'LATENT', 'IMAGE', 'MASK'].includes(inputType)

				if (isConnectionType) {
					nodeInputs.push({
						id: name,
						label: name,
						type: inputType,
						required: false
					})
				} else {
					const config = getInputConfig(def)
					const widget = createWidgetFromDefinition(name, def, config?.default)
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
	const { inputs } = parseNodeDefinition(nodeDef)

	const nodeInputs: NodeInput[] = []
	const nodeWidgets: WidgetConfig[] = []

	inputs.forEach((def, name) => {
		const inputType = getInputType(def)
		const isConnectionType = ['MODEL', 'CLIP', 'VAE', 'CONDITIONING', 'LATENT', 'IMAGE', 'MASK', 'CONTROL_NET'].includes(inputType)

		if (isConnectionType) {
			nodeInputs.push({
				id: name,
				label: name,
				type: inputType,
				required: nodeDef.input.required?.[name] !== undefined
			})
		} else {
			const config = getInputConfig(def)
			const widget = createWidgetFromDefinition(name, def, config?.default)
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
 * Get the type from an input definition
 */
function getInputType(def: InputDefinition): string {
	if (Array.isArray(def)) {
		if (Array.isArray(def[0])) {
			// It's a combo/select with string array
			return 'COMBO'
		}
		return def[0] as string
	}
	return 'UNKNOWN'
}

/**
 * Get InputConfig from an input definition if it exists
 */
function getInputConfig(def: InputDefinition): { default?: unknown; min?: number; max?: number; step?: number; multiline?: boolean } | undefined {
	if (Array.isArray(def) && def.length > 1 && typeof def[1] === 'object' && !Array.isArray(def[1])) {
		return def[1] as { default?: unknown; min?: number; max?: number; step?: number; multiline?: boolean }
	}
	return undefined
}

/**
 * Create a widget configuration from a node definition input
 */
function createWidgetFromDefinition(
	name: string,
	def: InputDefinition,
	value?: unknown
): WidgetConfig | null {
	// Handle combo/select inputs (array of strings)
	if (Array.isArray(def) && Array.isArray(def[0])) {
		const options = def[0] as string[]
		return {
			id: name,
			label: name,
			type: 'select',
			value: value ?? options[0],
			options: options
		}
	}

	if (!Array.isArray(def)) {
		return null
	}

	const [inputType, config] = def as [string, Record<string, unknown>?]

	switch (inputType) {
		case 'INT':
			return {
				id: name,
				label: name,
				type: 'number',
				value: value ?? config?.default ?? 0,
				min: config?.min as number | undefined,
				max: config?.max as number | undefined,
				step: (config?.step as number) ?? 1
			}

		case 'FLOAT':
			return {
				id: name,
				label: name,
				type: 'slider',
				value: value ?? config?.default ?? 0,
				min: (config?.min as number) ?? 0,
				max: (config?.max as number) ?? 1,
				step: (config?.step as number) ?? 0.01
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

// Legacy exports for compatibility
export const toReactFlowNode = nodeToReactFlowNode
export const toReactFlowEdge = edgeToReactFlowEdge
