import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type BuiltInTheme = 'light' | 'dark' | 'sunset' | 'ocean' | 'forest' | 'nord' | 'dracula' | 'monokai' | 'github-dark' | 'tokyo-night' | 'catppuccin' | 'rose-pine' | 'gruvbox' | 'solarized-dark'
type Theme = BuiltInTheme | string

interface SettingsState {
  theme: Theme
  showEmojis: boolean
  autosaveNotes: boolean
  setTheme: (theme: Theme) => void
  setShowEmojis: (show: boolean) => void
  setAutosaveNotes: (enabled: boolean) => void
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'light',
      showEmojis: true,
      autosaveNotes: true,
      setTheme: (theme) => set({ theme }),
      setShowEmojis: (show) => set({ showEmojis: show }),
      setAutosaveNotes: (enabled) => set({ autosaveNotes: enabled }),
    }),
    {
      name: 'checklist-settings',
    }
  )
) 