# RFC-001: ComfyUI Frontend Skeleton

**Project**: comfyui-frontend-react  
**Date**: December 25, 2025  
**Version**: v1

---

## Directory Structure

```
comfyui-frontend-react/
├── src/
│   ├── app/                          # Next.js 16.1 App Router
│   │   ├── api/
│   │   │   └── route.ts
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── components/
│   │   ├── graph/
│   │   │   ├── ComfyEdge.tsx
│   │   │   ├── GraphCanvas.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── nodes/
│   │   │   ├── ComfyNode.tsx
│   │   │   ├── WidgetRenderer.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── sidebar/
│   │   │   ├── NodeLibrary.tsx
│   │   │   ├── QueueHistory.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── WorkflowBrowser.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── queue/
│   │   │   ├── QueueControls.tsx
│   │   │   ├── QueuePanel.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── modals/
│   │   │   ├── SettingsModal.tsx
│   │   │   └── index.ts
│   │   │
│   │   └── settings/
│   │       ├── KeybindSettings.tsx
│   │       ├── ThemeSettings.tsx
│   │       └── index.ts
│   │
│   ├── hooks/
│   │   ├── index.ts
│   │   ├── useComfyAPI.ts
│   │   ├── useKeyboardShortcuts.ts
│   │   └── useWorkflow.ts
│   │
│   ├── lib/
│   │   ├── api/
│   │   │   ├── comfyClient.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── extensions/
│   │   │   ├── registry.ts
│   │   │   └── index.ts
│   │   │
│   │   └── utils/
│   │       ├── graphConverters.ts
│   │       └── index.ts
│   │
│   ├── stores/
│   │   ├── graphStore.ts
│   │   ├── uiStore.ts
│   │   ├── queueStore.ts
│   │   └── index.ts
│   │
│   └── types/
│       ├── extensions.ts
│       ├── graph.ts
│       ├── queue.ts
│       ├── shortcuts.ts
│       ├── ui.ts
│       └── index.ts
│
├── tests/
│   ├── unit/
│   ├── e2e/
│   └── integration/
│
└── package.json
```

---

## Technology Stack

| Layer | Package | Version |
|-------|---------|---------|
| Framework | next | 16.1.1 |
| UI | react | 19.2.0 |
| UI | react-dom | 19.2.0 |
| Graph | reactflow | 11.11.0 |
| State | zustand | 5.0.0 |
| State | immer | 10.0.0 |
| Styling | tailwindcss | 4.0.0 |
| Components | @radix-ui/react-dialog | 1.0.0 |
| Components | @radix-ui/react-dropdown-menu | 2.0.0 |
| Components | @radix-ui/react-tooltip | 1.0.0 |
| Icons | lucide-react | 0.300.0 |
| Utils | nanoid | 5.0.0 |

---

## File Descriptions

### /src/app/

| File | Purpose |
|------|---------|
| `layout.tsx` | Root layout with providers |
| `page.tsx` | Main application page |
| `api/route.ts` | API route handlers |

### /src/components/graph/

| File | Purpose |
|------|---------|
| `GraphCanvas.tsx` | Main React Flow canvas |
| `ComfyEdge.tsx` | Custom edge component |

### /src/components/nodes/

| File | Purpose |
|------|---------|
| `ComfyNode.tsx` | Custom node component |
| `WidgetRenderer.tsx` | Widget type renderer (number, text, select, slider, etc.) |

### /src/components/sidebar/

| File | Purpose |
|------|---------|
| `Sidebar.tsx` | Main sidebar container with tabs |
| `NodeLibrary.tsx` | Node search and drag-drop |
| `QueueHistory.tsx` | Queue history view |
| `WorkflowBrowser.tsx` | Workflow file browser |

### /src/components/queue/

| File | Purpose |
|------|---------|
| `QueueControls.tsx` | Run/cancel/interrupt buttons |
| `QueuePanel.tsx` | Full queue management panel |

### /src/components/modals/

| File | Purpose |
|------|---------|
| `SettingsModal.tsx` | Settings dialog |

### /src/components/settings/

| File | Purpose |
|------|---------|
| `KeybindSettings.tsx` | Keyboard shortcuts configuration |
| `ThemeSettings.tsx` | Theme configuration |

### /src/hooks/

| File | Purpose |
|------|---------|
| `useKeyboardShortcuts.ts` | Keyboard shortcut handling |
| `useComfyAPI.ts` | API connection and WebSocket |
| `useWorkflow.ts` | Workflow save/load operations |

