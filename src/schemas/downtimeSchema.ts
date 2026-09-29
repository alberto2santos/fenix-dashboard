import { z } from 'zod'

export const DOWNTIME_REASONS = [
  'END reprovado',
  'Falta de gás',
  'Troca de arame/eletrodo',
  'Falha de equipamento',
  'Manutenção',
  'Outro',
] as const

export const DowntimeEventSchema = z.object({
  id: z.string().min(1),
  area: z.string().trim().min(1, 'Informe a área'),
  startedAt: z.string().datetime({ offset: true }),
  endedAt: z.string().datetime({ offset: true }).optional(),
  reason: z.enum(DOWNTIME_REASONS),
  reworkCount: z.number().int().nonnegative().default(0),
  turno: z.enum(['A', 'B', 'C']).optional(),
  notes: z.string().optional(),
})

export type DowntimeEvent = z.infer<typeof DowntimeEventSchema>

export const DOWNTIME_QUERY_KEY = ['downtime-events'] as const
