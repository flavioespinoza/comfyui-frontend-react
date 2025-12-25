'use client'

// Settings dialog

import { useUIStore } from '@/stores'
import { KeybindSettings, ThemeSettings } from '@/components/settings'
import { X, Keyboard, Palette, Info } from 'lucide-react'
import { useState } from 'react'

type SettingsTab = 'theme' | 'keybinds' | 'about'

const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
  { id: 'theme', label: 'Theme', icon: <Palette className="w-4 h-4" /> },
  { id: 'keybinds', label: 'Keybinds', icon: <Keyboard className="w-4 h-4" /> },
  { id: 'about', label: 'About', icon: <Info className="w-4 h-4" /> },
]

export function SettingsModal() {
  const { activeModal, closeModal } = useUIStore()
  const [activeTab, setActiveTab] = useState<SettingsTab>('theme')

  if (activeModal !== 'settings') return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={closeModal}
      />

      {/* Modal */}
      <div className="relative bg-background rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Settings</h2>
          <button
            onClick={closeModal}
            className="p-1 rounded hover:bg-muted"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Tab sidebar */}
          <div className="w-40 border-r p-2 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  w-full flex items-center gap-2 px-3 py-2 rounded text-sm text-left
                  ${activeTab === tab.id ? 'bg-muted font-medium' : 'hover:bg-muted/50'}
                `}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === 'theme' && <ThemeSettings />}
            {activeTab === 'keybinds' && <KeybindSettings />}
            {activeTab === 'about' && <AboutSettings />}
          </div>
        </div>
      </div>
    </div>
  )
}

function AboutSettings() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">About ComfyUI Frontend</h3>
      <p className="text-sm text-muted-foreground">
        A modern React-based frontend for ComfyUI, built with Next.js, React Flow, and Zustand.
      </p>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Version</span>
          <span>1.0.0</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">React</span>
          <span>19.2.0</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Next.js</span>
          <span>16.1.1</span>
        </div>
      </div>
    </div>
  )
}
