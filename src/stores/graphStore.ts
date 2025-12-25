import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { enableMapSet } from 'immer'
import { nanoid } from 'nanoid'
import type { GraphNode, GraphEdge, GraphSnapshot, Viewport, Clipboard } from '@/types/graph'

// Enable Immer support for Map and Set
enableMapSet()

interface GraphState {
  nodes: Map<string, GraphNode>
  edges: Map<string, GraphEdge>
  selectedNodeIds: Set<string>
  clipboard: Clipboard | null
  viewport: Viewport
  past: GraphSnapshot[]
  future: GraphSnapshot[]

  // Actions
  addNode: (node: Omit<GraphNode, 'id'>) => string
  updateNode: (id: string, updates: Partial<GraphNode>) => void
  deleteNodes: (ids: string[]) => void
  addEdge: (edge: Omit<GraphEdge, 'id'>) => string
  deleteEdges: (ids: string[]) => void
  selectNodes: (ids: string[], additive?: boolean) => void
  clearSelection: () => void
  copySelection: () => void
  paste: (position: { x: number; y: number }) => void
  undo: () => void
  redo: () => void
  setViewport: (viewport: Viewport) => void
  loadGraph: (nodes: GraphNode[], edges: GraphEdge[]) => void
  clearGraph: () => void
}

const MAX_HISTORY = 50

const createSnapshot = (nodes: Map<string, GraphNode>, edges: Map<string, GraphEdge>): GraphSnapshot => ({
  nodes: new Map(nodes),
  edges: new Map(edges),
})

export const useGraphStore = create<GraphState>()(
  immer((set, get) => ({
    nodes: new Map(),
    edges: new Map(),
    selectedNodeIds: new Set(),
    clipboard: null,
    viewport: { x: 0, y: 0, zoom: 1 },
    past: [],
    future: [],

    addNode: (node) => {
      const id = nanoid()
      set((state) => {
        state.past.push(createSnapshot(state.nodes, state.edges))
        if (state.past.length > MAX_HISTORY) state.past.shift()
        state.future = []
        state.nodes.set(id, { ...node, id })
      })
      return id
    },

    updateNode: (id, updates) => {
      set((state) => {
        const node = state.nodes.get(id)
        if (node) {
          state.past.push(createSnapshot(state.nodes, state.edges))
          if (state.past.length > MAX_HISTORY) state.past.shift()
          state.future = []
          state.nodes.set(id, { ...node, ...updates })
        }
      })
    },

    deleteNodes: (ids) => {
      set((state) => {
        state.past.push(createSnapshot(state.nodes, state.edges))
        if (state.past.length > MAX_HISTORY) state.past.shift()
        state.future = []
        ids.forEach((id) => {
          state.nodes.delete(id)
          state.selectedNodeIds.delete(id)
        })
        // Remove edges connected to deleted nodes
        const edgesToDelete: string[] = []
        state.edges.forEach((edge: GraphEdge, edgeId: string) => {
          if (ids.includes(edge.source) || ids.includes(edge.target)) {
            edgesToDelete.push(edgeId)
          }
        })
        edgesToDelete.forEach((edgeId: string) => state.edges.delete(edgeId))
      })
    },

    addEdge: (edge) => {
      const id = nanoid()
      set((state) => {
        state.past.push(createSnapshot(state.nodes, state.edges))
        if (state.past.length > MAX_HISTORY) state.past.shift()
        state.future = []
        state.edges.set(id, { ...edge, id })
      })
      return id
    },

    deleteEdges: (ids) => {
      set((state) => {
        state.past.push(createSnapshot(state.nodes, state.edges))
        if (state.past.length > MAX_HISTORY) state.past.shift()
        state.future = []
        ids.forEach((id) => state.edges.delete(id))
      })
    },

    selectNodes: (ids, additive = false) => {
      set((state) => {
        if (!additive) {
          state.selectedNodeIds.clear()
        }
        ids.forEach((id) => state.selectedNodeIds.add(id))
      })
    },

    clearSelection: () => {
      set((state) => {
        state.selectedNodeIds.clear()
      })
    },

    copySelection: () => {
      const { nodes, edges, selectedNodeIds } = get()
      const selectedNodes = Array.from(selectedNodeIds)
        .map((id) => nodes.get(id))
        .filter((node): node is GraphNode => node !== undefined)

      const selectedEdges = Array.from(edges.values()).filter(
        (edge) => selectedNodeIds.has(edge.source) && selectedNodeIds.has(edge.target)
      )

      set((state) => {
        state.clipboard = { nodes: selectedNodes, edges: selectedEdges }
      })
    },

    paste: (position) => {
      const { clipboard } = get()
      if (!clipboard || clipboard.nodes.length === 0) return

      set((state) => {
        state.past.push(createSnapshot(state.nodes, state.edges))
        if (state.past.length > MAX_HISTORY) state.past.shift()
        state.future = []

        const idMap = new Map<string, string>()
        const offsetX = position.x - clipboard.nodes[0].position.x
        const offsetY = position.y - clipboard.nodes[0].position.y

        // Paste nodes with new IDs
        clipboard.nodes.forEach((node) => {
          const newId = nanoid()
          idMap.set(node.id, newId)
          state.nodes.set(newId, {
            ...node,
            id: newId,
            position: {
              x: node.position.x + offsetX,
              y: node.position.y + offsetY,
            },
          })
        })

        // Paste edges with updated references
        clipboard.edges.forEach((edge) => {
          const newSource = idMap.get(edge.source)
          const newTarget = idMap.get(edge.target)
          if (newSource && newTarget) {
            const newId = nanoid()
            state.edges.set(newId, {
              ...edge,
              id: newId,
              source: newSource,
              target: newTarget,
            })
          }
        })

        // Select pasted nodes
        state.selectedNodeIds.clear()
        idMap.forEach((newId) => state.selectedNodeIds.add(newId))
      })
    },

    undo: () => {
      const { past, nodes, edges } = get()
      if (past.length === 0) return

      set((state) => {
        const previous = state.past.pop()
        if (previous) {
          state.future.push(createSnapshot(nodes, edges))
          state.nodes = previous.nodes
          state.edges = previous.edges
        }
      })
    },

    redo: () => {
      const { future, nodes, edges } = get()
      if (future.length === 0) return

      set((state) => {
        const next = state.future.pop()
        if (next) {
          state.past.push(createSnapshot(nodes, edges))
          state.nodes = next.nodes
          state.edges = next.edges
        }
      })
    },

    setViewport: (viewport) => {
      set((state) => {
        state.viewport = viewport
      })
    },

    loadGraph: (nodes, edges) => {
      set((state) => {
        state.nodes.clear()
        state.edges.clear()
        state.past = []
        state.future = []
        state.selectedNodeIds.clear()
        nodes.forEach((node) => state.nodes.set(node.id, node))
        edges.forEach((edge) => state.edges.set(edge.id, edge))
      })
    },

    clearGraph: () => {
      set((state) => {
        state.past.push(createSnapshot(state.nodes, state.edges))
        if (state.past.length > MAX_HISTORY) state.past.shift()
        state.future = []
        state.nodes.clear()
        state.edges.clear()
        state.selectedNodeIds.clear()
      })
    },
  }))
)
