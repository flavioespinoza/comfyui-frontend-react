import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Theme, ViewMode, SidebarTab, ModalType, ModalData } from '@/types/ui'

interface UIState {
  sidebarOpen: boolean
  sidebarTab: SidebarTab
  queuePanelOpen: boolean
  settingsPanelOpen: boolean
  activeModal: ModalType
  modalData: ModalData | null
  theme: Theme
  viewMode: ViewMode

  // Actions
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setSidebarTab: (tab: SidebarTab) => void
  toggleQueuePanel: () => void
  setQueuePanelOpen: (open: boolean) => void
  openModal: (modal: ModalType, data?: ModalData) => void
  closeModal: () => void
  setTheme: (theme: Theme) => void
  setViewMode: (mode: ViewMode) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      sidebarTab: 'nodes',
      queuePanelOpen: false,
      settingsPanelOpen: false,
      activeModal: null,
      modalData: null,
      theme: 'dark',
      viewMode: 'graph',

      toggleSidebar: () => {
        set((state) => ({ sidebarOpen: !state.sidebarOpen }))
      },

      setSidebarOpen: (open) => {
        set({ sidebarOpen: open })
      },

      setSidebarTab: (tab) => {
        set({ sidebarTab: tab, sidebarOpen: true })
      },

      toggleQueuePanel: () => {
        set((state) => ({ queuePanelOpen: !state.queuePanelOpen }))
      },

      setQueuePanelOpen: (open) => {
        set({ queuePanelOpen: open })
      },

      openModal: (modal, data) => {
        set({ activeModal: modal, modalData: data ?? null })
      },

      closeModal: () => {
        set({ activeModal: null, modalData: null })
      },

      setTheme: (theme) => {
        set({ theme })
      },

      setViewMode: (mode) => {
        set({ viewMode: mode })
      },
    }),
    {
      name: 'comfyui-ui-store',
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
        sidebarTab: state.sidebarTab,
        theme: state.theme,
        viewMode: state.viewMode,
      }),
    }
  )
)
