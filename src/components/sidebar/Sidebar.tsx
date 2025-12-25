'use client'

// Main sidebar container with tabs

import { useUIStore } from '@/stores'
import { NodeLibrary } from './NodeLibrary'
import { QueueHistory } from './QueueHistory'
import { WorkflowBrowser } from './WorkflowBrowser'
import { Layers, Clock, FolderOpen, ChevronLeft, ChevronRight } from 'lucide-react'
import type { SidebarTab } from '@/types/ui'

const tabs: { id: SidebarTab; label: string; icon: React.ReactNode }[] = [
  { id: 'nodes', label: 'Nodes', icon: <Layers className="w-4 h-4" /> },
  { id: 'queue', label: 'Queue', icon: <Clock className="w-4 h-4" /> },
  { id: 'workflows', label: 'Workflows', icon: <FolderOpen className="w-4 h-4" /> },
]

export function Sidebar() {
  const { sidebarOpen, sidebarTab, toggleSidebar, setSidebarTab } = useUIStore()

  return (
    <aside
      className={`
        relative flex flex-col border-r bg-background transition-all duration-200
        ${sidebarOpen ? 'w-72' : 'w-12'}
      `}
    >
      {/* Toggle button */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-4 z-10 flex h-6 w-6 items-center justify-center rounded-full border bg-background shadow-sm hover:bg-muted"
      >
        {sidebarOpen ? (
          <ChevronLeft className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </button>

      {/* Tab buttons */}
      <div className={`flex border-b ${sidebarOpen ? 'flex-row' : 'flex-col'}`}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSidebarTab(tab.id)}
            className={`
              flex items-center justify-center gap-2 p-3 transition-colors
              ${sidebarTab === tab.id ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}
              ${sidebarOpen ? 'flex-1' : ''}
            `}
            title={tab.label}
          >
            {tab.icon}
            {sidebarOpen && <span className="text-sm">{tab.label}</span>}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {sidebarOpen && (
        <div className="flex-1 overflow-hidden">
          {sidebarTab === 'nodes' && <NodeLibrary />}
          {sidebarTab === 'queue' && <QueueHistory />}
          {sidebarTab === 'workflows' && <WorkflowBrowser />}
        </div>
      )}
    </aside>
  )
}
