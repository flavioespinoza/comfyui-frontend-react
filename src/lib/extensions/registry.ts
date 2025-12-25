// Extension registration and lifecycle

import type { ComfyUIExtension, ExtensionPermission } from '@/types/extensions'

interface RegisteredExtension {
  extension: ComfyUIExtension
  loaded: boolean
  error?: string
}

class ExtensionRegistry {
  private extensions: Map<string, RegisteredExtension> = new Map()
  private loadOrder: string[] = []

  async register(extension: ComfyUIExtension): Promise<void> {
    const { id } = extension.manifest

    if (this.extensions.has(id)) {
      throw new Error(`Extension with id "${id}" is already registered`)
    }

    this.validateManifest(extension.manifest)

    this.extensions.set(id, { extension, loaded: false })
    this.loadOrder.push(id)
  }

  async unregister(id: string): Promise<void> {
    const registered = this.extensions.get(id)
    if (!registered) {
      return
    }

    if (registered.loaded) {
      await this.unload(id)
    }

    this.extensions.delete(id)
    this.loadOrder = this.loadOrder.filter((extId) => extId !== id)
  }

  async load(id: string): Promise<void> {
    const registered = this.extensions.get(id)
    if (!registered) {
      throw new Error(`Extension "${id}" is not registered`)
    }

    if (registered.loaded) {
      return
    }

    try {
      await registered.extension.onLoad?.()
      registered.loaded = true
    } catch (error) {
      registered.error = error instanceof Error ? error.message : 'Unknown error'
      throw error
    }
  }

  async unload(id: string): Promise<void> {
    const registered = this.extensions.get(id)
    if (!registered || !registered.loaded) {
      return
    }

    try {
      await registered.extension.onUnload?.()
      registered.loaded = false
    } catch (error) {
      console.error(`Error unloading extension "${id}":`, error)
    }
  }

  async loadAll(): Promise<void> {
    for (const id of this.loadOrder) {
      try {
        await this.load(id)
      } catch (error) {
        console.error(`Failed to load extension "${id}":`, error)
      }
    }
  }

  async unloadAll(): Promise<void> {
    // Unload in reverse order
    for (const id of [...this.loadOrder].reverse()) {
      await this.unload(id)
    }
  }

  get(id: string): ComfyUIExtension | undefined {
    return this.extensions.get(id)?.extension
  }

  getAll(): ComfyUIExtension[] {
    return Array.from(this.extensions.values()).map((r) => r.extension)
  }

  getLoaded(): ComfyUIExtension[] {
    return Array.from(this.extensions.values())
      .filter((r) => r.loaded)
      .map((r) => r.extension)
  }

  isLoaded(id: string): boolean {
    return this.extensions.get(id)?.loaded ?? false
  }

  hasPermission(id: string, permission: ExtensionPermission): boolean {
    const registered = this.extensions.get(id)
    return registered?.extension.manifest.permissions.includes(permission) ?? false
  }

  private validateManifest(manifest: ComfyUIExtension['manifest']): void {
    if (!manifest.id || typeof manifest.id !== 'string') {
      throw new Error('Extension manifest must have a valid id')
    }
    if (!manifest.name || typeof manifest.name !== 'string') {
      throw new Error('Extension manifest must have a valid name')
    }
    if (!manifest.version || typeof manifest.version !== 'string') {
      throw new Error('Extension manifest must have a valid version')
    }
    if (!Array.isArray(manifest.permissions)) {
      throw new Error('Extension manifest must have a permissions array')
    }
  }

  // Aggregated UI registrations from all loaded extensions
  getSidebarTabs() {
    return this.getLoaded()
      .flatMap((ext) => ext.sidebarTabs ?? [])
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  }

  getContextMenuItems() {
    return this.getLoaded().flatMap((ext) => ext.contextMenuItems ?? [])
  }

  getSettingsPanels() {
    return this.getLoaded()
      .flatMap((ext) => ext.settingsPanels ?? [])
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  }

  getCustomNodes() {
    return this.getLoaded().flatMap((ext) => ext.customNodes ?? [])
  }

  getNodeDecorators() {
    return this.getLoaded().flatMap((ext) => ext.nodeDecorators ?? [])
  }
}

// Singleton instance
export const extensionRegistry = new ExtensionRegistry()