### /src/lib/api/

| File | Purpose |
|------|---------|
| `comfyClient.ts` | ComfyUI API wrapper (HTTP + WebSocket) |

### /src/lib/extensions/

| File | Purpose |
|------|---------|
| `registry.ts` | Extension registration and lifecycle |

### /src/lib/utils/

| File | Purpose |
|------|---------|
| `index.ts` | Utility functions (cn, debounce, throttle) |
| `graphConverters.ts` | Graph data format converters |

### /src/stores/

| File | Purpose |
|------|---------|
| `graphStore.ts` | Graph state (nodes, edges, selection, clipboard) |
| `uiStore.ts` | UI state (panels, modals, theme, view mode) |
| `queueStore.ts` | Queue state (pending, running, history) |

### /src/types/

| File | Purpose |
|------|---------|
| `graph.ts` | Graph, node, edge, widget types |
| `extensions.ts` | Extension system types |
| `queue.ts` | Queue item types |
| `shortcuts.ts` | Keyboard shortcut types |
| `ui.ts` | UI state types |

---

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                   Next.js 16.1 App Router                       │
│                      (Turbopack)                                │
├─────────────────────────────────────────────────────────────────┤
│                 React Server Components                         │
│          Initial load, settings, workflow metadata              │
├─────────────────────────────────────────────────────────────────┤
│                   Zustand Global Store                          │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐       │
│  │graphStore │ │ uiStore   │ │queueStore │ │workflowSt.│       │
│  │nodes,edges│ │panels,mode│ │pending,run│ │save,load  │       │
│  └───────────┘ └───────────┘ └───────────┘ └───────────┘       │
├─────────────────────────────────────────────────────────────────┤
│                    Component Layer                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │GraphCanv.│ │NodeLibr. │ │QueuePanel│ │Settings  │           │
│  │ReactFlow │ │Search+DnD│ │History   │ │Keybinds  │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
├─────────────────────────────────────────────────────────────────┤
│                   Extension System                              │
│  React component registration • Hook-based lifecycle            │
│  Type-safe plugin API • Sandboxed execution                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Store Schemas

### graphStore

```typescript
interface GraphState {
  nodes: Map<string, GraphNode>
  edges: Map<string, GraphEdge>
  selectedNodeIds: Set<string>
  clipboard: { nodes: GraphNode[], edges: GraphEdge[] } | null
  viewport: { x: number, y: number, zoom: number }
  past: GraphSnapshot[]
  future: GraphSnapshot[]

  // Actions
  addNode: (node) => string
  updateNode: (id, updates) => void
  deleteNodes: (ids) => void
  addEdge: (edge) => string
  deleteEdges: (ids) => void
  selectNodes: (ids, additive?) => void
  copySelection: () => void
  paste: (position) => void
  undo: () => void
  redo: () => void
}
```

### uiStore

```typescript
interface UIState {
  sidebarOpen: boolean
  sidebarTab: 'nodes' | 'queue' | 'workflows'
  queuePanelOpen: boolean
  settingsPanelOpen: boolean
  activeModal: string | null
  modalData: unknown
  theme: 'dark' | 'light'
  viewMode: 'graph' | 'linear'

  // Actions
  toggleSidebar: () => void
  setSidebarTab: (tab) => void
  openModal: (modal, data) => void
  closeModal: () => void
  setTheme: (theme) => void
  setViewMode: (mode) => void
}
```

### queueStore

```typescript
interface QueueState {
  pending: QueueItem[]
  running: QueueItem | null
  history: QueueItem[]
  progress: { node: string, value: number } | null

  // Actions
  addToQueue: (item) => void
  removeFromQueue: (id) => void
  setRunning: (item) => void
  completeRunning: () => void
  setProgress: (progress) => void
  clearHistory: () => void
}
```

---

## Extension API

```typescript
interface ComfyUIExtension {
  manifest: {
    id: string
    name: string
    version: string
    permissions: ExtensionPermission[]
  }

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
```

---

## File Count Summary

| Directory | Files |
|-----------|-------|
| src/app/ | 3 |
| src/components/ | 18 |
| src/hooks/ | 4 |
| src/lib/ | 6 |
| src/stores/ | 4 |
| src/types/ | 6 |
| **Total** | **43** |

---

**Version**: v1  
**Last Updated**: December 25, 2025
