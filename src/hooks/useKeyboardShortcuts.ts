// src/hooks/useKeyboardShortcuts.ts
// Date: December 25, 2025
// Version: v1

'use client'

import { useEffect, useCallback } from 'react'
import { useGraphStore } from '@/stores/graphStore'
import { useUIStore } from '@/stores/uiStore'
import { useComfyAPI } from './useComfyAPI'

export function useKeyboardShortcuts() {
	const { undo, redo, deleteNodes, selectedNodeIds, copySelection, paste } = useGraphStore()
	const { toggleQueuePanel, toggleSidebar } = useUIStore()
	const { queuePrompt, interrupt } = useComfyAPI()

	const handleKeyDown = useCallback(
		(event: KeyboardEvent) => {
			// Skip if user is typing in an input
			const target = event.target as HTMLElement
			if (
				target.tagName === 'INPUT' ||
				target.tagName === 'TEXTAREA' ||
				target.isContentEditable
			) {
				return
			}

			const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.userAgent)
			const cmdOrCtrl = isMac ? event.metaKey : event.ctrlKey

			// Undo: Ctrl/Cmd + Z
			if (cmdOrCtrl && !event.shiftKey && event.key === 'z') {
				event.preventDefault()
				undo()
				return
			}

			// Redo: Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y
			if (cmdOrCtrl && (event.shiftKey && event.key === 'z' || event.key === 'y')) {
				event.preventDefault()
				redo()
				return
			}

			// Copy: Ctrl/Cmd + C
			if (cmdOrCtrl && event.key === 'c') {
				event.preventDefault()
				copySelection()
				return
			}

			// Paste: Ctrl/Cmd + V
			if (cmdOrCtrl && event.key === 'v') {
				event.preventDefault()
				paste({ x: 100, y: 100 })
				return
			}

			// Delete: Delete or Backspace
			if (event.key === 'Delete' || event.key === 'Backspace') {
				event.preventDefault()
				deleteNodes(Array.from(selectedNodeIds))
				return
			}

			// Queue: Ctrl/Cmd + Enter
			if (cmdOrCtrl && event.key === 'Enter') {
				event.preventDefault()
				queuePrompt()
				return
			}

			// Interrupt: Escape
			if (event.key === 'Escape') {
				interrupt()
				return
			}

			// Toggle Queue Panel: Q
			if (event.key === 'q' && !cmdOrCtrl) {
				toggleQueuePanel()
				return
			}

			// Toggle Sidebar: B
			if (event.key === 'b' && !cmdOrCtrl) {
				toggleSidebar()
				return
			}
		},
		[
			undo,
			redo,
			copySelection,
			paste,
			deleteNodes,
			selectedNodeIds,
			queuePrompt,
			interrupt,
			toggleQueuePanel,
			toggleSidebar
		]
	)

	useEffect(() => {
		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [handleKeyDown])
}
