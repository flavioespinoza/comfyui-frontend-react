'use client'

import { useCallback } from 'react'
import { GraphCanvas } from '@/components/graph'
import { Sidebar } from '@/components/sidebar'
import { QueuePanel } from '@/components/queue'
import { SettingsModal } from '@/components/modals'
import { useGraphStore, useUIStore } from '@/stores'
import { useKeyboardShortcuts, useComfyAPI, useWorkflow } from '@/hooks'
import { Settings } from 'lucide-react'

export default function Home() {
  const { undo, redo, deleteNodes, selectedNodeIds, copySelection, paste } = useGraphStore()
  const { openModal } = useUIStore()
  const { saveWorkflow, newWorkflow } = useWorkflow()
  const { queuePrompt } = useComfyAPI({ autoConnect: true })
  const { exportAsComfyUI } = useWorkflow()

  const handleDelete = useCallback(() => {
    deleteNodes(Array.from(selectedNodeIds))
  }, [deleteNodes, selectedNodeIds])

  const handleQueueRun = useCallback(async () => {
    const workflow = exportAsComfyUI()
    await queuePrompt(workflow)
  }, [exportAsComfyUI, queuePrompt])

  const handlePaste = useCallback(() => {
    paste({ x: 100, y: 100 })
  }, [paste])

  useKeyboardShortcuts({
    handlers: {
      'graph.undo': undo,
      'graph.redo': redo,
      'graph.copy': copySelection,
      'graph.paste': handlePaste,
      'graph.delete': handleDelete,
      'file.save': () => saveWorkflow(),
      'file.open': () => {}, // Handled by file input
      'queue.run': handleQueueRun,
      'navigation.fitView': () => {}, // Handled by React Flow
    },
  })

  return (
    <main className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <header className="flex items-center justify-between px-4 py-2 border-b bg-background">
          <h1 className="font-semibold">ComfyUI</h1>
          <button
            onClick={() => openModal('settings')}
            className="p-2 rounded hover:bg-muted"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </header>

        {/* Graph canvas */}
        <GraphCanvas className="flex-1" />
      </div>

      {/* Queue panel */}
      <QueuePanel />

      {/* Modals */}
      <SettingsModal />
    </main>
  )
}
