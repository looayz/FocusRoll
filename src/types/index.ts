export type CategoryId = 'spirituality' | 'work' | 'intellect' | 'body' | 'leisure' | string

export type DurationMode = 'preset' | 'fixed' | 'range'

export interface Category {
  id: string
  name: string
  icon: string
  color: string
}

export interface Activity {
  id: string
  name: string
  icon: string
  categoryId: string
  durationMode: DurationMode
  defaultDurationMinutes: number
  rangeMinMinutes?: number
  rangeMaxMinutes?: number
  weight: number // 1 to 5
  accentColor: string
  active: boolean
  createdAt: number
}

export type SessionStatus = 'completed' | 'abandoned' | 'skipped'
export type SessionMood = 'difficult' | 'okay' | 'good' | 'great'

export interface Session {
  id: string
  activityId: string
  activityName: string
  activityIcon: string
  activityColor: string
  categoryId: string
  plannedDurationMinutes: number
  actualDurationSeconds: number
  startedAt: number
  endedAt: number
  status: SessionStatus
  mood?: SessionMood
  skipReason?: string
}

export type RandomizerMode = 'pure' | 'smart' | 'balanced'

export interface UserSettings {
  id: string
  randomizerMode: RandomizerMode
  noChoiceMode: boolean
  soundEnabled: boolean
  notificationsEnabled: boolean
  vibrationEnabled: boolean
  theme: 'dark'
}
