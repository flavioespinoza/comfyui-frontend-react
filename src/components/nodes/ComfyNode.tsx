// src/components/nodes/ComfyNode.tsx
// Date: December 25, 2025
// Version: v1

'use client'

import { memo, useCallback } from 'react'
import { Handle, Position, type NodeProps } from 'reactflow'
import { useGraphStore } from '@/stores/graphStore'
import { WidgetRenderer } from './WidgetRenderer'
import type { ComfyNodeData } from '@/types/graph'

// Color mapping for different data types
const TYPE_COLORS: Record<string, string> = {
	MODEL: '#8b5cf6',
	CLIP: '#f59e0b',
	VAE: '#ef4444',
	CONDITIONING: '#f97316',
	LATENT: '#ec4899',
	IMAGE: '#3b82f6',
	MASK: '#22c55e',
	CONTROL_NET: '#06b6d4',
	DEFAULT: '#6b7280'
}

function getTypeColor(type: string): string {
	return TYPE_COLORS[type] || TYPE_COLORS.DEFAULT
}

function ComfyNodeComponent({ id, data, selected }: NodeProps<ComfyNodeData>) {
	const { updateNode } = useGraphStore()

	const handleWidgetChange = useCallback(
		(widgetId: string, value: unknown) => {
			updateNode(id, {
				data: {
					...data,
					widgets: data.widgets.map((w) =>
						w.id === widgetId ? { ...w, value } : w
					)
				}
			})
		},
		[id, data, updateNode]
	)

	return (
		<div
			className={`
				min-w-[220px] rounded-lg border bg-comfy-surface shadow-xl
				${selected ? 'ring-2 ring-comfy-accent border-comfy-accent' : 'border-comfy-border'}
			`}
		>
			{/* Header */}
			<div className="px-3 py-2 border-b border-comfy-border bg-comfy-bg/50 rounded-t-lg">
				<h3 className="font-medium text-sm text-comfy-text truncate">
					{data.label}
				</h3>
				<span className="text-xs text-comfy-muted">{data.type}</span>
			</div>

			{/* Content */}
			<div className="p-2 space-y-1">
				{/* Inputs */}
				{data.inputs.map((input) => (
					<div key={input.id} className="relative flex items-center py-1">
						<Handle
							type="target"
							position={Position.Left}
							id={input.id}
							style={{
								background: getTypeColor(input.type),
								width: 12,
								height: 12,
								left: -6,
								border: '2px solid var(--comfy-surface)'
							}}
						/>
						<span className="text-xs text-comfy-muted pl-3">
							{input.label}
							{input.required && <span className="text-comfy-accent ml-1">*</span>}
						</span>
					</div>
				))}

				{/* Widgets */}
				{data.widgets.length > 0 && (
					<div className="space-y-2 py-2 border-t border-comfy-border mt-2">
						{data.widgets.map((widget) => (
							<WidgetRenderer
								key={widget.id}
								widget={widget}
								onChange={(value) => handleWidgetChange(widget.id, value)}
							/>
						))}
					</div>
				)}

				{/* Outputs */}
				{data.outputs.map((output) => (
					<div key={output.id} className="relative flex items-center justify-end py-1">
						<span className="text-xs text-comfy-muted pr-3">
							{output.label}
						</span>
						<Handle
							type="source"
							position={Position.Right}
							id={output.id}
							style={{
								background: getTypeColor(output.type),
								width: 12,
								height: 12,
								right: -6,
								border: '2px solid var(--comfy-surface)'
							}}
						/>
					</div>
				))}
			</div>
		</div>
	)
}

export const ComfyNode = memo(ComfyNodeComponent)
