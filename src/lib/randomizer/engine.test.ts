import { describe, expect, it } from 'vitest'
import type { Activity, Session } from '../../types'
import { computeActivityDuration, pickNextActivity } from './engine'

const act = (id: string, over: Partial<Activity> = {}): Activity => ({
  id,
  name: id,
  icon: '⚡',
  categoryId: 'work',
  durationMode: 'fixed',
  defaultDurationMinutes: 30,
  weight: 3,
  accentColor: '#fff',
  active: true,
  createdAt: 0,
  ...over,
})

const sess = (activityId: string, categoryId: string, over: Partial<Session> = {}): Session => ({
  id: Math.random().toString(),
  activityId,
  activityName: activityId,
  activityIcon: '⚡',
  activityColor: '#fff',
  categoryId,
  plannedDurationMinutes: 30,
  actualDurationSeconds: 1800,
  startedAt: Date.now(),
  endedAt: Date.now(),
  status: 'completed',
  ...over,
})

/** rng déterministe : suite cyclique de valeurs. */
const seq = (...vals: number[]) => {
  let i = 0
  return () => vals[i++ % vals.length]
}

function frequencies(run: () => string, n = 4000) {
  const counts: Record<string, number> = {}
  for (let i = 0; i < n; i++) {
    const id = run()
    counts[id] = (counts[id] ?? 0) + 1
  }
  return counts
}

describe('computeActivityDuration', () => {
  it('renvoie la durée fixe', () => {
    expect(computeActivityDuration(act('a', { defaultDurationMinutes: 45 }))).toBe(45)
  })

  it('reste dans la plage, par pas de 5 min', () => {
    const a = act('a', { durationMode: 'range', rangeMinMinutes: 20, rangeMaxMinutes: 40 })
    for (let i = 0; i < 200; i++) {
      const d = computeActivityDuration(a)
      expect(d).toBeGreaterThanOrEqual(20)
      expect(d).toBeLessThanOrEqual(40)
      expect(d % 5).toBe(0)
    }
    expect(computeActivityDuration(a, () => 0.999999)).toBe(40)
  })

  it('tolère min > max', () => {
    const a = act('a', { durationMode: 'range', rangeMinMinutes: 40, rangeMaxMinutes: 20 })
    expect(computeActivityDuration(a, () => 0)).toBe(20)
  })

  it('retombe sur la durée par défaut si la plage est incomplète', () => {
    const a = act('a', { durationMode: 'range', defaultDurationMinutes: 35 })
    expect(computeActivityDuration(a)).toBe(35)
  })
})

describe('pickNextActivity', () => {
  it('renvoie null sans activité active', () => {
    expect(pickNextActivity([act('a', { active: false })], [], 'smart')).toBeNull()
  })

  it("ignore les activités inactives", () => {
    const acts = [act('a'), act('b', { active: false })]
    expect(frequencies(() => pickNextActivity(acts, [], 'pure')!.id, 200)).toEqual({ a: 200 })
  })

  it("exclut l'activité demandée quand il y a une alternative", () => {
    const acts = [act('a'), act('b'), act('c')]
    for (const mode of ['pure', 'smart', 'balanced'] as const) {
      const ids = frequencies(() => pickNextActivity(acts, [], mode, { excludeId: 'a' })!.id, 300)
      expect(ids.a).toBeUndefined()
    }
  })

  it("garde l'unique activité même si elle est exclue", () => {
    expect(pickNextActivity([act('a')], [], 'smart', { excludeId: 'a' })!.id).toBe('a')
  })

  it('pure : distribution équiprobable', () => {
    const acts = [act('a', { weight: 5 }), act('b', { weight: 1 })]
    const f = frequencies(() => pickNextActivity(acts, [], 'pure')!.id)
    expect(f.a / 4000).toBeGreaterThan(0.45)
    expect(f.a / 4000).toBeLessThan(0.55)
  })

  it('smart : respecte les poids', () => {
    const acts = [act('a', { weight: 5 }), act('b', { weight: 1 })]
    const f = frequencies(() => pickNextActivity(acts, [], 'smart')!.id)
    expect(f.a).toBeGreaterThan(f.b * 3)
  })

  it('smart : pénalise la répétition immédiate', () => {
    const acts = [act('a'), act('b')]
    const history = [sess('a', 'work')]
    const f = frequencies(() => pickNextActivity(acts, history, 'smart')!.id)
    expect(f.b).toBeGreaterThan(f.a * 3)
  })

  it("smart : une session passée ne compte pas comme 'pratiquée'", () => {
    const acts = [act('a'), act('b')]
    const history = [sess('a', 'work', { status: 'skipped' })]
    const f = frequencies(() => pickNextActivity(acts, history, 'smart')!.id)
    expect(Math.abs(f.a - f.b)).toBeLessThan(400)
  })

  it("balanced : une catégorie n'est pas favorisée parce qu'elle a plus d'activités", () => {
    const acts = [
      act('w1', { categoryId: 'work' }),
      act('w2', { categoryId: 'work' }),
      act('w3', { categoryId: 'work' }),
      act('b1', { categoryId: 'body' }),
    ]
    const f = frequencies(() => pickNextActivity(acts, [], 'balanced')!.categoryId)
    expect(f.body / 4000).toBeGreaterThan(0.45)
    expect(f.body / 4000).toBeLessThan(0.55)
  })

  it('balanced : favorise la catégorie délaissée', () => {
    const acts = [act('w', { categoryId: 'work' }), act('b', { categoryId: 'body' })]
    const history = Array.from({ length: 4 }, () => sess('w', 'work'))
    const f = frequencies(() => pickNextActivity(acts, history, 'balanced')!.categoryId)
    expect(f.body).toBeGreaterThan(f.work * 3)
  })

  it('utilise le rng injecté (déterministe)', () => {
    const acts = [act('a'), act('b'), act('c')]
    expect(pickNextActivity(acts, [], 'pure', { rng: seq(0) })!.id).toBe('a')
    expect(pickNextActivity(acts, [], 'pure', { rng: seq(0.99) })!.id).toBe('c')
  })
})
