import { useState }             from 'react'
import { X, Eye, PlusCircle, FileSpreadsheet } from 'lucide-react'
import { ColumnsTab }           from './tabs/ColumnsTab'
import { ManualEntryTab }       from './tabs/ManualEntryTab'
import { CsvTab }               from './tabs/CsvTab'
import { useSettings }          from '@/hooks/useSettings'
import type { SoldaRow }        from '@/schemas/soldaSchema'

interface Props {
  isOpen:    boolean
  onClose:   () => void
  onDataAdd: (rows: SoldaRow[]) => void
}

type Tab = 'columns' | 'manual' | 'csv'

const TABS: { id: Tab; label: string; Icon: React.ElementType }[] = [
  { id: 'columns', label: 'Colunas',  Icon: Eye              },
  { id: 'manual',  label: 'Manual',   Icon: PlusCircle       },
  { id: 'csv',     label: 'CSV',      Icon: FileSpreadsheet  },
]

export function SettingsDrawer({ isOpen, onClose, onDataAdd }: Props) {
  const [activeTab, setActiveTab]   = useState<Tab>('columns')
  const { settings, updateSettings, resetSettings } = useSettings()

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40 animate-fade_in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        role="dialog"
        aria-label="Configurações do dashboard"
        aria-modal="true"
        className="
          fixed top-0 right-0 h-full w-full max-w-md z-50
          bg-fenix-surface border-l border-fenix-border
          flex flex-col animate-slide_in
          shadow-[−4px_0_24px_rgba(0,0,0,0.5)]
        "
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-fenix-border">
          <h2 className="text-base font-semibold text-white">Configurações</h2>
          <button
            onClick={onClose}
            aria-label="Fechar configurações"
            className="p-1.5 rounded-md text-steel hover:text-white hover:bg-fenix-cardHover transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-fenix-border">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`
                flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium
                transition-colors border-b-2
                ${activeTab === id
                  ? 'text-amber border-amber'
                  : 'text-steel border-transparent hover:text-white'}
              `}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Conteúdo da tab ativa */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'columns' && (
            <ColumnsTab
              visibility={settings.columnVisibility}
              onChange={(vis) => updateSettings({ columnVisibility: vis })}
            />
          )}
          {activeTab === 'manual' && (
            <ManualEntryTab onAdd={(row) => onDataAdd([row])} />
          )}
          {activeTab === 'csv' && (
            <CsvTab onImport={onDataAdd} />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-fenix-border">
          <button
            onClick={resetSettings}
            className="text-sm text-steel hover:text-white transition-colors"
          >
            Restaurar padrão
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-amber text-fenix-bg text-sm font-semibold hover:bg-amber-light transition-colors"
          >
            Fechar
          </button>
        </div>
      </aside>
    </>
  )
}