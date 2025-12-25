'use client'

// Main React Flow canvas

import { useCallback, useMemo } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  type NodeTypes,
  type EdgeTypes,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
} from 'reactflow'
import 'reactflow/dist/style.css'

import { useGraphStore } from '@/stores'
import { toReactFlowNode, toReactFlowEdge, fromReactFlowNode, fromReactFlowEdge } from '@/lib/utils'
import { ComfyNode } from '@/components/nodes'
import { ComfyEdge } from './ComfyEdge'

const nodeTypes: NodeTypes = {
  comfy: ComfyNode,
}

const edgeTypes: EdgeTypes = {
  comfy: ComfyEdge,
}

interface GraphCanvasProps {
  className?: string
}

export function GraphCanvas({ className }: GraphCanvasProps) {
  const {
    nodes: storeNodes,
    edges: storeEdges,
    selectedNodeIds,
    viewport,
    addNode,
    updateNode,
    deleteNodes,
    addEdge: addStoreEdge,
    deleteEdges,
    selectNodes,
    setViewport,
  } = useGraphStore()

  // Convert store data to React Flow format
  const nodes = useMemo(
    () =>
      Array.from(storeNodes.values()).map((node) => ({
        ...toReactFlowNode(node),
        selected: selectedNodeIds.has(node.id),
      })),
    [storeNodes, selectedNodeIds]
  )

  const edges = useMemo(
    () => Array.from(storeEdges.values()).map(toReactFlowEdge),
    [storeEdges]
  )

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
      changes.forEach((change) => {
        if (change.type === 'position' && change.position) {
          updateNode(change.id, { position: change.position })
        } else if (change.type === 'remove') {
          deleteNodes([change.id])
        } else if (change.type === 'select') {
          if (change.selected) {
            selectNodes([change.id], true)
          }
        }
      })
    },
    [updateNode, deleteNodes, selectNodes]
  )

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      changes.forEach((change) => {
        if (change.type === 'remove') {
          deleteEdges([change.id])
        }
      })
    },
    [deleteEdges]
  )

  const onConnect: OnConnect = useCallback(
    (connection) => {
      if (connection.source && connection.target) {
        addStoreEdge({
          source: connection.source,
          sourceHandle: connection.sourceHandle || '',
          target: connection.target,
          targetHandle: connection.targetHandle || '',
          type: 'comfy',
        })
      }
    },
    [addStoreEdge]
  )

  const onMoveEnd = useCallback(
    (_: unknown, vp: { x: number; y: number; zoom: number }) => {
      setViewport(vp)
    },
    [setViewport]
  )

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      const nodeType = event.dataTransfer.getData('application/comfynode')
      if (!nodeType) return

      const reactFlowBounds = (event.target as HTMLElement)
        .closest('.react-flow')
        ?.getBoundingClientRect()

      if (!reactFlowBounds) return

      const position = {
        x: event.clientX - reactFlowBounds.left - viewport.x,
        y: event.clientY - reactFlowBounds.top - viewport.y,
      }

      addNode({
        type: 'comfy',
        position,
        data: {
          title: nodeType,
          inputs: [],
          outputs: [],
          widgets: [],
          properties: {},
        },
      })
    },
    [addNode, viewport]
  )

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  return (
    <div className={className} onDrop={onDrop} onDragOver={onDragOver}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onMoveEnd={onMoveEnd}
        defaultViewport={viewport}
        fitView
        snapToGrid
        snapGrid={[16, 16]}
        minZoom={0.1}
        maxZoom={4}
        deleteKeyCode={['Backspace', 'Delete']}
        multiSelectionKeyCode="Shift"
      >
        <Background gap={16} size={1} />
        <Controls />
        <MiniMap
          nodeStrokeWidth={3}
          zoomable
          pannable
          className="bg-background/80"
        />
      </ReactFlow>
    </div>
  )
}
