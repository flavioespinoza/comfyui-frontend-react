// src/components/sidebar/QueueHistory.tsx
// Date: December 25, 2025
// Version: v1

'use client'

import { useQueueStore } from '@/stores'
import { Clock, CheckCircle, XCircle, Loader2, Trash2 } from 'lucide-react'

function formatDuration(ms: number): string {
	const seconds = Math.floor(ms / 1000)
	if (seconds < 60) return `${seconds}s`
	const minutes = Math.floor(seconds / 60)
	const remainingSeconds = seconds % 60
	return `${minutes}m ${remainingSeconds}s`
}

export function QueueHistory() {
	const { pending, running, history, clearHistory } = useQueueStore()

	return (
		<div className="flex flex-col h-full">
			{/* Running item */}
			{running && (
				<div className="p-3 border-b border-comfy-border">
					<div className="text-xs font-medium text-comfy-muted mb-2">Currently Running</div>
					<div className="flex items-center gap-2 p-2 rounded bg-comfy-accent/10 border border-comfy-accent/20">
						<Loader2 className="w-4 h-4 animate-spin text-comfy-accent" />
						<div className="flex-1 min-w-0">
							<div className="text-sm font-medium truncate text-comfy-text">
								{running.id.slice(0, 8)}
							</div>
							<div className="text-xs text-comfy-muted">
								Started {running.startedAt?.toLocaleTimeString()}
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Pending items */}
			{pending.length > 0 && (
				<div className="p-3 border-b border-comfy-border">
					<div className="text-xs font-medium text-comfy-muted mb-2">Pending ({pending.length})</div>
					<div className="space-y-1">
						{pending.slice(0, 5).map((item) => (
							<div key={item.id} className="flex items-center gap-2 p-2 rounded bg-comfy-bg/50">
								<Clock className="w-4 h-4 text-comfy-muted" />
								<div className="flex-1 min-w-0">
									<div className="text-sm truncate text-comfy-text">{item.id.slice(0, 8)}</div>
								</div>
							</div>
						))}
						{pending.length > 5 && (
							<div className="text-xs text-comfy-muted text-center py-1">+{pending.length - 5} more</div>
						)}
					</div>
				</div>
			)}

			{/* History */}
			<div className="flex-1 overflow-y-auto">
				<div className="p-3 flex items-center justify-between border-b border-comfy-border">
					<span className="text-xs font-medium text-comfy-muted">History ({history.length})</span>
					{history.length > 0 && (
						<button
							onClick={clearHistory}
							className="text-xs text-comfy-muted hover:text-comfy-text flex items-center gap-1"
						>
							<Trash2 className="w-3 h-3" />
							Clear
						</button>
					)}
				</div>

				{history.length === 0 ? (
					<div className="p-6 text-center text-sm text-comfy-muted">No history yet</div>
				) : (
					<div className="p-3 space-y-2">
						{history.map((item) => (
							<div
								key={item.id}
								className={`
									flex items-start gap-2 p-2 rounded border
									${item.status === 'completed' ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}
								`}
							>
								{item.status === 'completed' ? (
									<CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
								) : (
									<XCircle className="w-4 h-4 text-red-500 mt-0.5" />
								)}
								<div className="flex-1 min-w-0">
									<div className="text-sm font-medium truncate text-comfy-text">{item.id.slice(0, 8)}</div>
									<div className="text-xs text-comfy-muted">
										{item.completedAt?.toLocaleTimeString()}
										{item.startedAt && item.completedAt && (
											<span className="ml-2">
												({formatDuration(item.completedAt.getTime() - item.startedAt.getTime())})
											</span>
										)}
									</div>
									{item.error && <div className="text-xs text-red-500 mt-1 line-clamp-2">{item.error}</div>}
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	)
}
