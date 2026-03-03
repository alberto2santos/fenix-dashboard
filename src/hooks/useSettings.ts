import { useState, useEffect }          from 'react'
import type { z }                       from 'zod'
import { SettingsSchema }               from '@/schemas/settingsSchema'

export type Settings = z.infer<typeof SettingsSchema>

const SETTINGS_KEY  = 'fenix-settings-v1'
const DEFAULT_SETTINGS: Settings = {
  columnVisibility: {
    area:             true,
    soldasRealizadas: true,
    saldoSoldas:      true,
    totalPrevisto:    true,
    porcentagem:      true,
    dataReferencia:   false,
  },
  columnOrder: ['area', 'soldasRealizadas', 'saldoSoldas', 'totalPrevisto', 'porcentagem'],
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY)
      if (!stored) return DEFAULT_SETTINGS

      const parsed = SettingsSchema.safeParse(JSON.parse(stored))  // ← runtime
      return parsed.success ? parsed.data : DEFAULT_SETTINGS
    } catch {
      return DEFAULT_SETTINGS
    }
  })

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  }, [settings])

  const updateSettings = (patch: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...patch }))
  }

  const resetSettings = () => setSettings(DEFAULT_SETTINGS)

  return { settings, updateSettings, resetSettings }
}