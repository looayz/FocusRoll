import { describe, expect, it } from 'vitest'
import type { Activity } from '../types'
import { elapsedMs, finishSession, newActiveSession, pauseSession, remainingMs, resumeSession } from './activeSession'

const activity = { id: 'a', name: 'A' } as Activity
const T0 = 1_000_000
const MIN = 60_000

describe('activeSession', () => {
  it('le temps écoulé suit l\'horloge, pas un compteur', () => {
    const s = newActiveSession(activity, 25, T0)
    expect(elapsedMs(s, T0 + 5 * MIN)).toBe(5 * MIN)
    expect(remainingMs(s, T0 + 5 * MIN)).toBe(20 * MIN)
  })

  it('exclut le temps de pause', () => {
    let s = newActiveSession(activity, 25, T0)
    s = pauseSession(s, T0 + 5 * MIN)
    expect(elapsedMs(s, T0 + 60 * MIN)).toBe(5 * MIN) // figé pendant la pause
    s = resumeSession(s, T0 + 15 * MIN)
    expect(elapsedMs(s, T0 + 20 * MIN)).toBe(10 * MIN)
  })

  it('ne dépasse jamais la durée prévue', () => {
    const s = newActiveSession(activity, 10, T0)
    expect(elapsedMs(s, T0 + 999 * MIN)).toBe(10 * MIN)
    expect(remainingMs(s, T0 + 999 * MIN)).toBe(0)
  })

  it('fin naturelle détectée en retard : durée exacte', () => {
    const s = finishSession(newActiveSession(activity, 10, T0), T0 + 300 * MIN, true)
    expect(s.finishedAt).toBe(T0 + 10 * MIN)
    expect(elapsedMs(s, T0 + 500 * MIN)).toBe(10 * MIN)
  })

  it('fin manuelle : temps écoulé au moment du clic', () => {
    const s = finishSession(newActiveSession(activity, 30, T0), T0 + 12 * MIN, false)
    expect(elapsedMs(s, T0 + 100 * MIN)).toBe(12 * MIN)
  })

  it('fin manuelle pendant une pause : compte jusqu\'à la pause', () => {
    const s = finishSession(pauseSession(newActiveSession(activity, 30, T0), T0 + 8 * MIN), T0 + 20 * MIN, false)
    expect(elapsedMs(s, T0 + 100 * MIN)).toBe(8 * MIN)
  })
})
