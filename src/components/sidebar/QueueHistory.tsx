'use client'

// Queue history view

import { useQueueStore } from '@/stores'
import { formatDuration } from '@/lib/utils'
import { Clock, CheckCircle, XCircle, Loader2, Trash2 } from 'lucide-react'

export function QueueHistory() {
  const { pending, running, history, clearHistory } = useQueueStore()

  return (
    <div className="flex flex-col h-full">
      {/* Running item */}
      {running && (
        <div className="p-3 border-b">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            Currently Running
          </div>
          <div className="flex items-center gap-2 p-2 rounded bg-primary/10 border border-primary/20">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">
                {running.id.slice(0, 8)}
              </div>
              <div className="text-xs text-muted-foreground">
                Started {running.startedAt?.toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pending items */}
      {pending.length > 0 && (
        <div className="p-3 border-b">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            Pending ({pending.length})
          </div>
          <div className="space-y-1">
            {pending.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2 p-2 rounded bg-muted/50"
              >
                <Clock className="w-4 h-4 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate">{item.id.slice(0, 8)}</div>
                </div>
              </div>
            ))}
            {pending.length > 5 && (
              <div className="text-xs text-muted-foreground text-center py-1">
                +{pending.length - 5} more
              </div>
            )}
          </div>
        </div>
      )}

      {/* History */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-3 flex items-center justify-between border-b">
          <span className="text-xs font-medium text-muted-foreground">
            History ({history.length})
          </span>
          {history.length > 0 && (
            <button
              onClick={clearHistory}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              Clear
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            No history yet
          </div>
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
                  <div className="text-sm font-medium truncate">
                    {item.id.slice(0, 8)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {item.completedAt?.toLocaleTimeString()}
                    {item.startedAt && item.completedAt && (
                      <span className="ml-2">
                        ({formatDuration(item.completedAt.getTime() - item.startedAt.getTime())})
                      </span>
                    )}
                  </div>
                  {item.error && (
                    <div className="text-xs text-red-500 mt-1 line-clamp-2">
                      {item.error}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
