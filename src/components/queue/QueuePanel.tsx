'use client'

// Full queue management panel

import { useUIStore, useQueueStore } from '@/stores'
import { QueueControls } from './QueueControls'
import { formatDuration } from '@/lib/utils'
import { X, ChevronUp, ChevronDown, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react'

export function QueuePanel() {
  const { queuePanelOpen, setQueuePanelOpen } = useUIStore()
  const { pending, running, history, progress } = useQueueStore()

  if (!queuePanelOpen) {
    return (
      <button
        onClick={() => setQueuePanelOpen(true)}
        className="fixed bottom-4 right-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-background border shadow-lg hover:bg-muted"
      >
        <ChevronUp className="w-4 h-4" />
        Queue
        {pending.length > 0 && (
          <span className="px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
            {pending.length}
          </span>
        )}
      </button>
    )
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <h3 className="font-medium">Queue</h3>
        <button
          onClick={() => setQueuePanelOpen(false)}
          className="p-1 rounded hover:bg-muted"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {/* Controls */}
      <div className="px-4 py-3 border-b">
        <QueueControls />
      </div>

      {/* Queue content */}
      <div className="flex gap-4 p-4 max-h-64 overflow-hidden">
        {/* Running */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-muted-foreground mb-2">Running</h4>
          {running ? (
            <div className="p-3 rounded bg-primary/10 border border-primary/20">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="font-medium">{running.id.slice(0, 8)}</span>
              </div>
              {progress && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Node: {progress.node}</span>
                    <span>{Math.round((progress.value / (progress.max || 100)) * 100)}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${(progress.value / (progress.max || 100)) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No active job</div>
          )}
        </div>

        {/* Pending */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-muted-foreground mb-2">
            Pending ({pending.length})
          </h4>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {pending.length === 0 ? (
              <div className="text-sm text-muted-foreground">Queue empty</div>
            ) : (
              pending.slice(0, 10).map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 p-2 rounded bg-muted/50 text-sm"
                >
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <span className="truncate">{item.id.slice(0, 8)}</span>
                  <span className="text-xs text-muted-foreground ml-auto">#{index + 1}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent history */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-muted-foreground mb-2">
            Recent ({history.length})
          </h4>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {history.length === 0 ? (
              <div className="text-sm text-muted-foreground">No history</div>
            ) : (
              history.slice(0, 10).map((item) => (
                <div
                  key={item.id}
                  className={`
                    flex items-center gap-2 p-2 rounded text-sm
                    ${item.status === 'completed' ? 'bg-green-500/10' : 'bg-red-500/10'}
                  `}
                >
                  {item.status === 'completed' ? (
                    <CheckCircle className="w-3 h-3 text-green-500" />
                  ) : (
                    <XCircle className="w-3 h-3 text-red-500" />
                  )}
                  <span className="truncate">{item.id.slice(0, 8)}</span>
                  {item.startedAt && item.completedAt && (
                    <span className="text-xs text-muted-foreground ml-auto">
                      {formatDuration(item.completedAt.getTime() - item.startedAt.getTime())}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
