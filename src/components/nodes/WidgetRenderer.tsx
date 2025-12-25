'use client'

// Widget type renderer

import { memo } from 'react'
import type { Widget } from '@/types/graph'

interface WidgetRendererProps {
  widget: Widget
  onChange: (value: unknown) => void
}

function WidgetRendererComponent({ widget, onChange }: WidgetRendererProps) {
  const { name, type, value, options } = widget

  switch (type) {
    case 'number':
      return (
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">{name}</label>
          <input
            type="number"
            value={value as number}
            min={options?.min}
            max={options?.max}
            step={options?.step || 1}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-full px-2 py-1 text-sm rounded border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      )

    case 'text':
      if (options?.multiline) {
        return (
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">{name}</label>
            <textarea
              value={value as string}
              placeholder={options?.placeholder}
              onChange={(e) => onChange(e.target.value)}
              rows={3}
              className="w-full px-2 py-1 text-sm rounded border bg-background resize-y focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        )
      }
      return (
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">{name}</label>
          <input
            type="text"
            value={value as string}
            placeholder={options?.placeholder}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-2 py-1 text-sm rounded border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      )

    case 'select':
    case 'combo':
      return (
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">{name}</label>
          <select
            value={value as string}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-2 py-1 text-sm rounded border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {options?.choices?.map((choice) => (
              <option key={choice} value={choice}>
                {choice}
              </option>
            ))}
          </select>
        </div>
      )

    case 'slider':
      return (
        <div className="space-y-1">
          <div className="flex justify-between">
            <label className="text-xs text-muted-foreground">{name}</label>
            <span className="text-xs">{value as number}</span>
          </div>
          <input
            type="range"
            value={value as number}
            min={options?.min ?? 0}
            max={options?.max ?? 100}
            step={options?.step ?? 1}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
      )

    case 'toggle':
      return (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={value as boolean}
            onChange={(e) => onChange(e.target.checked)}
            className="rounded"
          />
          <span className="text-xs text-muted-foreground">{name}</span>
        </label>
      )

    case 'color':
      return (
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">{name}</label>
          <div className="flex gap-2">
            <input
              type="color"
              value={value as string}
              onChange={(e) => onChange(e.target.value)}
              className="w-8 h-8 rounded border cursor-pointer"
            />
            <input
              type="text"
              value={value as string}
              onChange={(e) => onChange(e.target.value)}
              className="flex-1 px-2 py-1 text-sm rounded border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      )

    case 'image':
      return (
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">{name}</label>
          <div className="border rounded p-2 text-center">
            {value ? (
              <img
                src={value as string}
                alt={name}
                className="max-w-full h-auto rounded"
              />
            ) : (
              <span className="text-xs text-muted-foreground">No image</span>
            )}
          </div>
        </div>
      )

    default:
      return (
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">{name}</label>
          <div className="text-xs text-muted-foreground italic">
            Unknown widget type: {type}
          </div>
        </div>
      )
  }
}

export const WidgetRenderer = memo(WidgetRendererComponent)
