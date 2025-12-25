// Extension system types

export type ExtensionPermission =
  | 'graph:read'
  | 'graph:write'
  | 'ui:sidebar'
  | 'ui:modal'
  | 'ui:contextmenu'
  | 'api:fetch'
  | 'storage:local'

export interface ExtensionManifest {
  id: string
  name: string
  version: string
  description?: string
  author?: string
  permissions: ExtensionPermission[]
}

export interface SidebarTabDefinition {
  id: string
  label: string
  icon: React.ComponentType
  component: React.ComponentType
  order?: number
}

export interface ContextMenuItemDefinition {
  id: string
  label: string
  icon?: React.ComponentType
  action: () => void
  condition?: () => boolean
  submenu?: ContextMenuItemDefinition[]
}

export interface SettingsPanelDefinition {
  id: string
  label: string
  icon?: React.ComponentType
  component: React.ComponentType
  order?: number
}

export interface CustomNodeDefinition {
  type: string
  label: string
  category: string
  inputs: { name: string; type: string }[]
  outputs: { name: string; type: string }[]
  widgets?: { name: string; type: string; default?: unknown }[]
  component?: React.ComponentType
}

export interface NodeDecoratorDefinition {
  id: string
  nodeTypes: string[] | '*'
  position: 'header' | 'footer' | 'overlay'
  component: React.ComponentType<{ nodeId: string }>
}

export interface ComfyUIExtension {
  manifest: ExtensionManifest

  // Lifecycle
  onLoad?: () => Promise<void>
  onUnload?: () => Promise<void>

  // UI Registrations
  sidebarTabs?: SidebarTabDefinition[]
  contextMenuItems?: ContextMenuItemDefinition[]
  settingsPanels?: SettingsPanelDefinition[]

  // Graph Extensions
  customNodes?: CustomNodeDefinition[]
  nodeDecorators?: NodeDecoratorDefinition[]
}
