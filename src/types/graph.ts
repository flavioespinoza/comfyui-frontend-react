// Graph, node, edge, widget types

export interface GraphNode {
  id: string
  type: string
  position: { x: number; y: number }
  data: NodeData
  width?: number
  height?: number
}

export interface NodeData {
  title: string
  inputs: NodeInput[]
  outputs: NodeOutput[]
  widgets: Widget[]
  properties: Record<string, unknown>
}

export interface NodeInput {
  name: string
  type: string
  link: string | null
}

export interface NodeOutput {
  name: string
  type: string
  links: string[]
}

export interface Widget {
  name: string
  type: WidgetType
  value: unknown
  options?: WidgetOptions
}

export type WidgetType =
  | 'number'
  | 'text'
  | 'select'
  | 'slider'
  | 'toggle'
  | 'color'
  | 'image'
  | 'combo'

export interface WidgetOptions {
  min?: number
  max?: number
  step?: number
  choices?: string[]
  placeholder?: string
  multiline?: boolean
}

export interface GraphEdge {
  id: string
  source: string
  sourceHandle: string
  target: string
  targetHandle: string
  type?: string
}

export interface GraphSnapshot {
  nodes: Map<string, GraphNode>
  edges: Map<string, GraphEdge>
}

export interface Viewport {
  x: number
  y: number
  zoom: number
}

export interface Clipboard {
  nodes: GraphNode[]
  edges: GraphEdge[]
}
