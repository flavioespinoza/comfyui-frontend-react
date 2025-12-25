// src/components/graph/ComfyEdge.tsx
// Date: December 25, 2025
// Version: v1

'use client'

import { memo } from 'react'
import { BaseEdge, EdgeProps, getBezierPath, EdgeLabelRenderer } from 'reactflow'

// Color mapping for different data types (matching ComfyNode)
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

interface ComfyEdgeData {
	label?: string
	color?: string
	sourceType?: string
}

function ComfyEdgeComponent({
	sourceX,
	sourceY,
	targetX,
	targetY,
	sourcePosition,
	targetPosition,
	style = {},
	markerEnd,
	data,
	selected
}: EdgeProps<ComfyEdgeData>) {
	const [edgePath, labelX, labelY] = getBezierPath({
		sourceX,
		sourceY,
		sourcePosition,
		targetX,
		targetY,
		targetPosition
	})

	// Use type-based color or fallback
	const edgeColor = data?.color || (data?.sourceType ? TYPE_COLORS[data.sourceType] : null) || TYPE_COLORS.DEFAULT

	return (
		<>
			<BaseEdge
				path={edgePath}
				markerEnd={markerEnd}
				style={{
					...style,
					stroke: edgeColor,
					strokeWidth: selected ? 3 : 2,
					opacity: selected ? 1 : 0.8
				}}
			/>
			{data?.label && (
				<EdgeLabelRenderer>
					<div
						style={{
							position: 'absolute',
							transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
							fontSize: 12,
							pointerEvents: 'all'
						}}
						className="bg-comfy-surface px-2 py-1 rounded text-xs border border-comfy-border text-comfy-text"
					>
						{data.label}
					</div>
				</EdgeLabelRenderer>
			)}
		</>
	)
}

export const ComfyEdge = memo(ComfyEdgeComponent)
