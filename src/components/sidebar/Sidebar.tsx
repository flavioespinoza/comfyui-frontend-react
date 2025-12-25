// src/components/sidebar/Sidebar.tsx
// Date: December 25, 2025
// Version: v1

'use client'

import { useUIStore } from '@/stores/uiStore'
import { NodeLibrary } from './NodeLibrary'
import { Layers, ChevronLeft, ChevronRight, Play, Square } from 'lucide-react'
import { useComfyAPI } from '@/hooks/useComfyAPI'
import { useQueueStore } from '@/stores/queueStore'

export function Sidebar() {
	const { sidebarOpen, toggleSidebar } = useUIStore()
	const { isConnected, queuePrompt, interrupt } = useComfyAPI()
	const { running, progress } = useQueueStore()

	return (
		<aside
			className={`
				relative flex flex-col border-r border-comfy-border bg-comfy-surface
				transition-all duration-200
				${sidebarOpen ? 'w-72' : 'w-12'}
			`}
		>
			{/* Toggle button */}
			<button
				onClick={toggleSidebar}
				className="absolute -right-3 top-4 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-comfy-border bg-comfy-surface shadow-sm hover:bg-comfy-bg text-comfy-text"
			>
				{sidebarOpen ? (
					<ChevronLeft className="h-4 w-4" />
				) : (
					<ChevronRight className="h-4 w-4" />
				)}
			</button>

			{/* Header */}
			<div className="flex items-center gap-2 p-3 border-b border-comfy-border">
				<Layers className="w-5 h-5 text-comfy-accent" />
				{sidebarOpen && (
					<span className="font-semibold text-comfy-text">ComfyUI</span>
				)}
				{sidebarOpen && (
					<div className="ml-auto flex items-center gap-1">
						<div
							className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
							title={isConnected ? 'Connected' : 'Disconnected'}
						/>
					</div>
				)}
			</div>

			{/* Queue Controls */}
			{sidebarOpen && (
				<div className="p-3 border-b border-comfy-border space-y-2">
					<div className="flex gap-2">
						<button
							onClick={() => queuePrompt()}
							disabled={!isConnected || !!running}
							className={`
								flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded text-sm font-medium
								${!isConnected || running
									? 'bg-comfy-border text-comfy-muted cursor-not-allowed'
									: 'bg-comfy-accent text-white hover:bg-comfy-accent/80'
								}
							`}
						>
							<Play className="w-4 h-4" />
							Queue
						</button>
						{running && (
							<button
								onClick={interrupt}
								className="flex items-center justify-center gap-2 px-3 py-2 rounded text-sm font-medium bg-amber-600 text-white hover:bg-amber-700"
							>
								<Square className="w-4 h-4" />
							</button>
						)}
					</div>

					{/* Progress bar */}
					{progress && (
						<div className="space-y-1">
							<div className="flex justify-between text-xs text-comfy-muted">
								<span>{progress.nodeLabel}</span>
								<span>{Math.round((progress.value / progress.max) * 100)}%</span>
							</div>
							<div className="h-1.5 bg-comfy-border rounded-full overflow-hidden">
								<div
									className="h-full bg-comfy-accent transition-all"
									style={{ width: `${(progress.value / progress.max) * 100}%` }}
								/>
							</div>
						</div>
					)}
				</div>
			)}

			{/* Node Library */}
			{sidebarOpen && (
				<div className="flex-1 overflow-hidden">
					<NodeLibrary />
				</div>
			)}
		</aside>
	)
}
