'use client'

// Keyboard shortcuts configuration

import { useState } from 'react'
import { DEFAULT_SHORTCUTS, type KeyboardShortcut, type ShortcutCategory } from '@/types/shortcuts'
import { Search } from 'lucide-react'

const categoryLabels: Record<ShortcutCategory, string> = {
  general: 'General',
  graph: 'Graph',
  nodes: 'Nodes',
  navigation: 'Navigation',
  queue: 'Queue',
  file: 'File',
}

export function KeybindSettings() {
  const [search, setSearch] = useState('')
  const [shortcuts, setShortcuts] = useState(DEFAULT_SHORTCUTS)
  const [editingId, setEditingId] = useState<string | null>(null)

  const filteredShortcuts = shortcuts.filter(
    (s) =>
      !search ||
      s.label.toLowerCase().includes(search.toLowerCase()) ||
      s.keys.some((k) => k.toLowerCase().includes(search.toLowerCase()))
  )

  const shortcutsByCategory = filteredShortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = []
    }
    acc[shortcut.category].push(shortcut)
    return acc
  }, {} as Record<ShortcutCategory, KeyboardShortcut[]>)

  const handleKeyCapture = (id: string, event: React.KeyboardEvent) => {
    event.preventDefault()
    event.stopPropagation()

    const parts: string[] = []
    if (event.ctrlKey) parts.push('Ctrl')
    if (event.altKey) parts.push('Alt')
    if (event.shiftKey) parts.push('Shift')
    if (event.metaKey) parts.push('Meta')

    const key = event.key
    if (!['Control', 'Alt', 'Shift', 'Meta'].includes(key)) {
      parts.push(key.length === 1 ? key.toUpperCase() : key)

      setShortcuts((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, keys: [parts.join('+')] } : s
        )
      )
      setEditingId(null)
    }
  }

  const resetShortcut = (id: string) => {
    const defaultShortcut = DEFAULT_SHORTCUTS.find((s) => s.id === id)
    if (defaultShortcut) {
      setShortcuts((prev) =>
        prev.map((s) => (s.id === id ? { ...s, keys: defaultShortcut.keys } : s))
      )
    }
  }

  const toggleShortcut = (id: string) => {
    setShortcuts((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">Keyboard Shortcuts</h3>
        <p className="text-sm text-muted-foreground">
          Customize keyboard shortcuts for common actions
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search shortcuts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm rounded border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Shortcuts list */}
      <div className="space-y-6">
        {Object.entries(shortcutsByCategory).map(([category, categoryShortcuts]) => (
          <div key={category}>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">
              {categoryLabels[category as ShortcutCategory]}
            </h4>
            <div className="space-y-1">
              {categoryShortcuts.map((shortcut) => (
                <div
                  key={shortcut.id}
                  className={`
                    flex items-center justify-between p-2 rounded
                    ${shortcut.enabled ? 'hover:bg-muted/50' : 'opacity-50'}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={shortcut.enabled}
                      onChange={() => toggleShortcut(shortcut.id)}
                      className="rounded"
                    />
                    <span className="text-sm">{shortcut.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {editingId === shortcut.id ? (
                      <input
                        type="text"
                        placeholder="Press keys..."
                        autoFocus
                        onKeyDown={(e) => handleKeyCapture(shortcut.id, e)}
                        onBlur={() => setEditingId(null)}
                        className="w-32 px-2 py-1 text-sm text-center rounded border bg-muted focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    ) : (
                      <button
                        onClick={() => setEditingId(shortcut.id)}
                        className="px-2 py-1 text-sm rounded bg-muted hover:bg-muted/80 font-mono"
                      >
                        {shortcut.keys.join(', ')}
                      </button>
                    )}
                    <button
                      onClick={() => resetShortcut(shortcut.id)}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Reset all button */}
      <div className="pt-4 border-t">
        <button
          onClick={() => setShortcuts(DEFAULT_SHORTCUTS)}
          className="px-4 py-2 text-sm rounded border hover:bg-muted"
        >
          Reset All to Defaults
        </button>
      </div>
    </div>
  )
}
