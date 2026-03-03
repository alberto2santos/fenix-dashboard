import { useState, useCallback }            from 'react'
import Papa                                 from 'papaparse'
import { useQueryClient }                   from '@tanstack/react-query'
import { SoldaRowSchema, mapRawRow }        from '@/schemas/soldaSchema'
import type { SoldaRow }                    from '@/schemas/soldaSchema'

export const SOLDA_QUERY_KEY = ['solda-data'] as const

interface UseCsvParserOptions {
  onSuccess?: (rows: SoldaRow[]) => void
}

interface UseCsvParserReturn {
  parseFile: (file: File) => void
  isLoading: boolean
  error:     string | null
  data:      SoldaRow[]
}

export function useCsvParser({ onSuccess }: UseCsvParserOptions = {}): UseCsvParserReturn {
  const queryClient               = useQueryClient()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [data, setData]           = useState<SoldaRow[]>([])

  const parseFile = useCallback((file: File) => {
    const isValidFile = file.name.toLowerCase().endsWith('.csv')

    if (!isValidFile) {
      setError(`Arquivo inválido: "${file.name}". Selecione um arquivo com extensão .csv`)
      return
    }

    setIsLoading(true)
    setError(null)

    Papa.parse<Record<string, unknown>>(file, {
      header:         true,
      skipEmptyLines: true,
      encoding:       'UTF-8',

      complete: (results) => {
        try {
          const headers = results.meta.fields ?? []
          console.log('[Fênix II] Cabeçalhos encontrados no CSV:', headers)
          console.log('[Fênix II] Total de linhas brutas:', results.data.length)

          const validRows:   SoldaRow[] = []
          const parseErrors: string[]   = []

          results.data.forEach((row, index) => {

            // Detecta campo de área em múltiplos formatos
            const areaValue = String(
              row['area']              ??
              row['Area']             ??
              row['AREA']             ??
              row['Rótulos de Linha'] ??
              row['Rotulos de Linha'] ??
              row['rotulos de linha'] ??
              ''
            ).trim()

            // Ignora linhas de totais ou vazias
            const skipValues = [
              'total geral', 'total', 'grand total',
              '(em branco)', 'blank', '',
            ]
            if (skipValues.includes(areaValue.toLowerCase())) return

            // Mapeia cabeçalhos → schema
            const mapped = mapRawRow(row)
            if (!mapped.area) mapped.area = areaValue

            // Valida com Zod
            const parsed = SoldaRowSchema.safeParse(mapped)

            if (parsed.success) {
              validRows.push(parsed.data)
            } else {
              const msgs = parsed.error.errors.map((e) => e.message).join(', ')
              parseErrors.push(`Linha ${index + 2}: ${msgs}`)
              console.warn(`[Fênix II] Linha ${index + 2} ignorada:`, row, '→', msgs)
            }
          })

          // Nenhuma linha válida — erro com diagnóstico
          if (validRows.length === 0) {
            const cabecalhosEncontrados = headers.join(', ') || 'nenhum'
            setError(
              `Nenhuma linha válida encontrada no CSV.\n` +
              `Cabeçalhos encontrados: ${cabecalhosEncontrados}\n\n` +
              `Cabeçalhos esperados (escolha um formato):\n` +
              `Novo: area, soldas_realizadas, saldo_soldas, total_previsto, porcentagem\n` +
              `Legado: Rótulos de Linha, Soma de SOLDAS REALIZADAS, Soma de SALDO DE SOLDAS, Soma de TOTAL SOLDAS PREVISTO, %`
            )
            setIsLoading(false)
            return
          }

          // Sucesso
          console.log(`[Fênix II] ${validRows.length} linhas válidas carregadas:`, validRows)
          queryClient.setQueryData(SOLDA_QUERY_KEY, validRows)
          setData(validRows)
          onSuccess?.(validRows)

          // Aviso não-bloqueante se houve linhas ignoradas
          setError(
            parseErrors.length > 0
              ? `${validRows.length} área(s) carregada(s). ${parseErrors.length} linha(s) ignorada(s) por formato inválido.`
              : null
          )

        } catch (err) {
          console.error('[Fênix II] Erro inesperado no parser:', err)
          setError('Erro inesperado ao processar o CSV. Verifique o console (F12) para detalhes.')
        } finally {
          setIsLoading(false)
        }
      },

      error: (err) => {
        setError(`Erro ao ler o arquivo: ${err.message}`)
        setIsLoading(false)
      },
    })
  }, [queryClient, onSuccess])

  return { parseFile, isLoading, error, data }
}