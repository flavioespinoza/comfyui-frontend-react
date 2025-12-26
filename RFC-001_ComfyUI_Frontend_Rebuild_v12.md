# ComfyUI Frontend Complete Rebuild in Parallel with Vue Short Term Path

**Author**: Flavio Espinoza (Senior Full-Stack Engineer)  
**Contributors**: Claude AI (Anthropic)  
**Fact-Check**: Google Gemini
**Version**: v12
**Date**: December 25, 2025

> **Data Validation Notice**: This version (v12) includes verified data from primary sources with hyperlinks. An independent fact-check by Google Gemini confirmed these statistics are conservative—actual React market dominance may be greater than stated. Claims marked [Author Assessment] reflect professional judgment. See [Appendix D](#appendix-d-sources-and-citations) for full citations.

---

## Abstract

What if we built a new frontend in parallel with the existing codebase rather than replacing it outright?

This collaborative approach enables us to keep the current Vue frontend running smoothly for Comfy AI users while we efficiently develop, test, and validate the new version together. The ComfyUI API will remain the same for both frontends, so both will continue using the same data, but be able to adapt separately as the API changes. The current frontend will follow the short term path layed out in this RFC. It will have a hard stop before the Wasm+Rust long term proposal. Why? Because I think there is a much more effective and efficient path forward following the parallel path.

### RFC Proposal

I propose rebuilding the ComfyUI frontend using React, Next.js, TypeScript, Tailwind CSS, and Zustand for state management.

I believe we can achieve more by moving away from Vue-based incremental fixes and the proposed WASM+Rust graph rendering approach. By working together on a modern React architecture, we'll benefit from the largest ecosystem, the best tooling support, and a wide talent pool in frontend development.

---

## Table of Contents

1. [Motivation](#1-motivation)
2. [Current Architecture Problems](#2-current-architecture-problems)
3. [Why Not Vue + Incremental Fixes](#3-why-not-vue--incremental-fixes)
4. [Why Not WASM + Rust](#4-why-not-wasm--rust)
5. [Proposed Architecture](#5-proposed-architecture)
6. [Technical Specification](#6-technical-specification)
7. [Addressing Comfy's Proposed Features](#7-addressing-comfys-proposed-features)
8. [Graph Rendering Strategy](#8-graph-rendering-strategy)
9. [Migration Path](#9-migration-path)
10. [Resource Requirements](#10-resource-requirements)
11. [Risk Analysis](#11-risk-analysis)
12. [Success Metrics](#12-success-metrics)
13. [Conclusion](#13-conclusion)

---

## 1. Motivation

### The Opportunity

ComfyUI has become one of the most popular interfaces for node-based AI workflow design. With **[89,000+ GitHub stars](https://github.com/comfyanonymous/ComfyUI)** [[Wikipedia](https://en.wikipedia.org/wiki/ComfyUI), Sept 2025] and a thriving custom node ecosystem, the frontend is the primary interface through which users interact with powerful AI capabilities. The current frontend, while functional, is held together by architectural compromises that limit its potential.

### The Problem

The August 2024 migration from vanilla JavaScript to Vue/TypeScript was a step forward, but it introduced new problems:

- Dual rendering systems (LiteGraph + Vue) that fight each other
- State management fragmentation across multiple patterns
- DOM event detection anti-patterns that break across modes
- A codebase that requires specialized Vue knowledge in a market where React dominates

### The Ask

I propose investing in a complete rebuild using React/Next.js—not because Vue is inherently inferior, but because:

1. **Ecosystem**: React's npm downloads are approximately 7x higher than Vue's [[npmtrends](https://npmtrends.com/react-vs-vue)]
2. **Talent**: React developers outnumber Vue developers ~5:1 in job postings [[devjobsscanner](https://www.devjobsscanner.com/)]
3. **Tooling**: AI coding assistants have substantially more React training data due to GitHub repository counts
4. **Longevity**: React's backing by Meta and adoption by major platforms ensures long-term viability

---

## 2. Current Architecture Problems

### 2.1 Bifurcated State Management

The current codebase maintains parallel state systems:

| System | Technology | Scope |
|--------|------------|-------|
| LiteGraph Canvas | Internal object model | Node positions, connections, canvas state |
| Vue Composables | `useNodeEventHandlers`, `useCopy`, `usePaste` | Selection, clipboard, interactions |
| Pinia Stores | Various | UI state, settings, queue |
| Recoil (legacy) | `atomFamily` patterns | Per-deployment state isolation |

**Impact**: State synchronization bugs, mode transition failures, unpredictable behavior.

### 2.2 The DOM Detection Anti-Pattern

Current keyboard handling relies on CSS class detection:

```typescript
// This is fundamentally broken
const isTargetInGraph = e.target.classList.contains('litegraph') || 
  e.target.classList.contains('graph-canvas-container') || 
  e.target.id === 'graph-canvas'
```

This pattern:
- Fails when Vue components receive focus
- Requires manual class maintenance across all new components
- Creates implicit coupling between DOM structure and business logic
- Cannot be statically analyzed or type-checked

### 2.3 LiteGraph Dependency

[LiteGraph.js](https://github.com/jagenjo/litegraph.js) is a library originally created around 2014-2015 that:
- Has minimal maintenance activity ([npm shows last publish ~2 years ago as v0.7.18](https://www.npmjs.com/package/litegraph.js))
- Uses global mutable state
- Lacks official TypeScript support (types are community-maintained)
- Renders everything to a single canvas (accessibility nightmare)
- Cannot leverage modern React rendering optimizations

Note: [Comfy-Org has forked](https://github.com/Comfy-Org/ComfyUI_frontend) and heavily modified their own version of LiteGraph.

### 2.4 Extension System Fragility

The current extension API:

```typescript
app.extensionManager.registerSidebarTab({
  id: "search",
  icon: "pi pi-search",
  title: "search",
  tooltip: "search",
  type: "custom",
  render: (el) => {
    el.innerHTML = "<div>Custom search</div>"
  }
})
```

This DOM-manipulation-based API:
- Cannot be type-checked
- Has no component lifecycle management
- Creates memory leaks if not carefully managed
- Cannot leverage Vue's reactivity (ironic for a Vue app)

---

## 3. Why Not Vue + Incremental Fixes

### 3.1 The Sunk Cost Fallacy

The argument for continuing with Vue typically centers on "we've already invested in it." This is a textbook sunk cost fallacy. The relevant question is not "how much have we spent?" but "what is the best path forward from here?"

### 3.2 Vue's Market Position Relative to React

**npm Downloads (Weekly Average, December 2025)**: 
- Sources: [[npmtrends.com](https://npmtrends.com/react-vs-vue-vs-@angular/core)]
| Package | Downloads | 
|---------|-----------|
| react | ~57.8M weekly |
| vue | ~7.9M weekly |
| @angular/core | ~4.6M weekly |

React's download volume is approximately **7x higher** than Vue's, indicating significantly broader ecosystem adoption.

**Stack Overflow Developer Survey**:

| Year | React | Vue.js | Angular | Source |
|------|-------|--------|---------|--------|
| 2024 | 39.5% | 15.4% | 17.1% | [[survey.stackoverflow.co/2024](https://survey.stackoverflow.co/2024/technology#1-web-frameworks-and-technologies)] |
| 2025 | 44.7% | 16.6% | — | [[survey.stackoverflow.co/2025](https://survey.stackoverflow.co/2025/technology#1-web-frameworks-and-technologies)] |

React remains the most widely used web framework and **increased its lead** from 2024 to 2025.

### 3.3 Hiring Reality

**Global Frontend Job Market (2025)**: [[devjobsscanner.com](https://www.devjobsscanner.com/blog/the-most-demanded-frontend-frameworks/)]

| Framework | Job Postings | Market Share |
|-----------|--------------|--------------|
| React | 126,000+ | ~52% |
| Vue | 24,000+ | ~10% |

React commands **5x more job postings** than Vue globally. This pattern holds across major job platforms including LinkedIn, Indeed, and specialized tech job boards.

ComfyUI is competing for talent in a market where React developers are substantially more available—meaning more potential contributors, contractors, and hires.

### 3.4 AI Tooling Advantage

AI coding assistants (Claude, GPT-4, Copilot) are trained on public code repositories. GitHub ecosystem data shows:

**[[GitHub Statistics and Facts 20205](https://electroiq.com/stats/github-statistics/)]**: 
- React: 234,000+ stars
- Vue: 208,000+ stars

While stars are close, React's broader ecosystem presence in training data (more tutorials, more Stack Overflow answers, more blog posts) translates to better AI assistant performance on React patterns.

**Practical implication**: AI coding assistants handle React patterns more consistently, likely due to React's larger overall presence in training data. [Author Assessment]

### 3.5 The Vue 3 Composition API Problem

Vue 3's Composition API was designed to be "React-like." The result:
- Vue developers must learn a new paradigm (not template-based)
- The API is similar to React hooks but with subtle differences
- Documentation and examples are less abundant than React's
- The community is split between Options API and Composition API

If developers must learn a React-like API anyway, why not use React?

---

## 4. Why Not WASM + Rust

### 4.1 The Proposed Direction

Some community members have proposed:
- Rewriting the graph rendering layer in Rust
- Compiling to WebAssembly (WASM)
- Using Rust's performance for complex graph operations

I have direct experience with a WASM+Rust refactor implementation when I worked for Bless Network. It was a hard grueling refactor, and ultimately it was abandoned because WASM has an extremely steep learning curve and difficult debugging. And Rust is difficult to master in a short time.

### 4.2 The Performance Argument Is Overstated

**Claim**: "WASM is faster than JavaScript"

**Reality**:
- WASM excels at compute-intensive tasks (image processing, cryptography)
- Graph rendering is DOM/Canvas interaction bound, not compute bound
- WASM-to-JS boundary crossing has overhead
- Modern V8/SpiderMonkey JIT compilers are extremely fast for typical UI code

**The key insight**: For a graph editor, the bottleneck is rendering calls to the DOM/Canvas, not the computation of node positions. WASM provides minimal advantage when the performance constraint is I/O bound rather than compute bound. [Author Assessment]

### 4.3 Development Velocity Concerns

**Rust Developer Availability**: [[Stack Overflow 2024](https://survey.stackoverflow.co/2024)]
- Rust usage: 12.6% of surveyed developers in 2024
- However, Rust + WASM + frontend experience is a much smaller subset
- Rust + WASM + graph rendering expertise is exceptionally rare

The [2024 State of Rust Survey](https://blog.rust-lang.org/2025/02/13/2024-State-Of-Rust-Survey-results.html) noted that 45.5% of Rust developers worry about "not enough usage in tech industry".

**Compilation Times**: [Author Assessment based on experience]
- Rust incremental builds are slower than JavaScript hot reload
- WASM compilation adds additional time
- Hot module replacement is not natively supported

**Debugging**:
- WASM debugging is primitive compared to browser DevTools
- Source maps exist but are unreliable
- Memory debugging requires specialized tools

### 4.4 The Interop Tax

Every WASM-to-JavaScript call has overhead:
- Serialization/deserialization of complex objects
- Memory copying across boundaries
- Loss of JavaScript object references

For a graph editor with thousands of interactive elements, this tax is paid constantly:
- Mouse move events
- Node selection
- Connection dragging
- Widget value changes

### 4.5 Ecosystem Isolation

Choosing WASM+Rust means:
- Cannot use npm packages for graph rendering
- Must maintain parallel implementations of common utilities
- Community extensions cannot easily integrate
- Significantly reduces potential contributor pool [Author Assessment]

### 4.6 The Right Tool for the Job

WASM+Rust makes sense for:
- Image/video processing pipelines (already in ComfyUI backend)
- Cryptographic operations
- Scientific computing
- Games with complex physics

WASM+Rust does not make sense for:
- Interactive UI rendering
- DOM manipulation
- Event handling
- Component composition

---

## 5. Proposed Architecture

### 5.1 Technology Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Framework** | [Next.js 15+](https://nextjs.org/) | App Router, Server Components, optimized builds |
| **UI Library** | [React 19](https://react.dev/) | Largest ecosystem, best AI tooling support |
| **Language** | [TypeScript 5.x](https://www.typescriptlang.org/) | Type safety, IDE support, documentation |
| **Styling** | [TailwindCSS 4](https://tailwindcss.com/) | Utility-first, consistent design system |
| **State Management** | [Zustand](https://zustand-demo.pmnd.rs/) | Simple, performant, TypeScript-first |
| **Graph Rendering** | [React Flow](https://reactflow.dev/) / Custom Canvas | Modern, React-native graph rendering |
| **Desktop** | [Electron](https://www.electronjs.org/) (existing) | Maintain compatibility with ComfyUI Desktop |

### 5.2 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Next.js App Shell                              │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                    React Server Components                           ││
│  │  (Initial load, settings, workflow metadata, model listings)         ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                    │                                     │
│  ┌─────────────────────────────────┴─────────────────────────────────┐  │
│  │                     Client-Side React App                          │  │
│  │  ┌─────────────────────────────────────────────────────────────┐  │  │
│  │  │                    Zustand Global Store                      │  │  │
│  │  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │  │  │
│  │  │  │ graphStore  │ │ uiStore     │ │ queueStore  │           │  │  │
│  │  │  │ - nodes     │ │ - panels    │ │ - pending   │           │  │  │
│  │  │  │ - edges     │ │ - modals    │ │ - running   │           │  │  │
│  │  │  │ - selection │ │ - sidebar   │ │ - history   │           │  │  │
│  │  │  │ - clipboard │ │ - theme     │ │ - progress  │           │  │  │
│  │  │  └─────────────┘ └─────────────┘ └─────────────┘           │  │  │
│  │  └─────────────────────────────────────────────────────────────┘  │  │
│  │                                │                                   │  │
│  │  ┌─────────────────────────────┴─────────────────────────────┐    │  │
│  │  │                    Component Layer                         │    │  │
│  │  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐      │    │  │
│  │  │  │ GraphCanvas  │ │ Sidebar      │ │ Modals       │      │    │  │
│  │  │  │ (React Flow) │ │ (Panels)     │ │ (Dialogs)    │      │    │  │
│  │  │  └──────────────┘ └──────────────┘ └──────────────┘      │    │  │
│  │  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐      │    │  │
│  │  │  │ NodeLibrary  │ │ Queue        │ │ Settings     │      │    │  │
│  │  │  │ (Search/DnD) │ │ (History)    │ │ (Keybinds)   │      │    │  │
│  │  │  └──────────────┘ └──────────────┘ └──────────────┘      │    │  │
│  │  └────────────────────────────────────────────────────────────┘   │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                    │                                     │
│  ┌─────────────────────────────────┴─────────────────────────────────┐  │
│  │                      Extension System                              │  │
│  │  - React component registration                                    │  │
│  │  - Hook-based lifecycle                                            │  │
│  │  - Type-safe plugin API                                            │  │
│  │  - Sandboxed execution                                             │  │
│  └────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
```

### 5.3 Why Zustand Over Redux/Jotai/Recoil

| Criteria | Zustand | Redux Toolkit | Jotai | Recoil |
|----------|---------|---------------|-------|--------|
| Bundle size | [~3KB minified](https://bundlephobia.com/package/zustand) | [~40KB minified](https://bundlephobia.com/package/@reduxjs/toolkit) | [~3-4KB minified](https://bundlephobia.com/package/jotai) | [~14-21KB minified](https://bundlephobia.com/package/recoil) |
| Boilerplate | Minimal | Moderate | Minimal | Moderate |
| TypeScript DX | Excellent | Good | Excellent | Good |
| Learning curve | Low | Medium | Low | Medium |
| DevTools | Yes | Yes | Yes | Yes |
| Persistence | Built-in | Plugin | Plugin | Plugin |
| Maintenance | Active | Active | Active | Uncertain (Meta) |

Source: [bundlephobia.com](https://bundlephobia.com)

**Zustand wins** on simplicity, size, and TypeScript experience. For a graph editor with frequent state updates, its minimal overhead is critical.

---

## 6. Technical Specification

### 6.1 State Management Architecture

```typescript
// stores/graphStore.ts
//
// WHY ZUSTAND IS BETTER FOR COMFYUI:
//
// 1. MINIMAL BOILERPLATE: No action creators, reducers, or providers needed.
//    Compare this single file to Redux's multiple files (slice, actions, selectors, store config).
//
// 2. DIRECT STATE MUTATIONS with Immer: The `immer` middleware lets us write
//    intuitive mutations like `state.nodes.set(id, node)` instead of spreading
//    nested objects. This is critical for a graph editor with deep state updates.
//
// 3. SUBSCRIBE TO SLICES: `subscribeWithSelector` allows React Flow to subscribe
//    to only `nodes` or `edges` changes, preventing unnecessary re-renders when
//    unrelated state (like `clipboard`) changes.
//
// 4. BUILT-IN PERSISTENCE: The `persist` middleware handles localStorage/IndexedDB
//    serialization automatically. No need for redux-persist or custom hydration logic.
//
// 5. NO PROVIDER WRAPPER: Access state anywhere with `useGraphStore.getState()`
//    without drilling through React context. Essential for keyboard shortcuts
//    that run outside React's render cycle.
//
// 6. TYPESCRIPT-FIRST: Full type inference without manual typing of action payloads,
//    dispatch functions, or selector return types.

import { create } from 'zustand'
import { persist, subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

interface GraphNode {
  id: string
  type: string
  position: { x: number; y: number }
  data: {
    label: string
    widgets: Record<string, WidgetValue>
    inputs: NodeInput[]
    outputs: NodeOutput[]
  }
  selected: boolean
  dragging: boolean
}

interface GraphEdge {
  id: string
  source: string
  sourceHandle: string
  target: string
  targetHandle: string
  animated: boolean
}

interface GraphState {
  // State
  nodes: Map<string, GraphNode>
  edges: Map<string, GraphEdge>
  selectedNodeIds: Set<string>
  clipboard: { nodes: GraphNode[]; edges: GraphEdge[] } | null
  viewport: { x: number; y: number; zoom: number }
  
  // History
  past: GraphSnapshot[]
  future: GraphSnapshot[]
  
  // Actions
  addNode: (node: Omit<GraphNode, 'id'>) => string
  updateNode: (id: string, updates: Partial<GraphNode>) => void
  deleteNodes: (ids: string[]) => void
  addEdge: (edge: Omit<GraphEdge, 'id'>) => string
  deleteEdges: (ids: string[]) => void
  selectNodes: (ids: string[], additive?: boolean) => void
  copySelection: () => void
  paste: (position: { x: number; y: number }) => void
  undo: () => void
  redo: () => void
  
  // Computed (via selectors)
  getSelectedNodes: () => GraphNode[]
  getConnectedEdges: (nodeId: string) => GraphEdge[]
}

export const useGraphStore = create<GraphState>()(
  subscribeWithSelector(
    persist(
      immer((set, get) => ({
        nodes: new Map(),
        edges: new Map(),
        selectedNodeIds: new Set(),
        clipboard: null,
        viewport: { x: 0, y: 0, zoom: 1 },
        past: [],
        future: [],

        addNode: (nodeData) => {
          const id = nanoid()
          set((state) => {
            state.nodes.set(id, { ...nodeData, id })
          })
          return id
        },

        selectNodes: (ids, additive = false) => {
          set((state) => {
            if (!additive) {
              state.selectedNodeIds.clear()
            }
            ids.forEach((id) => state.selectedNodeIds.add(id))
          })
        },

        copySelection: () => {
          const state = get()
          const selectedNodes = Array.from(state.selectedNodeIds)
            .map((id) => state.nodes.get(id))
            .filter(Boolean) as GraphNode[]
          
          const selectedEdges = Array.from(state.edges.values()).filter(
            (edge) =>
              state.selectedNodeIds.has(edge.source) &&
              state.selectedNodeIds.has(edge.target)
          )

          set({ clipboard: { nodes: selectedNodes, edges: selectedEdges } })
        },

        // ... additional actions
      })),
      {
        name: 'comfyui-graph',
        partialize: (state) => ({
          nodes: Array.from(state.nodes.entries()),
          edges: Array.from(state.edges.entries()),
          viewport: state.viewport,
        }),
      }
    )
  )
)
```

### 6.2 Keyboard System

```typescript
// hooks/useKeyboardShortcuts.ts
import { useEffect, useCallback } from 'react'
import { useGraphStore } from '@/stores/graphStore'
import { useUIStore } from '@/stores/uiStore'

interface ShortcutDefinition {
  key: string
  modifiers?: ('ctrl' | 'meta' | 'shift' | 'alt')[]
  action: () => void
  when?: () => boolean
  description: string
}

const defaultShortcuts: ShortcutDefinition[] = [
  {
    key: 'c',
    modifiers: ['ctrl'],
    action: () => useGraphStore.getState().copySelection(),
    when: () => useGraphStore.getState().selectedNodeIds.size > 0,
    description: 'Copy selected nodes',
  },
  {
    key: 'v',
    modifiers: ['ctrl'],
    action: () => {
      const viewport = useGraphStore.getState().viewport
      useGraphStore.getState().paste({ x: viewport.x, y: viewport.y })
    },
    when: () => useGraphStore.getState().clipboard !== null,
    description: 'Paste nodes',
  },
  {
    key: 'z',
    modifiers: ['ctrl'],
    action: () => useGraphStore.getState().undo(),
    description: 'Undo',
  },
  {
    key: 'z',
    modifiers: ['ctrl', 'shift'],
    action: () => useGraphStore.getState().redo(),
    description: 'Redo',
  },
  {
    key: 'Delete',
    action: () => {
      const selected = Array.from(useGraphStore.getState().selectedNodeIds)
      useGraphStore.getState().deleteNodes(selected)
    },
    when: () => useGraphStore.getState().selectedNodeIds.size > 0,
    description: 'Delete selected nodes',
  },
]

export function useKeyboardShortcuts(
  customShortcuts: ShortcutDefinition[] = []
) {
  const shortcuts = [...defaultShortcuts, ...customShortcuts]

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Skip if in editable element
      if (isEditableElement(event.target)) return

      const matchingShortcut = shortcuts.find((shortcut) => {
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase()
        const modifiersMatch = (shortcut.modifiers ?? []).every((mod) => {
          if (mod === 'ctrl') return event.ctrlKey || event.metaKey
          if (mod === 'meta') return event.metaKey
          if (mod === 'shift') return event.shiftKey
          if (mod === 'alt') return event.altKey
          return false
        })
        const conditionMet = shortcut.when?.() ?? true

        return keyMatch && modifiersMatch && conditionMet
      })

      if (matchingShortcut) {
        event.preventDefault()
        matchingShortcut.action()
      }
    },
    [shortcuts]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

function isEditableElement(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false
  return (
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.isContentEditable
  )
}
```

### 6.3 Extension API

```typescript
// lib/extensions/types.ts
import { ComponentType, ReactNode } from 'react'

export interface ExtensionManifest {
  id: string
  name: string
  version: string
  description: string
  author: string
  permissions: ExtensionPermission[]
}

export type ExtensionPermission =
  | 'graph:read'
  | 'graph:write'
  | 'ui:sidebar'
  | 'ui:modal'
  | 'ui:contextMenu'
  | 'network:fetch'
  | 'storage:local'

export interface SidebarTabDefinition {
  id: string
  title: string
  icon: ComponentType<{ className?: string }>
  component: ComponentType
  position?: 'top' | 'bottom'
}

export interface ContextMenuItemDefinition {
  id: string
  label: string
  icon?: ComponentType<{ className?: string }>
  shortcut?: string
  action: (context: ContextMenuContext) => void
  when?: (context: ContextMenuContext) => boolean
}

export interface ComfyUIExtension {
  manifest: ExtensionManifest
  
  // Lifecycle hooks
  onLoad?: () => Promise<void>
  onUnload?: () => Promise<void>
  
  // UI registrations
  sidebarTabs?: SidebarTabDefinition[]
  contextMenuItems?: ContextMenuItemDefinition[]
  settingsPanels?: SettingsPanelDefinition[]
  
  // Graph extensions
  customNodes?: CustomNodeDefinition[]
  nodeDecorators?: NodeDecoratorDefinition[]
}

// lib/extensions/registry.ts
class ExtensionRegistry {
  private extensions = new Map<string, ComfyUIExtension>()
  private sidebarTabs: SidebarTabDefinition[] = []
  private contextMenuItems: ContextMenuItemDefinition[] = []

  async register(extension: ComfyUIExtension): Promise<void> {
    const { manifest } = extension

    // Validate permissions
    this.validatePermissions(manifest.permissions)

    // Initialize
    await extension.onLoad?.()

    // Register UI components
    if (extension.sidebarTabs) {
      this.sidebarTabs.push(...extension.sidebarTabs)
    }
    if (extension.contextMenuItems) {
      this.contextMenuItems.push(...extension.contextMenuItems)
    }

    this.extensions.set(manifest.id, extension)
  }

  async unregister(extensionId: string): Promise<void> {
    const extension = this.extensions.get(extensionId)
    if (!extension) return

    await extension.onUnload?.()

    // Remove UI registrations
    this.sidebarTabs = this.sidebarTabs.filter(
      (tab) => !tab.id.startsWith(extensionId)
    )
    this.contextMenuItems = this.contextMenuItems.filter(
      (item) => !item.id.startsWith(extensionId)
    )

    this.extensions.delete(extensionId)
  }

  getSidebarTabs(): SidebarTabDefinition[] {
    return [...this.sidebarTabs]
  }

  getContextMenuItems(): ContextMenuItemDefinition[] {
    return [...this.contextMenuItems]
  }
}

export const extensionRegistry = new ExtensionRegistry()
```

---

## 7. Addressing Comfy's Proposed Features

### 7.1 Linear vs. Graph Mode

The current frontend uses a basic `toggleMode()` function that swaps visibility between two DOM elements. The React implementation provides:

**Better Mode Transitions**:

```typescript
// hooks/useCanvasMode.ts
import { useState, useCallback, useTransition } from 'react'
import { useGraphStore } from '@/stores/graphStore'

export type CanvasMode = 'graph' | 'linear'

export function useCanvasMode() {
  const [mode, setModeState] = useState<CanvasMode>('graph')
  const [isPending, startTransition] = useTransition()
  
  const setMode = useCallback((newMode: CanvasMode) => {
    // Use React 18 transitions for non-blocking mode switch
    startTransition(() => {
      setModeState(newMode)
    })
  }, [])

  const toggleMode = useCallback(() => {
    setMode(mode === 'graph' ? 'linear' : 'graph')
  }, [mode, setMode])

  return { mode, setMode, toggleMode, isTransitioning: isPending }
}
```

**View Transitions API Integration** (React 19):

```typescript
// components/CanvasContainer.tsx
'use client'

import { unstable_ViewTransition as ViewTransition } from 'react'
import { useCanvasMode } from '@/hooks/useCanvasMode'
import { GraphCanvas } from './GraphCanvas'
import { LinearCanvas } from './LinearCanvas'

export function CanvasContainer() {
  const { mode } = useCanvasMode()

  return (
    <ViewTransition>
      {mode === 'graph' ? <GraphCanvas /> : <LinearCanvas />}
    </ViewTransition>
  )
}
```

### 7.2 Real-Time Collaboration Architecture

React has mature collaboration solutions. Here's how we'd implement it using [Yjs](https://yjs.dev/):

```typescript
// lib/collaboration/store.ts
import { create } from 'zustand'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'

interface CollaborationState {
  doc: Y.Doc | null
  provider: WebsocketProvider | null
  awareness: Awareness | null
  users: Map<number, UserPresence>
  
  connect: (roomId: string, userId: string) => void
  disconnect: () => void
  updateCursor: (position: { x: number; y: number }) => void
}

export const useCollaboration = create<CollaborationState>((set, get) => ({
  doc: null,
  provider: null,
  awareness: null,
  users: new Map(),

  connect: (roomId, userId) => {
    const doc = new Y.Doc()
    const provider = new WebsocketProvider(
      process.env.NEXT_PUBLIC_COLLAB_URL!,
      roomId,
      doc
    )
    
    const awareness = provider.awareness
    awareness.setLocalStateField('user', {
      id: userId,
      name: 'Anonymous',
      color: getRandomColor(),
    })

    // Sync awareness updates
    awareness.on('change', () => {
      const users = new Map<number, UserPresence>()
      awareness.getStates().forEach((state, clientId) => {
        if (state.user) {
          users.set(clientId, state.user)
        }
      })
      set({ users })
    })

    set({ doc, provider, awareness })
  },

  disconnect: () => {
    const { provider } = get()
    provider?.destroy()
    set({ doc: null, provider: null, awareness: null, users: new Map() })
  },

  updateCursor: (position) => {
    const { awareness } = get()
    awareness?.setLocalStateField('cursor', position)
  },
}))
```

### 7.3 Custom Node Implementation

The React version provides a cleaner, more powerful custom node API:

```typescript
// lib/customNodes/registry.ts
import { ComponentType } from 'react'
import { NodeProps } from 'reactflow'

interface CustomNodeDefinition {
  type: string
  displayName: string
  category: string
  inputs: InputDefinition[]
  outputs: OutputDefinition[]
  widgets: WidgetDefinition[]
  component?: ComponentType<NodeProps>
  // Optional custom rendering
  renderHeader?: ComponentType<{ data: NodeData }>
  renderFooter?: ComponentType<{ data: NodeData }>
}

class CustomNodeRegistry {
  private nodes = new Map<string, CustomNodeDefinition>()

  register(definition: CustomNodeDefinition) {
    this.nodes.set(definition.type, definition)
    this.notifyListeners()
  }

  getNodeTypes(): Record<string, ComponentType<NodeProps>> {
    const types: Record<string, ComponentType<NodeProps>> = {}
    
    this.nodes.forEach((def, type) => {
      types[type] = def.component || createDefaultNodeComponent(def)
    })
    
    return types
  }
}

// Usage by extension developers
customNodeRegistry.register({
  type: 'my-extension/custom-loader',
  displayName: 'Custom Model Loader',
  category: 'loaders',
  inputs: [
    { name: 'model_path', type: 'STRING', widget: 'filepath' }
  ],
  outputs: [
    { name: 'MODEL', type: 'MODEL' }
  ],
  widgets: [
    { name: 'precision', type: 'combo', options: ['fp16', 'fp32'] }
  ],
  // Optional: provide custom component
  component: MyCustomLoaderNode
})
```

---

## 8. Graph Rendering Strategy

### 8.1 Option Analysis

| Option | Pros | Cons | Recommendation |
|--------|------|------|----------------|
| **[React Flow](https://reactflow.dev/)** | Production-ready, large community, TypeScript native, excellent docs | Some customization limits, commercial license for Pro features | **Primary choice** |
| **Custom Canvas + React** | Full control, no license concerns | Significant development effort, reinventing solved problems | Fallback option |
| **[Rete.js](https://rete.js.org/)** | Flexible, framework-agnostic | Smaller community, less polished | Not recommended |
| **[Cytoscape.js](https://js.cytoscape.org/)** | Powerful graph algorithms | Not designed for editable workflows | Not recommended |

### 8.2 React Flow Implementation

[React Flow](https://reactflow.dev/) is the clear winner for several reasons:

1. **Native React**: Components are React components
2. **Built-in features**: Minimap, controls, background patterns
3. **Customization**: Custom nodes, edges, handles, controls
4. **Performance**: Virtualization, efficient re-renders
5. **Accessibility**: Keyboard navigation, ARIA support
6. **Active development**: Regular updates, responsive maintainers

```tsx
// components/GraphCanvas/GraphCanvas.tsx
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  NodeTypes,
} from 'reactflow'
import 'reactflow/dist/style.css'

import { useGraphStore } from '@/stores/graphStore'
import { CustomNode } from './CustomNode'
import { CustomEdge } from './CustomEdge'

const nodeTypes: NodeTypes = {
  comfyNode: CustomNode,
}

const edgeTypes = {
  comfyEdge: CustomEdge,
}

export function GraphCanvas() {
  const { nodes, edges, addEdge: addGraphEdge } = useGraphStore()
  
  const reactFlowNodes = useMemo(
    () => Array.from(nodes.values()).map(nodeToReactFlowNode),
    [nodes]
  )
  
  const reactFlowEdges = useMemo(
    () => Array.from(edges.values()).map(edgeToReactFlowEdge),
    [edges]
  )

  const onConnect = useCallback(
    (connection: Connection) => {
      if (connection.source && connection.target) {
        addGraphEdge({
          source: connection.source,
          sourceHandle: connection.sourceHandle ?? 'default',
          target: connection.target,
          targetHandle: connection.targetHandle ?? 'default',
          animated: false,
        })
      }
    },
    [addGraphEdge]
  )

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={reactFlowNodes}
        edges={reactFlowEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onConnect={onConnect}
        fitView
        attributionPosition="bottom-left"
      >
        <Background variant="dots" gap={16} size={1} />
        <Controls />
        <MiniMap nodeStrokeWidth={3} zoomable pannable />
        <Panel position="top-right">
          <QueueControls />
        </Panel>
      </ReactFlow>
    </div>
  )
}
```

### 8.3 Custom Node Component

```tsx
// components/GraphCanvas/CustomNode.tsx
import { memo, useCallback } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { cn } from '@/lib/utils'
import { useGraphStore } from '@/stores/graphStore'

interface ComfyNodeData {
  label: string
  type: string
  widgets: WidgetConfig[]
  inputs: InputConfig[]
  outputs: OutputConfig[]
}

export const CustomNode = memo(function CustomNode({
  id,
  data,
  selected,
}: NodeProps<ComfyNodeData>) {
  const updateNode = useGraphStore((state) => state.updateNode)

  const handleWidgetChange = useCallback(
    (widgetId: string, value: unknown) => {
      updateNode(id, {
        data: {
          ...data,
          widgets: data.widgets.map((w) =>
            w.id === widgetId ? { ...w, value } : w
          ),
        },
      })
    },
    [id, data, updateNode]
  )

  return (
    <div
      className={cn(
        'rounded-lg border bg-card shadow-md min-w-[200px]',
        selected && 'ring-2 ring-primary'
      )}
    >
      {/* Node Header */}
      <div className="bg-muted px-3 py-2 rounded-t-lg border-b">
        <span className="font-medium text-sm">{data.label}</span>
      </div>

      {/* Inputs */}
      <div className="relative">
        {data.inputs.map((input, index) => (
          <div key={input.id} className="flex items-center px-3 py-1">
            <Handle
              type="target"
              position={Position.Left}
              id={input.id}
              className="!bg-primary !w-3 !h-3"
              style={{ top: 40 + index * 28 }}
            />
            <span className="text-xs text-muted-foreground ml-2">
              {input.label}
            </span>
          </div>
        ))}
      </div>

      {/* Widgets */}
      <div className="px-3 py-2 space-y-2">
        {data.widgets.map((widget) => (
          <WidgetRenderer
            key={widget.id}
            widget={widget}
            onChange={(value) => handleWidgetChange(widget.id, value)}
          />
        ))}
      </div>

      {/* Outputs */}
      <div className="relative">
        {data.outputs.map((output, index) => (
          <div
            key={output.id}
            className="flex items-center justify-end px-3 py-1"
          >
            <span className="text-xs text-muted-foreground mr-2">
              {output.label}
            </span>
            <Handle
              type="source"
              position={Position.Right}
              id={output.id}
              className="!bg-primary !w-3 !h-3"
              style={{ top: 40 + index * 28 }}
            />
          </div>
        ))}
      </div>
    </div>
  )
})
```

---

## 9. Migration Path

### 9.1 Parallel Development Strategy

We propose building the new frontend in parallel, not as a replacement of the existing codebase:

```
Month 1-2: Foundation
├── New Next.js project setup
├── Core state management (Zustand stores)
├── Basic React Flow integration
├── ComfyUI API client library
└── Authentication/session handling

Month 3-4: Core Features
├── Full node rendering (all standard node types)
├── Connection system
├── Widget implementations
├── Keyboard shortcuts
├── Undo/redo system
└── Workflow save/load

Month 5-6: Parity Features
├── Queue management
├── Node library sidebar
├── Search functionality
├── Settings panel
├── Mask editor
└── Image preview

Month 7-8: Extension System
├── Extension API implementation
├── Migration tools for Vue extensions
├── Documentation
├── Developer preview program
└── Community feedback integration

Month 9-10: Polish & Migration
├── Performance optimization
├── Accessibility audit
├── Internationalization
├── Desktop app integration
├── Migration scripts for workflows
└── Beta release

Month 11-12: Launch
├── Public release
├── Extension ecosystem migration support
├── Legacy frontend deprecation announcement
├── Long-term support plan
└── Contributor onboarding
```

### 9.2 Workflow Compatibility

Workflows are JSON files independent of frontend implementation. The new frontend will:

1. Read existing workflow JSON identically
2. Write workflow JSON in the same format
3. Provide migration tools for any necessary transformations
4. Support import/export with the legacy frontend

### 9.3 Extension Migration

For the existing custom node frontend extensions:

1. Automatic migration: Simple DOM-based extensions can be auto-converted
2. Migration guide: Documentation for manual conversion
3. Compatibility layer: Temporary shim for Vue components (limited support)
4. Incentive program: Fast-track review for migrated extensions

---

## 10. Resource Requirements Preliminary Estimate

### 10.1 Team Composition

| Role                                                             | Count | Duration  |
| ---------------------------------------------------------------- | ----- | --------- |
| Team Lead: Senior React Full-Stack Engineer and Technical Writer | 1     | 12 months |
| React Frontend Engineer                                          | 1     | 12 months |
| UI/UX Designer                                                   | 1     | 3 months  |
| DevOps Engineer                                                  | 0.25  | 12 months |

This team structure emphasizes senior technical leadership, focused frontend execution, short-term design support, and fractional DevOps coverage to ensure delivery quality without unnecessary overhead.

**FTE summary (for planning consistency)**:
1. Months 1–3: 2.25 FTE (Team Lead + Frontend + UI/UX + 0.25 DevOps)
2. Months 4–12: 2.25 FTE (Team Lead + Frontend + 0.25 DevOps)

---

### 10.2 Infrastructure

The project will require standard, industry-accepted infrastructure to support development, testing, staging, and documentation. Specific tooling and configuration will be aligned with your existing environment and preferences.

Infrastructure requirements include:
1. Development environments
2. Continuous integration and delivery (CI/CD)
3. Testing infrastructure
4. Staging environments
5. Documentation hosting

Infrastructure scope and configuration will be finalized during project onboarding.

---

### 10.3 Investment Assessment Approach

Rather than presenting fixed or speculative cost estimates at this stage, total investment will be assessed using **Comfy AI's internal cost modeling**, ensuring alignment with your budgeting standards, compensation bands, and infrastructure pricing.

I am happy to assist with:
1. Translating roles and durations into your internal cost models
2. Validating assumptions against market norms
3. Adjusting scope to match budget constraints
4. Exploring phased or milestone-based staffing options

---

### 10.4 Cost Justification

1. Senior technical leadership reduces architectural risk and rework.
2. Dedicated frontend capacity accelerates feature delivery.
3. Time-boxed design involvement prevents long-term UX debt.
4. Fractional DevOps support ensures reliability without full-time overhead.
5. Lean infrastructure planning avoids premature commitment.

---

### 10.5 ROI Analysis

**Current maintenance burden**:
1. Limited specialist talent pool increases hiring friction.
2. Slower bug resolution due to architectural constraints.
3. Feature delivery delayed by accumulated technical debt.
4. Reduced external contributions due to ecosystem barriers.

**Post-rebuild benefits**:
1. Significantly larger talent pool for hiring and contributors.
2. Faster development enabled by modern tooling and AI-assisted workflows.
3. Reduced bug density from cleaner architecture.
4. Increased maintainability and community engagement.

**Break-even horizon**: To be evaluated post-scope confirmation and cost modeling.

---

## 11. Risk Analysis

### 11.1 Risk Matrix

> **Note**: The probability assessments below reflect the author's professional judgment based on similar project experience. [Author Assessment]

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Timeline overrun | Medium | High | Parallel development, MVP-first approach |
| Extension ecosystem fragmentation | Medium | High | Migration tools, incentive program, compatibility layer |
| Community resistance | Low | Medium | Transparent communication, beta program |
| Performance regression | Low | High | Comprehensive benchmarking, optimization phase |
| Key developer departure | Low | High | Documentation, knowledge sharing, pair programming |
| React ecosystem shift | Very Low | High | Framework-agnostic core, minimal lock-in |

### 11.2 Mitigation Strategies

**Timeline Risk**:
- Define clear MVP scope
- Weekly milestone reviews
- Parallel workstreams
- Early community feedback

**Extension Ecosystem Risk**:
- Early developer preview (month 7)
- Migration automation tools
- Financial incentives for key extensions
- Dedicated support channel

**Community Risk**:
- Transparent RFC process (this document)
- Public roadmap
- Regular progress updates
- Beta access for power users

---

## 12. Success Metrics

### 12.1 Development Metrics

> **Note**: Current metrics are estimates and should be validated during the POC phase. Target metrics represent goals based on industry standards.

| Metric | Target | Timeline |
|--------|--------|----------|
| Build time | <15s | Month 3 |
| Hot reload | <500ms | Month 2 |
| Type coverage | >95% | Month 4 |
| Test coverage | >80% | Month 6 |

### 12.2 Performance Targets

| Metric | Target | Timeline |
|--------|--------|----------|
| Initial load (TTI) | <2s | Month 8 |
| Node render (1000 nodes) | <100ms | Month 6 |
| Memory (1000 nodes) | <300MB | Month 8 |
| Frame rate (interaction) | 60fps | Month 6 |

### 12.3 Ecosystem Targets

| Metric | Target | Timeline |
|--------|--------|----------|
| Extensions migrated | 50% | Month 10 |
| Extensions migrated | 80% | Month 12 |
| New extension submissions | +50% | Month 14 |
| Contributor PRs | +100% | Month 14 |

### 12.4 User Targets

| Metric | Target | Timeline |
|--------|--------|----------|
| Beta user satisfaction | >4.0/5 | Month 10 |
| Bug reports (critical) | <10/month | Month 12 |
| Feature requests implemented | +30% | Month 14 |

---

## 13. Conclusion

### The Case for React

1. **Ecosystem**: [npm downloads ~7x higher than Vue](https://npmtrends.com/react-vs-vue)
2. **Talent**: Significantly more developers available
3. **Tooling**: AI coding assistants have substantially more training data
4. **Stability**: Meta backing, massive enterprise adoption
5. **Community**: More tutorials, examples, Stack Overflow answers

### The Case Against WASM+Rust

1. **Wrong bottleneck**: Rendering is the constraint, not computation
2. **Development velocity**: Slower iteration cycles
3. **Talent scarcity**: Combined expertise is exceptionally rare
4. **Ecosystem isolation**: Cannot leverage npm packages
5. **Debugging difficulty**: Primitive compared to browser DevTools

### The Path Forward

ComfyUI deserves a frontend architecture that:
- Attracts the best developers
- Enables rapid feature development
- Leverages AI coding assistance
- Supports a thriving extension ecosystem
- Will remain maintainable for years to come

React/Next.js delivers on all of these requirements. Vue+incremental fixes and WASM+Rust do not.

### Call to Action

We request:

1. **Review period**: 30 days for community feedback on this RFC
2. **Technical discussion**: AMA session with core team
3. **Proof of concept**: 4-week spike to demonstrate React Flow integration
4. **Decision point**: Go/no-go decision after POC review

The time to make this investment is now, while ComfyUI's market position is strong and before technical debt compounds further.

---

## Appendix A: Technology Comparison Matrix

> **Disclaimer**: Ratings reflect the author's assessment based on available evidence and professional experience. They are subjective evaluations, not objective measurements. [Author Assessment]

| Criterion | React/Next.js | Vue 3 (Current) | WASM+Rust |
|-----------|---------------|-----------------|-----------|
| **Ecosystem Size** | ★★★★★ | ★★★☆☆ | ★★☆☆☆ |
| **Talent Pool** | ★★★★★ | ★★★☆☆ | ★☆☆☆☆ |
| **AI Tooling Support** | ★★★★★ | ★★★☆☆ | ★★☆☆☆ |
| **Development Velocity** | ★★★★★ | ★★★★☆ | ★★☆☆☆ |
| **Runtime Performance** | ★★★★☆ | ★★★★☆ | ★★★★★ |
| **Bundle Size** | ★★★★☆ | ★★★★★ | ★★★☆☆ |
| **Debugging** | ★★★★★ | ★★★★☆ | ★★☆☆☆ |
| **Type Safety** | ★★★★★ | ★★★★☆ | ★★★★★ |
| **Long-term Viability** | ★★★★★ | ★★★★☆ | ★★★☆☆ |
| **Extension Ecosystem** | ★★★★★ | ★★★☆☆ | ★☆☆☆☆ |

---

## Appendix B: Reference Implementations

### Successful React-Based Graph/Workflow Editors

1. **[n8n](https://github.com/n8n-io/n8n)** - Workflow automation platform (164K+ GitHub stars, React/TypeScript)
2. **[Retool Workflows](https://retool.com/products/workflows)** - Business process automation
3. **[Prefect](https://github.com/PrefectHQ/prefect)** - Data pipeline orchestration
4. **[Dagster](https://github.com/dagster-io/dagster)** - Data orchestration platform
5. **[Windmill](https://github.com/windmill-labs/windmill)** - Developer platform

### Projects Using React for Complex Interfaces

1. **[Vercel](https://vercel.com)** - Deployment platform
2. **[Supabase Studio](https://github.com/supabase/supabase)** - Database management
3. **[Linear](https://linear.app)** - Project management
4. **[Figma](https://figma.com)** - Design tool (React + Canvas)
5. **[Notion](https://notion.so)** - Collaboration tool

---

## Appendix C: Glossary

| Term | Definition |
|------|------------|
| **RFC** | Request for Comments - formal proposal document |
| **WASM** | [WebAssembly](https://webassembly.org/) - binary instruction format for browsers |
| **Zustand** | [Lightweight React state management library](https://zustand-demo.pmnd.rs/) |
| **React Flow** | [React library for building node-based editors](https://reactflow.dev/) |
| **LiteGraph** | [JavaScript library for graph-based interfaces](https://github.com/jagenjo/litegraph.js) |
| **TTI** | Time to Interactive - page load metric |
| **POC** | Proof of Concept - limited implementation to validate approach |

---

## Appendix D: Sources and Citations

### Independent Validation

This RFC's statistical claims were independently fact-checked by Google Gemini (December 2025). Key findings:

> "The conclusions in the RFC-001 technical proposal are strongly supported by the evidence. The author's argument for switching to React based on job market availability and ecosystem size is actually **under-represented** by their conservative numbers; the reality in late 2025 shows an even wider gap in professional demand and library usage than the proposal claimed."

### Verified Data Sources

**[1] npm Download Statistics** [Verified - December 2025]
- React: ~57.8M weekly downloads
- Vue: ~7.9M weekly downloads  
- Angular (@angular/core): ~4.6M weekly downloads
- Sources: 
  - [npmtrends.com](https://npmtrends.com/react-vs-vue-vs-@angular/core)
  - [npm-stat.com (React)](https://npm-stat.com/charts.html?package=react)
  - [npm-stat.com (Vue)](https://npm-stat.com/charts.html?package=vue)

**[2] Stack Overflow Developer Survey 2024** [Verified]
- React: 39.5% usage among web developers
- Vue.js: 15.4% usage among web developers
- Angular: 17.1% usage among web developers
- "Rust continues to be the most-admired programming language with an 83% score"
- Source: [survey.stackoverflow.co/2024](https://survey.stackoverflow.co/2024)

**[3] Stack Overflow Developer Survey 2025** [Verified]
- React: 44.7% usage among web developers
- Vue.js: 16.6% usage among web developers
- Rust's Cargo is the most admired (71%) cloud development and infrastructure tool
- Sources:
  - [survey.stackoverflow.co/2025](https://survey.stackoverflow.co/2025)
  - [2024 Archive](https://survey.stackoverflow.co/2024) (for comparison)

**[4] Global Job Market Data** [Verified - December 2025]
- React: 126,000+ job postings (~52% of frontend jobs)
- Vue: 24,000+ job postings (~10% of frontend jobs)
- Analysis based on 250,000+ job offers
- Source: [devjobsscanner.com](https://www.devjobsscanner.com/)

**[5] GitHub Repository Statistics** [Verified]
- React: 234,000+ stars on core repository
- Vue: 208,000+ stars on core repository
- Sources:
  - [GitHub Octoverse 2025](https://github.blog/news-insights/octoverse/)
  - [ElectroIQ GitHub Stats](https://electroiq.com/)

**[6] Rust Developer Statistics** [Verified]
- 12.6% of surveyed developers used Rust in 2024 (Stack Overflow)
- 10-13% of software developers work with Rust regularly (JetBrains)
- 45.5% of Rust developers worry about "not enough usage in tech industry"
- Sources: 
  - [Stack Overflow Developer Survey 2024](https://survey.stackoverflow.co/2024)
  - [JetBrains State of Developer Ecosystem 2024](https://www.jetbrains.com/lp/devecosystem-2024/)
  - [State of Rust Survey 2024](https://blog.rust-lang.org/2025/02/13/2024-State-Of-Rust-Survey-results.html)

**[7] ComfyUI Statistics** [Verified - September 2025]
- 89,200+ GitHub stars
- One of the most popular user interfaces for Stable Diffusion
- August 2024: Transitioned to new frontend hosted in separate repository (ComfyUI_frontend)
- Sources:
  - [Wikipedia - ComfyUI](https://en.wikipedia.org/wiki/ComfyUI)
  - [GitHub - comfyanonymous/ComfyUI](https://github.com/comfyanonymous/ComfyUI)
  - [GitHub - Comfy-Org/ComfyUI_frontend](https://github.com/Comfy-Org/ComfyUI_frontend)

**[8] LiteGraph.js Status** [Verified]
- npm: Last publish ~2 years ago (v0.7.18)
- Comfy-Org has forked and maintains their own modified version
- Sources:
  - [npmjs.com - litegraph.js](https://www.npmjs.com/package/litegraph.js)
  - [GitHub - jagenjo/litegraph.js](https://github.com/jagenjo/litegraph.js)

**[9] State Management Bundle Sizes** [Verified]
- Zustand: ~3.1KB minified - [bundlephobia](https://bundlephobia.com/package/zustand)
- Redux Toolkit: ~40KB minified - [bundlephobia](https://bundlephobia.com/package/@reduxjs/toolkit)
- Jotai: ~3-4KB minified - [bundlephobia](https://bundlephobia.com/package/jotai)
- Recoil: ~14-21KB minified - [bundlephobia](https://bundlephobia.com/package/recoil)

**[10] n8n Statistics** [Verified]
- 164,600+ GitHub stars
- React/TypeScript-based workflow automation platform
- 400+ integrations
- Sources:
  - [n8n.io](https://n8n.io/)
  - [GitHub - n8n-io/n8n](https://github.com/n8n-io/n8n)

**[11] React Flow** [Verified]
- React library for building node-based editors
- Source: [reactflow.dev](https://reactflow.dev/) / [GitHub - xyflow/xyflow](https://github.com/xyflow/xyflow)

### Author Assessments

The following claims are based on the author's professional judgment and experience:

- AI coding assistant effectiveness comparisons (React vs Vue)
- Development velocity estimates
- Risk probability assessments
- Star ratings in Technology Comparison Matrix
- Performance benchmark targets

### Data Not Independently Verified

The following claims may require additional verification:

- Current ComfyUI frontend performance metrics
- Next.js feature performance claims

