import { z } from 'zod'

export const SettingsSchema = z.object({
  columnVisibility: z.record(z.boolean()).default({}),
  columnOrder:      z.array(z.string()).default([]),
})