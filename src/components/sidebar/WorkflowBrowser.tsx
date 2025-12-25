'use client'

// Workflow file browser

import { useState, useRef } from 'react'
import { useWorkflow } from '@/hooks'
import { FilePlus, FolderOpen, Save, Upload, Download } from 'lucide-react'

interface WorkflowFile {
  name: string
  path: string
  updatedAt: Date
}

export function WorkflowBrowser() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { currentWorkflow, isDirty, saveWorkflow, loadWorkflow, newWorkflow, exportWorkflow } = useWorkflow()

  const [recentWorkflows] = useState<WorkflowFile[]>([
    // Placeholder for recent workflows - will be populated from storage
  ])

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      await loadWorkflow(file)
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleExport = () => {
    const json = exportWorkflow()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${currentWorkflow?.name || 'workflow'}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Current workflow info */}
      <div className="p-3 border-b">
        <div className="text-xs font-medium text-muted-foreground mb-2">
          Current Workflow
        </div>
        <div className="p-2 rounded bg-muted/50 border">
          <div className="font-medium text-sm flex items-center gap-2">
            {currentWorkflow?.name || 'Untitled'}
            {isDirty && (
              <span className="text-xs text-amber-500">*unsaved</span>
            )}
          </div>
          {currentWorkflow?.updatedAt && (
            <div className="text-xs text-muted-foreground">
              Last saved: {currentWorkflow.updatedAt.toLocaleString()}
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="p-3 border-b grid grid-cols-2 gap-2">
        <button
          onClick={newWorkflow}
          className="flex items-center justify-center gap-2 px-3 py-2 text-sm rounded border hover:bg-muted"
        >
          <FilePlus className="w-4 h-4" />
          New
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center justify-center gap-2 px-3 py-2 text-sm rounded border hover:bg-muted"
        >
          <Upload className="w-4 h-4" />
          Load
        </button>
        <button
          onClick={() => saveWorkflow()}
          className="flex items-center justify-center gap-2 px-3 py-2 text-sm rounded border hover:bg-muted"
        >
          <Save className="w-4 h-4" />
          Save
        </button>
        <button
          onClick={handleExport}
          className="flex items-center justify-center gap-2 px-3 py-2 text-sm rounded border hover:bg-muted"
        >
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Recent workflows */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-3">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            Recent Workflows
          </div>
          {recentWorkflows.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-4">
              No recent workflows
            </div>
          ) : (
            <div className="space-y-1">
              {recentWorkflows.map((workflow) => (
                <button
                  key={workflow.path}
                  className="w-full text-left px-2 py-2 rounded hover:bg-muted flex items-center gap-2"
                >
                  <FolderOpen className="w-4 h-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">{workflow.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {workflow.updatedAt.toLocaleDateString()}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
