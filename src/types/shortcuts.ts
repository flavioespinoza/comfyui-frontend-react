// Keyboard shortcut types

export interface KeyboardShortcut {
  id: string
  label: string
  keys: string[]
  action: string
  category: ShortcutCategory
  enabled: boolean
}

export type ShortcutCategory =
  | 'general'
  | 'graph'
  | 'nodes'
  | 'navigation'
  | 'queue'
  | 'file'

export interface ShortcutBinding {
  key: string
  ctrl?: boolean
  alt?: boolean
  shift?: boolean
  meta?: boolean
}

export interface ShortcutAction {
  id: string
  handler: () => void
}

export type ShortcutMap = Map<string, ShortcutAction>

export interface KeyboardShortcutConfig {
  shortcuts: KeyboardShortcut[]
  customBindings: Record<string, string[]>
}

export const DEFAULT_SHORTCUTS: KeyboardShortcut[] = [
  { id: 'undo', label: 'Undo', keys: ['Ctrl+Z'], action: 'graph.undo', category: 'general', enabled: true },
  { id: 'redo', label: 'Redo', keys: ['Ctrl+Shift+Z'], action: 'graph.redo', category: 'general', enabled: true },
  { id: 'copy', label: 'Copy', keys: ['Ctrl+C'], action: 'graph.copy', category: 'graph', enabled: true },
  { id: 'paste', label: 'Paste', keys: ['Ctrl+V'], action: 'graph.paste', category: 'graph', enabled: true },
  { id: 'delete', label: 'Delete', keys: ['Delete', 'Backspace'], action: 'graph.delete', category: 'nodes', enabled: true },
  { id: 'selectAll', label: 'Select All', keys: ['Ctrl+A'], action: 'graph.selectAll', category: 'graph', enabled: true },
  { id: 'save', label: 'Save', keys: ['Ctrl+S'], action: 'file.save', category: 'file', enabled: true },
  { id: 'open', label: 'Open', keys: ['Ctrl+O'], action: 'file.open', category: 'file', enabled: true },
  { id: 'queue', label: 'Queue Prompt', keys: ['Ctrl+Enter'], action: 'queue.run', category: 'queue', enabled: true },
  { id: 'fitView', label: 'Fit View', keys: ['F'], action: 'navigation.fitView', category: 'navigation', enabled: true },
]
