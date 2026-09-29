import type { Activity, RandomizerMode, Session } from '../../types'

export type Rng = () => number

export interface PickOptions {
  /** Activité à ne pas retirer (ex. celle qu'on vient de passer ou de relancer). */
  excludeId?: string
  rng?: Rng
}

const MIN_STEP = 5

export function computeActivityDuration(activity: Activity, rng: Rng = Math.random): number {
  if (activity.durationMode === 'range' && activity.rangeMinMinutes && activity.rangeMaxMinutes) {
    const min = Math.min(activity.rangeMinMinutes, activity.rangeMaxMinutes)
    const max = Math.max(activity.rangeMinMinutes, activity.rangeMaxMinutes)
    const stepsCount = Math.floor((max - min) / MIN_STEP)
    return min + Math.floor(rng() * (stepsCount + 1)) * MIN_STEP
  }
  return activity.defaultDurationMinutes || 25
}

function clampWeight(a: Activity): number {
  return Math.min(5, Math.max(1, a.weight || 3))
}

export function pickNextActivity(
  activities: Activity[],
  sessions: Session[],
  mode: RandomizerMode,
  { excludeId, rng = Math.random }: PickOptions = {}
): Activity | null {
  let pool = activities.filter((a) => a.active)
  if (pool.length === 0) return null
  if (pool.length > 1 && excludeId) {
    pool = pool.filter((a) => a.id !== excludeId)
  }
  if (pool.length === 1) return pool[0]

  // Seules les sessions réellement pratiquées comptent pour l'historique récent
  // (une activité passée n'a pas été "faite"), triées de la plus récente à la plus ancienne.
  const practiced = sessions
    .filter((s) => s.status !== 'skipped')
    .sort((a, b) => b.startedAt - a.startedAt)

  if (mode === 'pure') {
    return pool[Math.floor(rng() * pool.length)]
  }

  if (mode === 'balanced') {
    // 1) choisir une catégorie (les plus délaissées récemment sont favorisées),
    // 2) puis une activité de cette catégorie selon son poids.
    // Une catégorie n'a ainsi pas plus de chances simplement parce qu'elle contient plus d'activités.
    const recent = practiced.slice(0, 10)
    const byCategory = new Map<string, Activity[]>()
    for (const a of pool) byCategory.set(a.categoryId, [...(byCategory.get(a.categoryId) ?? []), a])

    const categoryPool = [...byCategory.keys()].map((categoryId) => {
      const occurrences = recent.filter((s) => s.categoryId === categoryId).length
      return { item: categoryId, weight: Math.max(1, 10 - occurrences * 2.5) }
    })
    const categoryId = weightedRandom(categoryPool, rng)
    const inCategory = (byCategory.get(categoryId) ?? pool).map((a) => ({ item: a, weight: clampWeight(a) }))
    return weightedRandom(inCategory, rng)
  }

  // smart : poids configuré (1-5) + pénalité de répétition sur les 5 dernières sessions
  const recent = practiced.slice(0, 5)
  const weighted = pool.map((a) => {
    let w = clampWeight(a) * 10
    if (recent[0]?.activityId === a.id) {
      w *= 0.2
    } else {
      const count = recent.filter((s) => s.activityId === a.id).length
      if (count >= 2) w *= 0.4
      else if (count === 1) w *= 0.7
    }
    return { item: a, weight: Math.max(1, w) }
  })
  return weightedRandom(weighted, rng)
}

function weightedRandom<T>(pool: { item: T; weight: number }[], rng: Rng): T {
  const total = pool.reduce((sum, p) => sum + p.weight, 0)
  let r = rng() * total
  for (const p of pool) {
    if (r < p.weight) return p.item
    r -= p.weight
  }
  return pool[pool.length - 1].item
}
