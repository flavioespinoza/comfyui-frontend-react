'use client'

// Custom node component

import { memo, useCallback } from 'react'
import { Handle, Position, type NodeProps } from 'reactflow'
import { useGraphStore } from '@/stores'
import { WidgetRenderer } from './WidgetRenderer'
import type { NodeData } from '@/types/graph'

function ComfyNodeComponent({ id, data, selected }: NodeProps<NodeData>) {
  const { updateNode } = useGraphStore()

  const handleWidgetChange = useCallback(
    (widgetName: string, value: unknown) => {
      updateNode(id, {
        data: {
          ...data,
          widgets: data.widgets.map((w) =>
            w.name === widgetName ? { ...w, value } : w
          ),
        },
      })
    },
    [id, data, updateNode]
  )

  return (
    <div
      className={`
        min-w-[200px] rounded-lg border bg-background shadow-lg
        ${selected ? 'ring-2 ring-primary border-primary' : 'border-border'}
      `}
    >
      {/* Header */}
      <div className="px-3 py-2 border-b bg-muted/50 rounded-t-lg">
        <h3 className="font-medium text-sm truncate">{data.title}</h3>
      </div>

      {/* Content */}
      <div className="p-2 space-y-2">
        {/* Inputs */}
        {data.inputs.map((input, index) => (
          <div key={input.name} className="relative flex items-center">
            <Handle
              type="target"
              position={Position.Left}
              id={input.name}
              className="!w-3 !h-3 !bg-blue-500 !border-2 !border-background"
              style={{ top: 'auto', left: -6 }}
            />
            <span className="text-xs text-muted-foreground pl-2">
              {input.name}
            </span>
          </div>
        ))}

        {/* Widgets */}
        {data.widgets.map((widget) => (
          <WidgetRenderer
            key={widget.name}
            widget={widget}
            onChange={(value) => handleWidgetChange(widget.name, value)}
          />
        ))}

        {/* Outputs */}
        {data.outputs.map((output, index) => (
          <div key={output.name} className="relative flex items-center justify-end">
            <span className="text-xs text-muted-foreground pr-2">
              {output.name}
            </span>
            <Handle
              type="source"
              position={Position.Right}
              id={output.name}
              className="!w-3 !h-3 !bg-green-500 !border-2 !border-background"
              style={{ top: 'auto', right: -6 }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export const ComfyNode = memo(ComfyNodeComponent)
