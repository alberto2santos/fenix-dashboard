// ============================================================
// main.tsx — Ponto de entrada da aplicação React
// - TanStack Query v5 com persistência assíncrona
// - Dados do CSV persistem no localStorage entre sessões
// ============================================================

import React                                    from 'react'
import ReactDOM                                 from 'react-dom/client'
import { QueryClient }                          from '@tanstack/react-query'
import { PersistQueryClientProvider }           from '@tanstack/react-query-persist-client'
import { createAsyncStoragePersister }          from '@tanstack/query-async-storage-persister'
import { registerSW }                            from 'virtual:pwa-register'
import { indexedDbStorage, migrateLocalStorageValue } from './db/dashboardDb'
import './index.css'
import App                                      from './App'

// ─── Constantes de tempo ─────────────────────────────────────
const ONE_MINUTE = 1_000 * 60
const ONE_HOUR   = ONE_MINUTE * 60
const ONE_DAY    = ONE_HOUR   * 24

// ─── QueryClient ─────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:            ONE_MINUTE * 5,   // Dados frescos por 5 min
      gcTime:               ONE_DAY,          // Cache mantido por 24h
      refetchOnWindowFocus: false,            // CSV é estático, sem refetch
      retry:                1,
    },
  },
})

// ─── Persister assíncrono ────────────────────────────────────
const persister = createAsyncStoragePersister({
  storage:      indexedDbStorage,
  key:          'fenix-dashboard-cache',
  throttleTime: 1_000,                        // Throttle de 1s — evita writes excessivos
})

// ─── Root element ────────────────────────────────────────────
const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error(
    '[Fênix II] Elemento #root não encontrado. ' +
    'Verifique se o index.html contém <div id="root">.'
  )
}

// ─── Render ──────────────────────────────────────────────────
async function startApplication() {
  await migrateLocalStorageValue('fenix-dashboard-cache')
  await migrateLocalStorageValue('fenix-settings-v1')
  registerSW({ immediate: true })

  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister,
          maxAge: Infinity,
          buster: 'fenix-v1',
        }}
      >
        <App />
      </PersistQueryClientProvider>
    </React.StrictMode>
  )
}

void startApplication()
