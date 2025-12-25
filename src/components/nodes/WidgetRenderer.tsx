// src/components/nodes/WidgetRenderer.tsx
// Date: December 25, 2025
// Version: v1

'use client'

import { memo } from 'react'
import type { WidgetConfig } from '@/types/graph'

interface WidgetRendererProps {
	widget: WidgetConfig
	onChange: (value: unknown) => void
}

const inputBaseClass = `
	w-full px-2 py-1.5 text-sm rounded border
	bg-comfy-bg border-comfy-border text-comfy-text
	focus:outline-none focus:ring-1 focus:ring-comfy-accent focus:border-comfy-accent
	placeholder:text-comfy-muted
`

function WidgetRendererComponent({ widget, onChange }: WidgetRendererProps) {
	const { id, label, type, value, options, min, max, step } = widget

	switch (type) {
		case 'number':
			return (
				<div className="space-y-1">
					<label className="text-xs text-comfy-muted">{label}</label>
					<input
						type="number"
						value={value as number}
						min={min}
						max={max}
						step={step || 1}
						onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
						className={inputBaseClass}
					/>
				</div>
			)

		case 'text':
			return (
				<div className="space-y-1">
					<label className="text-xs text-comfy-muted">{label}</label>
					<input
						type="text"
						value={value as string}
						onChange={(e) => onChange(e.target.value)}
						className={inputBaseClass}
					/>
				</div>
			)

		case 'textarea':
			return (
				<div className="space-y-1">
					<label className="text-xs text-comfy-muted">{label}</label>
					<textarea
						value={value as string}
						onChange={(e) => onChange(e.target.value)}
						rows={3}
						className={`${inputBaseClass} resize-y min-h-[60px]`}
					/>
				</div>
			)

		case 'select':
		case 'combo':
			return (
				<div className="space-y-1">
					<label className="text-xs text-comfy-muted">{label}</label>
					<select
						value={value as string}
						onChange={(e) => onChange(e.target.value)}
						className={`${inputBaseClass} cursor-pointer`}
					>
						{options?.map((choice) => (
							<option key={choice} value={choice}>
								{choice}
							</option>
						))}
					</select>
				</div>
			)

		case 'slider':
			const numValue = value as number
			const minVal = min ?? 0
			const maxVal = max ?? 1
			const percentage = ((numValue - minVal) / (maxVal - minVal)) * 100

			return (
				<div className="space-y-1">
					<div className="flex justify-between items-center">
						<label className="text-xs text-comfy-muted">{label}</label>
						<span className="text-xs text-comfy-text font-mono">
							{typeof numValue === 'number' ? numValue.toFixed(2) : numValue}
						</span>
					</div>
					<div className="relative">
						<input
							type="range"
							value={numValue}
							min={minVal}
							max={maxVal}
							step={step ?? 0.01}
							onChange={(e) => onChange(parseFloat(e.target.value))}
							className="w-full h-2 bg-comfy-border rounded-lg appearance-none cursor-pointer accent-comfy-accent"
							style={{
								background: `linear-gradient(to right, var(--comfy-accent) 0%, var(--comfy-accent) ${percentage}%, var(--comfy-border) ${percentage}%, var(--comfy-border) 100%)`
							}}
						/>
					</div>
				</div>
			)

		case 'checkbox':
		case 'toggle':
			return (
				<label className="flex items-center gap-2 cursor-pointer py-1">
					<input
						type="checkbox"
						checked={value as boolean}
						onChange={(e) => onChange(e.target.checked)}
						className="w-4 h-4 rounded border-comfy-border bg-comfy-bg text-comfy-accent focus:ring-comfy-accent focus:ring-offset-0"
					/>
					<span className="text-xs text-comfy-muted">{label}</span>
				</label>
			)

		case 'color':
			return (
				<div className="space-y-1">
					<label className="text-xs text-comfy-muted">{label}</label>
					<div className="flex gap-2">
						<input
							type="color"
							value={value as string}
							onChange={(e) => onChange(e.target.value)}
							className="w-10 h-8 rounded border border-comfy-border cursor-pointer"
						/>
						<input
							type="text"
							value={value as string}
							onChange={(e) => onChange(e.target.value)}
							className={`flex-1 ${inputBaseClass}`}
						/>
					</div>
				</div>
			)

		case 'image':
			return (
				<div className="space-y-1">
					<label className="text-xs text-comfy-muted">{label}</label>
					<div className="border border-comfy-border rounded p-2 bg-comfy-bg">
						{value ? (
							<img
								src={value as string}
								alt={label}
								className="max-w-full h-auto rounded"
							/>
						) : (
							<div className="text-xs text-comfy-muted text-center py-4">
								No image
							</div>
						)}
					</div>
				</div>
			)

		default:
			return (
				<div className="space-y-1">
					<label className="text-xs text-comfy-muted">{label}</label>
					<div className="text-xs text-comfy-muted italic py-1">
						Unknown widget type: {type}
					</div>
				</div>
			)
	}
}

export const WidgetRenderer = memo(WidgetRendererComponent)
