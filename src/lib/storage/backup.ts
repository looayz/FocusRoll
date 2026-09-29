import { db, initializeDatabase } from './db'
import type { Activity, Category, Session, UserSettings } from '../../types'

const BACKUP_VERSION = 1

export interface BackupFile {
  app: 'focusroll'
  version: number
  exportedAt: number
  activities: Activity[]
  categories: Category[]
  sessions: Session[]
  settings: UserSettings | null
}

export async function buildBackup(): Promise<BackupFile> {
  const [activities, categories, sessions, settings] = await Promise.all([
    db.activities.toArray(),
    db.categories.toArray(),
    db.sessions.toArray(),
    db.settings.toCollection().first(),
  ])
  return {
    app: 'focusroll',
    version: BACKUP_VERSION,
    exportedAt: Date.now(),
    activities,
    categories,
    sessions,
    settings: settings ?? null,
  }
}

export function parseBackup(text: string): BackupFile {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error("Ce fichier n'est pas un JSON valide.")
  }
  const b = data as Partial<BackupFile>
  if (!b || b.app !== 'focusroll' || !Array.isArray(b.activities) || !Array.isArray(b.sessions)) {
    throw new Error("Ce fichier n'est pas une sauvegarde FOCUSROLL.")
  }
  return {
    app: 'focusroll',
    version: b.version ?? BACKUP_VERSION,
    exportedAt: b.exportedAt ?? Date.now(),
    activities: b.activities,
    categories: Array.isArray(b.categories) ? b.categories : [],
    sessions: b.sessions,
    settings: b.settings ?? null,
  }
}

/** Fusionne la sauvegarde avec les données locales (mêmes ids = écrasés par la sauvegarde). */
export async function restoreBackup(backup: BackupFile): Promise<{ sessions: number; activities: number }> {
  await initializeDatabase()
  await db.transaction('rw', db.activities, db.categories, db.sessions, db.settings, async () => {
    if (backup.categories.length) await db.categories.bulkPut(backup.categories)
    await db.activities.bulkPut(backup.activities)
    await db.sessions.bulkPut(backup.sessions)
    if (backup.settings) await db.settings.put(backup.settings)
  })
  return { sessions: backup.sessions.length, activities: backup.activities.length }
}

export function downloadBackup(backup: BackupFile) {
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const day = new Date(backup.exportedAt).toISOString().slice(0, 10)
  a.href = url
  a.download = `focusroll-backup-${day}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
