import type { Activity, ActiveSession } from '../types'

const KEY = 'focusroll:active-session'

export function loadActiveSession(): ActiveSession | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const s = JSON.parse(raw) as ActiveSession
    if (!s?.activity?.id || !s.durationMinutes || !s.startedAt) return null
    return { ...s, pausedAt: s.pausedAt ?? null, pausedTotalMs: s.pausedTotalMs ?? 0, finishedAt: s.finishedAt ?? null }
  } catch {
    return null
  }
}

export function saveActiveSession(s: ActiveSession | null) {
  try {
    if (s) localStorage.setItem(KEY, JSON.stringify(s))
    else localStorage.removeItem(KEY)
  } catch {
    // stockage indisponible (mode privé…) : la session reste simplement non persistée
  }
}

export function newActiveSession(activity: Activity, durationMinutes: number, now = Date.now()): ActiveSession {
  return { activity, durationMinutes, startedAt: now, pausedAt: null, pausedTotalMs: 0, finishedAt: null }
}

/** Temps effectivement travaillé (pauses exclues), en millisecondes. */
export function elapsedMs(s: ActiveSession, now: number): number {
  const end = s.finishedAt ?? s.pausedAt ?? now
  const total = s.durationMinutes * 60_000
  return Math.min(total, Math.max(0, end - s.startedAt - s.pausedTotalMs))
}

export function remainingMs(s: ActiveSession, now: number): number {
  return Math.max(0, s.durationMinutes * 60_000 - elapsedMs(s, now))
}

export function pauseSession(s: ActiveSession, now: number): ActiveSession {
  return s.pausedAt || s.finishedAt ? s : { ...s, pausedAt: now }
}

export function resumeSession(s: ActiveSession, now: number): ActiveSession {
  if (!s.pausedAt) return s
  return { ...s, pausedAt: null, pausedTotalMs: s.pausedTotalMs + (now - s.pausedAt) }
}

/** Fin naturelle (l'instant exact où le minuteur atteint 0) ou manuelle (maintenant / instant de la pause). */
export function finishSession(s: ActiveSession, now: number, natural: boolean): ActiveSession {
  if (s.finishedAt) return s
  const naturalEnd = s.startedAt + s.pausedTotalMs + s.durationMinutes * 60_000
  return { ...s, finishedAt: natural ? naturalEnd : (s.pausedAt ?? now) }
}
