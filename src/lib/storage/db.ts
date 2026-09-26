import Dexie, { type Table } from 'dexie'
import type { Activity, Category, Session, UserSettings } from '../../types'

export class FocusRollDatabase extends Dexie {
  activities!: Table<Activity, string>
  categories!: Table<Category, string>
  sessions!: Table<Session, string>
  settings!: Table<UserSettings, string>

  constructor() {
    super('focusroll_db')
    this.version(1).stores({
      activities: 'id, categoryId, active, createdAt',
      categories: 'id',
      sessions: 'id, activityId, categoryId, status, startedAt, endedAt',
      settings: 'id'
    })
  }
}

export const db = new FocusRollDatabase()

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'spirituality', name: 'Spiritualité', icon: '🕌', color: '#10b981' },
  { id: 'work', name: 'Création & Travail', icon: '💻', color: '#3b82f6' },
  { id: 'intellect', name: 'Intellect & Apprentissage', icon: '🧠', color: '#8b5cf6' },
  { id: 'body', name: 'Corps & Santé', icon: '🏃', color: '#f43f5e' },
  { id: 'leisure', name: 'Détente & Loisir', icon: '🎮', color: '#f59e0b' },
]

export const DEFAULT_ACTIVITIES: Activity[] = [
  {
    id: 'act-quran',
    name: 'Lire le Coran',
    icon: '🕌',
    categoryId: 'spirituality',
    durationMode: 'fixed',
    defaultDurationMinutes: 20,
    weight: 4,
    accentColor: '#10b981',
    active: true,
    createdAt: Date.now() - 50000,
  },
  {
    id: 'act-coding',
    name: 'Coder',
    icon: '💻',
    categoryId: 'work',
    durationMode: 'fixed',
    defaultDurationMinutes: 45,
    weight: 4,
    accentColor: '#3b82f6',
    active: true,
    createdAt: Date.now() - 40000,
  },
  {
    id: 'act-chess',
    name: 'Jouer aux échecs',
    icon: '♟️',
    categoryId: 'intellect',
    durationMode: 'fixed',
    defaultDurationMinutes: 30,
    weight: 3,
    accentColor: '#a855f7',
    active: true,
    createdAt: Date.now() - 30000,
  },
  {
    id: 'act-reading',
    name: 'Lire un livre',
    icon: '📖',
    categoryId: 'intellect',
    durationMode: 'range',
    defaultDurationMinutes: 30,
    rangeMinMinutes: 20,
    rangeMaxMinutes: 40,
    weight: 3,
    accentColor: '#f97316',
    active: true,
    createdAt: Date.now() - 20000,
  },
  {
    id: 'act-sport',
    name: 'Faire du sport',
    icon: '🏃',
    categoryId: 'body',
    durationMode: 'fixed',
    defaultDurationMinutes: 45,
    weight: 3,
    accentColor: '#ef4444',
    active: true,
    createdAt: Date.now() - 10000,
  },
  {
    id: 'act-study',
    name: 'Apprendre / Réviser',
    icon: '📚',
    categoryId: 'intellect',
    durationMode: 'fixed',
    defaultDurationMinutes: 35,
    weight: 3,
    accentColor: '#06b6d4',
    active: true,
    createdAt: Date.now(),
  },
]

export const DEFAULT_SETTINGS: UserSettings = {
  id: 'current_user_settings',
  randomizerMode: 'smart',
  noChoiceMode: false,
  soundEnabled: true,
  notificationsEnabled: false,
  vibrationEnabled: true,
  theme: 'dark',
}

export async function initializeDatabase() {
  const categoriesCount = await db.categories.count()
  if (categoriesCount === 0) {
    await db.categories.bulkAdd(DEFAULT_CATEGORIES)
  }

  const activitiesCount = await db.activities.count()
  if (activitiesCount === 0) {
    await db.activities.bulkAdd(DEFAULT_ACTIVITIES)
  }

  const existingSettings = await db.settings.get(DEFAULT_SETTINGS.id)
  if (!existingSettings) {
    await db.settings.put(DEFAULT_SETTINGS)
  }
}
