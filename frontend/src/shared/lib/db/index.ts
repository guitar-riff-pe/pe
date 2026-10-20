import Dexie, { type EntityTable } from 'dexie'

interface LocalNote { id: string; text: string; updatedAt: number }

class LocalDatabase extends Dexie {
  notes!: EntityTable<LocalNote, 'id'>

  constructor() {
    super('pe-local')
    this.version(1).stores({ notes: 'id, updatedAt' })
  }
}

let database: LocalDatabase | undefined

export function getLocalDb() {
  if (typeof window === 'undefined') throw new Error('IndexedDB is only available in the browser')
  database ??= new LocalDatabase()
  return database
}
