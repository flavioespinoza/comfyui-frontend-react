'use client'

// Node search and drag-drop

import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'

interface NodeDefinition {
  type: string
  label: string
  category: string
  description?: string
}

// Placeholder node definitions - will be populated from ComfyUI API
const defaultNodes: NodeDefinition[] = [
  { type: 'KSampler', label: 'KSampler', category: 'sampling', description: 'Main sampling node' },
  { type: 'CheckpointLoaderSimple', label: 'Load Checkpoint', category: 'loaders', description: 'Load a checkpoint model' },
  { type: 'CLIPTextEncode', label: 'CLIP Text Encode', category: 'conditioning', description: 'Encode text with CLIP' },
  { type: 'VAEDecode', label: 'VAE Decode', category: 'latent', description: 'Decode latent to image' },
  { type: 'VAEEncode', label: 'VAE Encode', category: 'latent', description: 'Encode image to latent' },
  { type: 'EmptyLatentImage', label: 'Empty Latent Image', category: 'latent', description: 'Create empty latent' },
  { type: 'SaveImage', label: 'Save Image', category: 'image', description: 'Save image to disk' },
  { type: 'LoadImage', label: 'Load Image', category: 'image', description: 'Load image from disk' },
  { type: 'PreviewImage', label: 'Preview Image', category: 'image', description: 'Preview image in UI' },
]

export function NodeLibrary() {
  const [search, setSearch] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['sampling', 'loaders']))

  const filteredNodes = useMemo(() => {
    if (!search) return defaultNodes
    const searchLower = search.toLowerCase()
    return defaultNodes.filter(
      (node) =>
        node.label.toLowerCase().includes(searchLower) ||
        node.type.toLowerCase().includes(searchLower) ||
        node.category.toLowerCase().includes(searchLower)
    )
  }, [search])

  const nodesByCategory = useMemo(() => {
    const grouped: Record<string, NodeDefinition[]> = {}
    filteredNodes.forEach((node) => {
      if (!grouped[node.category]) {
        grouped[node.category] = []
      }
      grouped[node.category].push(node)
    })
    return grouped
  }, [filteredNodes])

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }
      return next
    })
  }

  const handleDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/comfynode', nodeType)
    event.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search input */}
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search nodes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm rounded border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Node list */}
      <div className="flex-1 overflow-y-auto">
        {Object.entries(nodesByCategory).map(([category, nodes]) => (
          <div key={category} className="border-b last:border-b-0">
            <button
              onClick={() => toggleCategory(category)}
              className="w-full px-3 py-2 flex items-center justify-between text-sm font-medium hover:bg-muted/50"
            >
              <span className="capitalize">{category}</span>
              <span className="text-xs text-muted-foreground">
                {nodes.length}
              </span>
            </button>
            {expandedCategories.has(category) && (
              <div className="pb-2">
                {nodes.map((node) => (
                  <div
                    key={node.type}
                    draggable
                    onDragStart={(e) => handleDragStart(e, node.type)}
                    className="mx-2 px-2 py-1.5 text-sm rounded cursor-grab hover:bg-muted active:cursor-grabbing"
                  >
                    <div className="font-medium">{node.label}</div>
                    {node.description && (
                      <div className="text-xs text-muted-foreground">
                        {node.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
