import Dexie, { type Table } from 'dexie'

interface StoredValue {
  key: string
  value: string
}

class DashboardDatabase extends Dexie {
  values!: Table<StoredValue, string>

  constructor() {
    super('fenix-dashboard')
    this.version(1).stores({ values: '&key' })
  }
}

export const dashboardDb = new DashboardDatabase()

export const indexedDbStorage = {
  async getItem(key: string): Promise<string | null> {
    const record = await dashboardDb.values.get(key)
    return record?.value ?? null
  },
  async setItem(key: string, value: string): Promise<void> {
    await dashboardDb.values.put({ key, value })
  },
  async removeItem(key: string): Promise<void> {
    await dashboardDb.values.delete(key)
  },
}

export async function migrateLocalStorageValue(key: string): Promise<void> {
  try {
    const legacyValue = window.localStorage.getItem(key)
    if (!legacyValue) return

    const existing = await dashboardDb.values.get(key)
    if (!existing) await dashboardDb.values.put({ key, value: legacyValue })
    window.localStorage.removeItem(key)
  } catch (error) {
    console.warn('[Fênix II] Não foi possível migrar o cache local para IndexedDB:', error)
  }
}

export async function readStoredJson<T>(key: string): Promise<T | null> {
  const value = await indexedDbStorage.getItem(key)
  if (!value) return null
  return JSON.parse(value) as T
}

export async function writeStoredJson<T>(key: string, value: T): Promise<void> {
  await indexedDbStorage.setItem(key, JSON.stringify(value))
}
