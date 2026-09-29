import { useState, useEffect }          from 'react'
import type { z }                       from 'zod'
import { SettingsSchema }               from '@/schemas/settingsSchema'
import { readStoredJson, writeStoredJson } from '@/db/dashboardDb'

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
  criticalThresholdPercent: 60,
  areaThresholds: {},
  browserNotificationsEnabled: false,
  webhookAlertsEnabled: false,
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    let active = true
    void readStoredJson<unknown>(SETTINGS_KEY)
      .then((stored) => {
        if (!active) return
        const parsed = SettingsSchema.safeParse(stored)
        if (parsed.success) setSettings(parsed.data)
        setIsLoaded(true)
      })
      .catch(() => {
        if (active) setIsLoaded(true)
      })

    return () => { active = false }
  }, [])

  useEffect(() => {
    if (isLoaded) void writeStoredJson(SETTINGS_KEY, settings)
  }, [settings, isLoaded])

  const updateSettings = (patch: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...patch }))
  }

  const resetSettings = () => setSettings(DEFAULT_SETTINGS)

  return { settings, updateSettings, resetSettings }
}
