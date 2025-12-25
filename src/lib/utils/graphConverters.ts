// Graph data format converters

import type { GraphNode, GraphEdge } from '@/types/graph'
import type { Node, Edge } from 'reactflow'

// Convert internal GraphNode to React Flow Node
export function toReactFlowNode(node: GraphNode): Node {
  return {
    id: node.id,
    type: node.type,
    position: node.position,
    data: node.data,
    width: node.width,
    height: node.height,
  }
}

// Convert React Flow Node to internal GraphNode
export function fromReactFlowNode(node: Node): GraphNode {
  return {
    id: node.id,
    type: node.type || 'default',
    position: node.position,
    data: node.data,
    width: node.width,
    height: node.height,
  }
}

// Convert internal GraphEdge to React Flow Edge
export function toReactFlowEdge(edge: GraphEdge): Edge {
  return {
    id: edge.id,
    source: edge.source,
    sourceHandle: edge.sourceHandle,
    target: edge.target,
    targetHandle: edge.targetHandle,
    type: edge.type,
  }
}

// Convert React Flow Edge to internal GraphEdge
export function fromReactFlowEdge(edge: Edge): GraphEdge {
  return {
    id: edge.id,
    source: edge.source,
    sourceHandle: edge.sourceHandle || '',
    target: edge.target,
    targetHandle: edge.targetHandle || '',
    type: edge.type,
  }
}

// Convert to ComfyUI API format
export function toComfyUIWorkflow(
  nodes: Map<string, GraphNode>,
  edges: Map<string, GraphEdge>
): Record<string, unknown> {
  const workflow: Record<string, unknown> = {}

  nodes.forEach((node, id) => {
    const nodeInputs: Record<string, unknown> = {}

    // Process widget values
    node.data.widgets.forEach((widget) => {
      nodeInputs[widget.name] = widget.value
    })

    // Process connections
    node.data.inputs.forEach((input) => {
      if (input.link) {
        const edge = edges.get(input.link)
        if (edge) {
          const sourceNode = nodes.get(edge.source)
          if (sourceNode) {
            const outputIndex = sourceNode.data.outputs.findIndex(
              (o) => o.name === edge.sourceHandle
            )
            nodeInputs[input.name] = [edge.source, outputIndex]
          }
        }
      }
    })

    workflow[id] = {
      class_type: node.type,
      inputs: nodeInputs,
    }
  })

  return workflow
}

// Parse ComfyUI API workflow format
export function fromComfyUIWorkflow(
  workflow: Record<string, { class_type: string; inputs: Record<string, unknown> }>,
  nodeDefinitions: Record<string, unknown>
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodes: GraphNode[] = []
  const edges: GraphEdge[] = []
  let edgeId = 0

  // First pass: create nodes
  Object.entries(workflow).forEach(([id, nodeData], index) => {
    const node: GraphNode = {
      id,
      type: nodeData.class_type,
      position: { x: index * 300, y: 0 }, // Default positioning
      data: {
        title: nodeData.class_type,
        inputs: [],
        outputs: [],
        widgets: [],
        properties: {},
      },
    }
    nodes.push(node)
  })

  // Second pass: create edges from input connections
  Object.entries(workflow).forEach(([targetId, nodeData]) => {
    Object.entries(nodeData.inputs).forEach(([inputName, value]) => {
      if (Array.isArray(value) && value.length === 2) {
        const [sourceId, outputIndex] = value as [string, number]
        edges.push({
          id: `edge_${edgeId++}`,
          source: String(sourceId),
          sourceHandle: `output_${outputIndex}`,
          target: targetId,
          targetHandle: inputName,
        })
      }
    })
  })

  return { nodes, edges }
}

// Convert to/from JSON for save/load
export function serializeGraph(
  nodes: Map<string, GraphNode>,
  edges: Map<string, GraphEdge>
): string {
  return JSON.stringify({
    nodes: Array.from(nodes.values()),
    edges: Array.from(edges.values()),
    version: 1,
  })
}

export function deserializeGraph(json: string): {
  nodes: GraphNode[]
  edges: GraphEdge[]
} {
  const data = JSON.parse(json)
  return {
    nodes: data.nodes || [],
    edges: data.edges || [],
  }
}
