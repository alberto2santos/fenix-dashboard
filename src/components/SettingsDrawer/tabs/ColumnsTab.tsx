import type { ColumnsTabProps } from '../SettingsDrawer.types'

const COLUMN_LABELS: Record<string, string> = {
  area:             'Área',
  soldasRealizadas: 'Soldas Realizadas',
  saldoSoldas:      'Saldo de Soldas',
  totalPrevisto:    'Total Previsto',
  porcentagem:      'Progresso (%)',
  dataReferencia:   'Data de Referência',
}

export function ColumnsTab({ visibility, onChange }: ColumnsTabProps) {
  const toggle = (key: string) => {
    onChange({ ...visibility, [key]: !visibility[key] })
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-steel mb-4">
        Escolha quais colunas aparecem na tabela. As alterações são salvas automaticamente.
      </p>

      {Object.entries(COLUMN_LABELS).map(([key, label]) => (
        <label
          key={key}
          className="flex items-center justify-between p-3 rounded-lg bg-fenix-card hover:bg-fenix-cardHover transition-colors cursor-pointer"
        >
          <span className="text-sm text-white">{label}</span>
          <div className="relative">
            <input
              type="checkbox"
              className="sr-only"
              checked={visibility[key] ?? true}
              onChange={() => toggle(key)}
            />
            <div className={`
              w-10 h-5 rounded-full transition-colors
              ${visibility[key] ?? true ? 'bg-amber' : 'bg-fenix-border'}
            `}>
              <div className={`
                absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform
                ${visibility[key] ?? true ? 'translate-x-5' : 'translate-x-0.5'}
              `} />
            </div>
          </div>
        </label>
      ))}
    </div>
  )
}