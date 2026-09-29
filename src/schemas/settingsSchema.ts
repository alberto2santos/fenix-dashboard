import { z } from 'zod'

export const SettingsSchema = z.object({
  columnVisibility: z.record(z.boolean()).default({}),
  columnOrder:      z.array(z.string()).default([]),
  criticalThresholdPercent: z.number().min(0).max(100).default(60),
  areaThresholds: z.record(z.string(), z.number().min(0).max(100)).default({}),
  browserNotificationsEnabled: z.boolean().default(false),
  webhookAlertsEnabled: z.boolean().default(false),
})
