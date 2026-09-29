import { describe, expect, it } from 'vitest'
import type { Session } from '../../types'
import { computeCategoryStats, computeDailyStats, computeStats } from './calculator'

const NOW = new Date(2026, 5, 15, 14, 0).getTime() // 15 juin 2026, 14h
const at = (daysAgo: number, hour = 10) => new Date(2026, 5, 15 - daysAgo, hour).getTime()

const s = (daysAgo: number, over: Partial<Session> = {}): Session => ({
  id: Math.random().toString(),
  activityId: 'a',
  activityName: 'A',
  activityIcon: '⚡',
  activityColor: '#fff',
  categoryId: 'work',
  plannedDurationMinutes: 30,
  actualDurationSeconds: 1800,
  startedAt: at(daysAgo),
  endedAt: at(daysAgo) + 1_800_000,
  status: 'completed',
  ...over,
})

describe('computeStats', () => {
  it('cas vide', () => {
    const r = computeStats([], NOW)
    expect(r).toMatchObject({ totalMinutesFocused: 0, currentStreakDays: 0, longestStreakDays: 0, completionRate: 100 })
  })

  it("n'additionne que les sessions terminées", () => {
    const r = computeStats([s(0), s(0, { status: 'abandoned', actualDurationSeconds: 600 }), s(0, { status: 'skipped', actualDurationSeconds: 0 })], NOW)
    expect(r.totalMinutesFocused).toBe(30)
    expect(r.todaySessionsCount).toBe(1)
    expect(r.completionRate).toBe(50)
  })

  it('série courante : aujourd\'hui + jours précédents consécutifs', () => {
    expect(computeStats([s(0), s(1), s(2), s(4)], NOW).currentStreakDays).toBe(3)
  })

  it("la série survit si la dernière session date d'hier", () => {
    expect(computeStats([s(1), s(2)], NOW).currentStreakDays).toBe(2)
  })

  it('la série retombe à 0 après un jour manqué', () => {
    const r = computeStats([s(2), s(3), s(4)], NOW)
    expect(r.currentStreakDays).toBe(0)
    expect(r.longestStreakDays).toBe(3)
  })

  it('plusieurs sessions le même jour comptent une fois', () => {
    expect(computeStats([s(0), s(0, { endedAt: at(0, 12) }), s(1)], NOW).currentStreakDays).toBe(2)
  })

  it('série record indépendante de la série courante', () => {
    const r = computeStats([s(0), s(10), s(11), s(12), s(13)], NOW)
    expect(r.currentStreakDays).toBe(1)
    expect(r.longestStreakDays).toBe(4)
  })

  it("passage à l'heure d'été (mars) sans trou", () => {
    const now = new Date(2026, 2, 30, 12).getTime()
    const mk = (d: number) => s(0, { endedAt: new Date(2026, 2, d, 9).getTime() })
    expect(computeStats([mk(28), mk(29), mk(30)], now).currentStreakDays).toBe(3)
  })
})

describe('computeDailyStats', () => {
  it('renvoie 7 jours, aujourd\'hui en dernier', () => {
    const r = computeDailyStats([s(0), s(0), s(2)], 7, NOW)
    expect(r).toHaveLength(7)
    expect(r[6]).toMatchObject({ isToday: true, minutes: 60, sessions: 2 })
    expect(r[4].minutes).toBe(30)
    expect(r[0].minutes).toBe(0)
  })
})

describe('computeCategoryStats', () => {
  it('agrège par catégorie et trie', () => {
    const r = computeCategoryStats(
      [s(0), s(1, { categoryId: 'body', actualDurationSeconds: 3600 }), s(30, { categoryId: 'leisure' })],
      at(7),
    )
    expect(r).toEqual([
      { categoryId: 'body', minutes: 60 },
      { categoryId: 'work', minutes: 30 },
    ])
  })
})
