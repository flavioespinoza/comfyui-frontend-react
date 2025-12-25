'use client'

// Run/cancel/interrupt buttons

import { useQueueStore } from '@/stores'
import { useComfyAPI, useWorkflow } from '@/hooks'
import { Play, Square, XCircle, Trash2 } from 'lucide-react'

interface QueueControlsProps {
  className?: string
}

export function QueueControls({ className }: QueueControlsProps) {
  const { pending, running, progress, clearPending } = useQueueStore()
  const { interrupt, clearQueue, queuePrompt, isConnected } = useComfyAPI()
  const { exportAsComfyUI } = useWorkflow()

  const handleQueue = async () => {
    const workflow = exportAsComfyUI()
    await queuePrompt(workflow)
  }

  const handleInterrupt = async () => {
    await interrupt()
  }

  const handleClearQueue = async () => {
    await clearQueue()
    clearPending()
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Queue button */}
      <button
        onClick={handleQueue}
        disabled={!isConnected || !!running}
        className={`
          flex items-center gap-2 px-4 py-2 rounded font-medium text-sm
          ${!isConnected || running
            ? 'bg-muted text-muted-foreground cursor-not-allowed'
            : 'bg-primary text-primary-foreground hover:bg-primary/90'
          }
        `}
      >
        <Play className="w-4 h-4" />
        Queue
      </button>

      {/* Interrupt button */}
      {running && (
        <button
          onClick={handleInterrupt}
          className="flex items-center gap-2 px-4 py-2 rounded font-medium text-sm bg-amber-500 text-white hover:bg-amber-600"
        >
          <Square className="w-4 h-4" />
          Interrupt
        </button>
      )}

      {/* Clear queue button */}
      {pending.length > 0 && (
        <button
          onClick={handleClearQueue}
          className="flex items-center gap-2 px-3 py-2 rounded text-sm border hover:bg-muted"
        >
          <Trash2 className="w-4 h-4" />
          Clear ({pending.length})
        </button>
      )}

      {/* Progress indicator */}
      {progress && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${(progress.value / (progress.max || 100)) * 100}%` }}
            />
          </div>
          <span>{Math.round((progress.value / (progress.max || 100)) * 100)}%</span>
        </div>
      )}

      {/* Connection status */}
      <div className="ml-auto flex items-center gap-2 text-sm">
        <div
          className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
        />
        <span className="text-muted-foreground">
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
      </div>
    </div>
  )
}
