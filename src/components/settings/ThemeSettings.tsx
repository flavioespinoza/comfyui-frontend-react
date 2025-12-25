'use client'

// Theme configuration

import { useUIStore } from '@/stores'
import { Sun, Moon, Monitor } from 'lucide-react'
import type { Theme } from '@/types/ui'

const themes: { id: Theme; label: string; icon: React.ReactNode }[] = [
  { id: 'light', label: 'Light', icon: <Sun className="w-5 h-5" /> },
  { id: 'dark', label: 'Dark', icon: <Moon className="w-5 h-5" /> },
]

export function ThemeSettings() {
  const { theme, setTheme } = useUIStore()

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Appearance</h3>

        <div className="space-y-4">
          {/* Theme selection */}
          <div>
            <label className="text-sm font-medium">Theme</label>
            <div className="mt-2 grid grid-cols-2 gap-3">
              {themes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={`
                    flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-colors
                    ${theme === t.id
                      ? 'border-primary bg-primary/5'
                      : 'border-transparent bg-muted hover:border-muted-foreground/20'
                    }
                  `}
                >
                  {t.icon}
                  <span className="font-medium">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div>
            <label className="text-sm font-medium">Preview</label>
            <div className="mt-2 p-4 rounded-lg border bg-muted/50">
              <div className="flex gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-3/4 rounded bg-foreground/20" />
                <div className="h-4 w-1/2 rounded bg-foreground/20" />
                <div className="h-4 w-2/3 rounded bg-foreground/20" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional appearance settings */}
      <div>
        <h3 className="text-lg font-medium mb-4">Display</h3>

        <div className="space-y-4">
          <label className="flex items-center justify-between">
            <div>
              <span className="font-medium">Show Minimap</span>
              <p className="text-sm text-muted-foreground">
                Display a minimap overview of the graph
              </p>
            </div>
            <input type="checkbox" defaultChecked className="rounded" />
          </label>

          <label className="flex items-center justify-between">
            <div>
              <span className="font-medium">Show Grid</span>
              <p className="text-sm text-muted-foreground">
                Display grid lines on the canvas
              </p>
            </div>
            <input type="checkbox" defaultChecked className="rounded" />
          </label>

          <label className="flex items-center justify-between">
            <div>
              <span className="font-medium">Snap to Grid</span>
              <p className="text-sm text-muted-foreground">
                Snap nodes to grid when moving
              </p>
            </div>
            <input type="checkbox" defaultChecked className="rounded" />
          </label>
        </div>
      </div>
    </div>
  )
}
