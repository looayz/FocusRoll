import type { Activity, RandomizerMode, Session } from '../../types'

export function computeActivityDuration(activity: Activity): number {
  if (activity.durationMode === 'fixed') {
    return activity.defaultDurationMinutes
  }
  if (activity.durationMode === 'range' && activity.rangeMinMinutes && activity.rangeMaxMinutes) {
    const min = Math.min(activity.rangeMinMinutes, activity.rangeMaxMinutes)
    const max = Math.max(activity.rangeMinMinutes, activity.rangeMaxMinutes)
    // Pas de 5 minutes
    const step = 5
    const stepsCount = Math.floor((max - min) / step)
    const randomStep = Math.floor(Math.random() * (stepsCount + 1))
    return min + randomStep * step
  }
  return activity.defaultDurationMinutes || 25
}

export function pickNextActivity(
  activities: Activity[],
  recentSessions: Session[],
  mode: RandomizerMode
): Activity | null {
  const activePool = activities.filter((a) => a.active)
  if (activePool.length === 0) return null
  if (activePool.length === 1) return activePool[0]

  if (mode === 'pure') {
    const randomIndex = Math.floor(Math.random() * activePool.length)
    return activePool[randomIndex]
  }

  if (mode === 'smart') {
    // Mode Smart : pondération par poids (1-5) et pénalisation si apparu récemment
    // Récupérer les 5 dernières sessions terminées ou entamées
    const recent = recentSessions.slice(0, 5)
    
    const weightedPool: { activity: Activity; weight: number }[] = activePool.map((act) => {
      let w = Math.max(1, act.weight || 3) * 10

      // Pénalité pour répétition immédiate
      const lastSession = recent[0]
      if (lastSession && lastSession.activityId === act.id) {
        w *= 0.2 // Division drastique de la probabilité si fait juste avant
      } else {
        const countInRecent = recent.filter((s) => s.activityId === act.id).length
        if (countInRecent >= 2) {
          w *= 0.4
        } else if (countInRecent === 1) {
          w *= 0.7
        }
      }

      return { activity: act, weight: Math.max(1, w) }
    })

    return weightedRandom(weightedPool)
  }

  if (mode === 'balanced') {
    // Mode Balanced : Répartir entre catégories
    // Analyser quelles catégories ont été le moins pratiquées récemment
    const categoryCount: Record<string, number> = {}
    recentSessions.slice(0, 10).forEach((s) => {
      categoryCount[s.categoryId] = (categoryCount[s.categoryId] || 0) + 1
    })

    const weightedPool = activePool.map((act) => {
      const occurrences = categoryCount[act.categoryId] || 0
      // Plus la catégorie est délaissée, plus son score est élevé
      const categoryBonus = Math.max(1, 10 - occurrences * 2.5)
      const baseWeight = Math.max(1, act.weight || 3)
      return { activity: act, weight: baseWeight * categoryBonus }
    })

    return weightedRandom(weightedPool)
  }

  return activePool[0]
}

function weightedRandom(pool: { activity: Activity; weight: number }[]): Activity {
  const totalWeight = pool.reduce((sum, item) => sum + item.weight, 0)
  let randomVal = Math.random() * totalWeight
  for (const item of pool) {
    if (randomVal < item.weight) {
      return item.activity
    }
    randomVal -= item.weight
  }
  return pool[pool.length - 1].activity
}
