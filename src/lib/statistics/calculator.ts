import type { Session } from '../../types'

export interface StatsOverview {
  totalMinutesFocused: number
  totalSessionsCompleted: number
  completionRate: number
  currentStreakDays: number
  longestStreakDays: number
  todayMinutes: number
  todaySessionsCount: number
  favoriteActivities: { name: string; icon: string; count: number; minutes: number }[]
}

export function computeStats(sessions: Session[]): StatsOverview {
  const completed = sessions.filter((s) => s.status === 'completed')
  const totalCompletedSecs = completed.reduce((acc, s) => acc + s.actualDurationSeconds, 0)
  const totalMinutesFocused = Math.round(totalCompletedSecs / 60)
  const totalSessionsCompleted = completed.length

  const allRelevant = sessions.filter((s) => s.status === 'completed' || s.status === 'abandoned')
  const completionRate = allRelevant.length > 0 ? Math.round((completed.length / allRelevant.length) * 100) : 100

  // Today stats
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const todaySessions = sessions.filter((s) => s.startedAt >= startOfToday)
  const todayCompleted = todaySessions.filter((s) => s.status === 'completed')
  const todayMinutes = Math.round(todayCompleted.reduce((acc, s) => acc + s.actualDurationSeconds, 0) / 60)

  // Streaks calculation (days with at least 1 completed session)
  const uniqueDays = Array.from(
    new Set(
      completed.map((s) => {
        const d = new Date(s.endedAt)
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      })
    )
  ).sort()

  let currentStreak = 0
  let longestStreak = 0

  if (uniqueDays.length > 0) {
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    const yesterday = new Date(now.getTime() - 86400000)
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`

    const hasToday = uniqueDays.includes(todayStr)
    const hasYesterday = uniqueDays.includes(yesterdayStr)

    if (hasToday || hasYesterday) {
      let streakCounter = 0
      let checkDate = hasToday ? now : yesterday

      while (true) {
        const dStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`
        if (uniqueDays.includes(dStr)) {
          streakCounter++
          checkDate = new Date(checkDate.getTime() - 86400000)
        } else {
          break
        }
      }
      currentStreak = streakCounter
    }

    // Longest streak
    let tempStreak = 0
    let prevTime: number | null = null

    for (const dStr of uniqueDays) {
      const time = new Date(dStr).getTime()
      if (prevTime === null) {
        tempStreak = 1
      } else {
        const diffDays = Math.round((time - prevTime) / 86400000)
        if (diffDays === 1) {
          tempStreak++
        } else {
          tempStreak = 1
        }
      }
      prevTime = time
      if (tempStreak > longestStreak) longestStreak = tempStreak
    }
  }

  // Favorite activities
  const actMap: Record<string, { name: string; icon: string; count: number; minutes: number }> = {}
  completed.forEach((s) => {
    if (!actMap[s.activityId]) {
      actMap[s.activityId] = {
        name: s.activityName,
        icon: s.activityIcon,
        count: 0,
        minutes: 0,
      }
    }
    actMap[s.activityId].count += 1
    actMap[s.activityId].minutes += Math.round(s.actualDurationSeconds / 60)
  })

  const favoriteActivities = Object.values(actMap)
    .sort((a, b) => b.minutes - a.minutes)
    .slice(0, 4)

  return {
    totalMinutesFocused,
    totalSessionsCompleted,
    completionRate,
    currentStreakDays: currentStreak,
    longestStreakDays: longestStreak,
    todayMinutes,
    todaySessionsCount: todaySessions.length,
    favoriteActivities,
  }
}
