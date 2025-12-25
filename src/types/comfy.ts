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

export type InputDefinition = [string, InputConfig?] | string[]

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
