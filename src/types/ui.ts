// UI state types

export type Theme = 'dark' | 'light'

export type ViewMode = 'graph' | 'linear'

export type SidebarTab = 'nodes' | 'queue' | 'workflows'

export type ModalType =
  | 'settings'
  | 'keybinds'
  | 'about'
  | 'export'
  | 'import'
  | 'confirm'
  | null

export interface ModalData {
  title?: string
  message?: string
  onConfirm?: () => void
  onCancel?: () => void
  [key: string]: unknown
}

export interface PanelState {
  open: boolean
  width?: number
  height?: number
}

export interface UIPreferences {
  theme: Theme
  viewMode: ViewMode
  sidebarWidth: number
  showMinimap: boolean
  showGrid: boolean
  snapToGrid: boolean
  gridSize: number
}

export interface NotificationItem {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message?: string
  duration?: number
  dismissible?: boolean
}

export interface ContextMenuState {
  open: boolean
  position: { x: number; y: number }
  items: ContextMenuItem[]
  targetId?: string
}

export interface ContextMenuItem {
  id: string
  label: string
  icon?: string
  shortcut?: string
  disabled?: boolean
  action?: () => void
  submenu?: ContextMenuItem[]
}
