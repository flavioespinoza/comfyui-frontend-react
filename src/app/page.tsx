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
