import type { Session } from '../../types'

const DAY_MS = 86_400_000

export interface StatsOverview {
  totalMinutesFocused: number
  totalSessionsCompleted: number
  completionRate: number
  currentStreakDays: number
  longestStreakDays: number
  todayMinutes: number
  /** Sessions terminées aujourd'hui. */
  todaySessionsCount: number
}

export interface DayStat {
  key: string
  date: Date
  minutes: number
  sessions: number
  isToday: boolean
}

export interface CategoryStat {
  categoryId: string
  minutes: number
}

/** Clé de jour locale AAAA-MM-JJ. */
export function dayKey(ts: number | Date): string {
  const d = typeof ts === 'number' ? new Date(ts) : ts
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function startOfDay(ts: number): number {
  const d = new Date(ts)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

/** Numéro de jour (indépendant du fuseau / de l'heure d'été) pour comparer des jours calendaires. */
function dayIndex(key: string): number {
  const [y, m, d] = key.split('-').map(Number)
  return Math.round(Date.UTC(y, m - 1, d) / DAY_MS)
}

const isCompleted = (s: Session) => s.status === 'completed'

export function computeStats(sessions: Session[], now: number = Date.now()): StatsOverview {
  const completed = sessions.filter(isCompleted)
  const totalMinutesFocused = Math.round(completed.reduce((acc, s) => acc + s.actualDurationSeconds, 0) / 60)

  const attempted = sessions.filter((s) => s.status === 'completed' || s.status === 'abandoned')
  const completionRate = attempted.length > 0 ? Math.round((completed.length / attempted.length) * 100) : 100

  const today = dayKey(now)
  const todayCompleted = completed.filter((s) => dayKey(s.endedAt) === today)
  const todayMinutes = Math.round(todayCompleted.reduce((acc, s) => acc + s.actualDurationSeconds, 0) / 60)

  // Séries : jours calendaires distincts avec au moins une session terminée
  const days = [...new Set(completed.map((s) => dayIndex(dayKey(s.endedAt))))].sort((a, b) => a - b)

  let longest = 0
  let run = 0
  days.forEach((d, i) => {
    run = i > 0 && d - days[i - 1] === 1 ? run + 1 : 1
    longest = Math.max(longest, run)
  })

  // La série courante reste vivante si la dernière session date d'aujourd'hui ou d'hier
  let current = 0
  if (days.length > 0) {
    const todayIdx = dayIndex(today)
    const last = days[days.length - 1]
    if (last === todayIdx || last === todayIdx - 1) {
      current = 1
      for (let i = days.length - 1; i > 0 && days[i] - days[i - 1] === 1; i--) current++
    }
  }

  return {
    totalMinutesFocused,
    totalSessionsCompleted: completed.length,
    completionRate,
    currentStreakDays: current,
    longestStreakDays: longest,
    todayMinutes,
    todaySessionsCount: todayCompleted.length,
  }
}

/** Minutes de focus par jour sur les `days` derniers jours (le plus ancien d'abord, aujourd'hui en dernier). */
export function computeDailyStats(sessions: Session[], days = 7, now: number = Date.now()): DayStat[] {
  const perDay = new Map<string, { secs: number; count: number }>()
  for (const s of sessions) {
    if (!isCompleted(s)) continue
    const entry = perDay.get(dayKey(s.endedAt)) ?? { secs: 0, count: 0 }
    entry.secs += s.actualDurationSeconds
    entry.count += 1
    perDay.set(dayKey(s.endedAt), entry)
  }
  const today = new Date(now)
  const result: DayStat[] = []
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i)
    const key = dayKey(date)
    const entry = perDay.get(key)
    result.push({ key, date, minutes: Math.round((entry?.secs ?? 0) / 60), sessions: entry?.count ?? 0, isToday: i === 0 })
  }
  return result
}

/** Minutes de focus par catégorie depuis `sinceTs`, triées par durée décroissante. */
export function computeCategoryStats(sessions: Session[], sinceTs: number): CategoryStat[] {
  const map = new Map<string, number>()
  for (const s of sessions) {
    if (!isCompleted(s) || s.endedAt < sinceTs) continue
    map.set(s.categoryId, (map.get(s.categoryId) ?? 0) + s.actualDurationSeconds / 60)
  }
  return [...map.entries()]
    .map(([categoryId, minutes]) => ({ categoryId, minutes: Math.round(minutes) }))
    .sort((a, b) => b.minutes - a.minutes)
}
