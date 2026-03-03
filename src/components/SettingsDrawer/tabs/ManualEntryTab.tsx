// ============================================================
// ManualEntryTab.tsx — Entrada manual de dados por formulário
// Validação com Zod em tempo real + feedback visual
// ============================================================

import { useState }                         from 'react'
import { PlusCircle, AlertCircle, Check }   from 'lucide-react'
import { SoldaRowSchema }                   from '@/schemas/soldaSchema'
import type { ManualEntryTabProps }         from '../SettingsDrawer.types'

interface FormState {
  area:             string
  soldasRealizadas: string
  totalPrevisto:    string
  saldoSoldas:      string
  porcentagem:      string
  dataReferencia:   string
}

const EMPTY_FORM: FormState = {
  area:             '',
  soldasRealizadas: '',
  totalPrevisto:    '',
  saldoSoldas:      '',
  porcentagem:      '',
  dataReferencia:   new Date().toISOString().split('T')[0],
}

const FIELD_CONFIG: {
  key:         keyof FormState
  label:       string
  placeholder: string
  hint:        string
  type:        string
}[] = [
  {
    key:         'area',
    label:       'Área *',
    placeholder: 'Ex: Estrutura, Tubulação, Caldeiraria...',
    hint:        'Nome da área ou setor de soldagem',
    type:        'text',
  },
  {
    key:         'totalPrevisto',
    label:       'Total Previsto *',
    placeholder: 'Ex: 1500',
    hint:        'Quantidade total de soldas planejadas para essa área',
    type:        'number',
  },
  {
    key:         'soldasRealizadas',
    label:       'Soldas Realizadas *',
    placeholder: 'Ex: 900',
    hint:        'Quantas soldas já foram executadas',
    type:        'number',
  },
  {
    key:         'saldoSoldas',
    label:       'Saldo de Soldas',
    placeholder: 'Calculado automaticamente',
    hint:        'Deixe em branco — calculamos pelo Total − Realizadas',
    type:        'number',
  },
  {
    key:         'porcentagem',
    label:       'Progresso (%)',
    placeholder: 'Calculado automaticamente',
    hint:        'Deixe em branco — calculamos pelas soldas acima',
    type:        'number',
  },
  {
    key:         'dataReferencia',
    label:       'Data de Referência',
    placeholder: '',
    hint:        'Data base dos dados (padrão: hoje)',
    type:        'date',
  },
]

export function ManualEntryTab({ onAdd }: ManualEntryTabProps) {
  const [form, setForm]       = useState<FormState>(EMPTY_FORM)
  const [errors, setErrors]   = useState<Partial<Record<keyof FormState, string>>>({})
  const [success, setSuccess] = useState(false)

  const handleChange = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
    setSuccess(false)
  }

  const computeDefaults = (raw: FormState) => {
    const realizadas  = parseFloat(raw.soldasRealizadas) || 0
    const previsto    = parseFloat(raw.totalPrevisto)    || 0
    const saldo       = raw.saldoSoldas  ? parseFloat(raw.saldoSoldas)  : previsto - realizadas
    const porcentagem = raw.porcentagem  ? parseFloat(raw.porcentagem)  : (previsto > 0 ? (realizadas / previsto) * 100 : 0)

    return {
      area:             raw.area.trim(),
      soldasRealizadas: realizadas,
      saldoSoldas:      saldo,
      totalPrevisto:    previsto,
      porcentagem:      parseFloat(porcentagem.toFixed(2)),
      dataReferencia:   raw.dataReferencia || new Date().toISOString().split('T')[0],
    }
  }

  const handleSubmit = () => {
    const computed = computeDefaults(form)
    const result   = SoldaRowSchema.safeParse(computed)

    if (!result.success) {
      const fieldErrors: Partial<Record<keyof FormState, string>> = {}
      result.error.errors.forEach((e) => {
        const field = e.path[0] as keyof FormState
        if (field) fieldErrors[field] = e.message
      })
      setErrors(fieldErrors)
      return
    }

    onAdd(result.data)
    setForm(EMPTY_FORM)
    setErrors({})
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
  }

  const isReadOnly = (key: keyof FormState) =>
    key === 'saldoSoldas' || key === 'porcentagem'

  const preview = computeDefaults(form)

  return (
    <div className="space-y-5">
      <div className="flex gap-2 p-3 rounded-lg bg-fenix-card border border-fenix-border text-xs text-steel">
        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber" />
        <span>
          Preencha <strong className="text-white">Área</strong>,{' '}
          <strong className="text-white">Total Previsto</strong> e{' '}
          <strong className="text-white">Soldas Realizadas</strong> — os demais
          campos são calculados automaticamente.
        </span>
      </div>

      <div className="space-y-3">
        {FIELD_CONFIG.map(({ key, label, placeholder, hint, type }) => (
          <div key={key}>
            <label className="block text-xs font-medium text-steel mb-1">
              {label}
            </label>
            <input
              type={type}
              value={form[key]}
              onChange={(e) => handleChange(key, e.target.value)}
              placeholder={isReadOnly(key) ? 'Calculado automaticamente' : placeholder}
              readOnly={isReadOnly(key)}
              className={`
                w-full px-3 py-2 rounded-lg text-sm bg-fenix-card border
                placeholder:text-steel/40 transition-colors
                focus:outline-none focus:ring-2 focus:ring-amber/30 focus:border-amber
                ${isReadOnly(key)
                  ? 'text-steel cursor-not-allowed border-fenix-border opacity-50'
                  : errors[key]
                    ? 'text-white border-status-critical'
                    : 'text-white border-fenix-border hover:border-fenix-borderAlt'}
              `}
            />
            {errors[key] ? (
              <p className="mt-1 text-xs text-status-critical">{errors[key]}</p>
            ) : (
              <p className="mt-1 text-xs text-steel/60">{hint}</p>
            )}
          </div>
        ))}
      </div>

      {(form.area || form.soldasRealizadas || form.totalPrevisto) && (
        <div className="p-3 rounded-lg bg-fenix-card border border-fenix-border space-y-1">
          <p className="text-xs font-medium text-steel mb-2">Prévia da linha</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            <span className="text-steel">Saldo calculado</span>
            <span className="text-white tabular-nums">
              {(preview.totalPrevisto - preview.soldasRealizadas).toLocaleString('pt-BR')}
            </span>
            <span className="text-steel">Progresso calculado</span>
            <span className="text-white tabular-nums">{preview.porcentagem.toFixed(1)}%</span>
          </div>
        </div>
      )}

      <button
        onClick={handleSubmit}
        className="
          w-full flex items-center justify-center gap-2 py-2.5 rounded-lg
          bg-amber text-fenix-bg text-sm font-semibold
          hover:bg-amber-light active:scale-[0.98] transition-all
        "
      >
        {success
          ? <><Check className="w-4 h-4" /> Área adicionada!</>
          : <><PlusCircle className="w-4 h-4" /> Adicionar Área</>
        }
      </button>
    </div>
  )
}