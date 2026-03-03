// ============================================================
// SettingsDrawer.types.ts — Tipos compartilhados do drawer
// ============================================================

import type { SoldaRow } from '@/schemas/soldaSchema'

// ─── Props do drawer raiz ────────────────────────────────────
export interface SettingsDrawerProps {
  isOpen:    boolean
  onClose:   () => void
  onDataAdd: (rows: SoldaRow[]) => void
}

// ─── Props da tab de colunas ─────────────────────────────────
export interface ColumnsTabProps {
  visibility: Record<string, boolean>
  onChange:   (visibility: Record<string, boolean>) => void
}

// ─── Props da tab de entrada manual ──────────────────────────
export interface ManualEntryTabProps {
  onAdd: (row: SoldaRow) => void
}

// ─── Props da tab de CSV ─────────────────────────────────────
export interface CsvTabProps {
  onImport: (rows: SoldaRow[]) => void
}

// ─── Tabs disponíveis ────────────────────────────────────────
export type TabId = 'columns' | 'manual' | 'csv'

export interface TabConfig {
  id:    TabId
  label: string
  Icon:  React.ElementType
}