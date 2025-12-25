'use client'

// Keyboard shortcut handling hook

import { useEffect, useCallback, useRef } from 'react'
import { DEFAULT_SHORTCUTS, type KeyboardShortcut, type ShortcutBinding } from '@/types/shortcuts'

interface ShortcutHandlers {
  [actionId: string]: () => void
}

interface UseKeyboardShortcutsOptions {
  shortcuts?: KeyboardShortcut[]
  handlers: ShortcutHandlers
  enabled?: boolean
}

function parseShortcut(shortcutString: string): ShortcutBinding {
  const parts = shortcutString.toLowerCase().split('+')
  const key = parts[parts.length - 1]

  return {
    key,
    ctrl: parts.includes('ctrl') || parts.includes('control'),
    alt: parts.includes('alt'),
    shift: parts.includes('shift'),
    meta: parts.includes('meta') || parts.includes('cmd') || parts.includes('command'),
  }
}

function matchesBinding(event: KeyboardEvent, binding: ShortcutBinding): boolean {
  const key = event.key.toLowerCase()

  // Handle special keys
  const eventKey =
    key === ' ' ? 'space' : key === 'escape' ? 'esc' : key === 'arrowup' ? 'up' : key === 'arrowdown' ? 'down' : key === 'arrowleft' ? 'left' : key === 'arrowright' ? 'right' : key

  return (
    eventKey === binding.key &&
    event.ctrlKey === (binding.ctrl ?? false) &&
    event.altKey === (binding.alt ?? false) &&
    event.shiftKey === (binding.shift ?? false) &&
    event.metaKey === (binding.meta ?? false)
  )
}

export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions): void {
  const { shortcuts = DEFAULT_SHORTCUTS, handlers, enabled = true } = options

  const handlersRef = useRef(handlers)
  handlersRef.current = handlers

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return

      // Skip if user is typing in an input
      const target = event.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return
      }

      for (const shortcut of shortcuts) {
        if (!shortcut.enabled) continue

        for (const keyCombo of shortcut.keys) {
          const binding = parseShortcut(keyCombo)
          if (matchesBinding(event, binding)) {
            const handler = handlersRef.current[shortcut.action]
            if (handler) {
              event.preventDefault()
              event.stopPropagation()
              handler()
              return
            }
          }
        }
      }
    },
    [shortcuts, enabled]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

// Hook to get formatted shortcut string for display
export function useShortcutDisplay(actionId: string, shortcuts = DEFAULT_SHORTCUTS): string | null {
  const shortcut = shortcuts.find((s) => s.action === actionId)
  if (!shortcut || shortcut.keys.length === 0) return null

  return shortcut.keys[0]
    .replace(/ctrl/i, '⌃')
    .replace(/alt/i, '⌥')
    .replace(/shift/i, '⇧')
    .replace(/meta|cmd|command/i, '⌘')
    .replace(/\+/g, '')
}
