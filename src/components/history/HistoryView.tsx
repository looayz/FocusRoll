import { useMemo, useState } from 'react'
import { CheckCircle2, XCircle, FastForward, Flame, Calendar, Award, Clock, Trash2, Trophy } from 'lucide-react'
import type { Category, Session } from '../../types'
import { computeCategoryStats, computeDailyStats, computeStats, dayKey, startOfDay } from '../../lib/statistics/calculator'
import { ConfirmDialog } from '../ui/ConfirmDialog'

interface HistoryViewProps {
  sessions: Session[]
  categories: Category[]
  dailyGoalMinutes: number
  onDeleteSession: (id: string) => void
}

type FilterPeriod = 'today' | 'week' | 'month' | 'all'

const DAY_MS = 86_400_000
const WEEKDAYS = ['D', 'L', 'M', 'M', 'J', 'V', 'S']
const MOOD_EMOJI = { great: '🔥', good: '🙂', okay: '😐', difficult: '😫' } as const

function dayLabel(ts: number, now: number): string {
  const d = new Date(ts)
  if (dayKey(d) === dayKey(now)) return "AUJOURD'HUI"
  if (dayKey(d) === dayKey(now - DAY_MS)) return 'HIER'
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase()
}

export const HistoryView: React.FC<HistoryViewProps> = ({ sessions, categories, dailyGoalMinutes, onDeleteSession }) => {
  const [filter, setFilter] = useState<FilterPeriod>('today')
  const [pendingDelete, setPendingDelete] = useState<Session | null>(null)

  // `sessions` change à chaque enregistrement : on en profite pour rafraîchir l'horloge
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const now = useMemo(() => Date.now(), [sessions, filter])
  const stats = useMemo(() => computeStats(sessions, now), [sessions, now])
  const week = useMemo(() => computeDailyStats(sessions, 7, now), [sessions, now])
  const categoryStats = useMemo(() => computeCategoryStats(sessions, startOfDay(now) - 6 * DAY_MS), [sessions, now])

  const groups = useMemo(() => {
    const since =
      filter === 'today' ? startOfDay(now) : filter === 'week' ? now - 7 * DAY_MS : filter === 'month' ? now - 30 * DAY_MS : 0
    const map = new Map<string, { label: string; items: Session[] }>()
    for (const s of sessions.filter((x) => x.startedAt >= since)) {
      const key = dayKey(s.startedAt)
      if (!map.has(key)) map.set(key, { label: dayLabel(s.startedAt, now), items: [] })
      map.get(key)!.items.push(s)
    }
    return [...map.values()]
  }, [sessions, filter, now])

  const categoryById = new Map(categories.map((c) => [c.id, c]))
  const chartMax = Math.max(dailyGoalMinutes, ...week.map((d) => d.minutes), 30)
  const weekTotal = week.reduce((acc, d) => acc + d.minutes, 0)
  const categoryTotal = categoryStats.reduce((acc, c) => acc + c.minutes, 0)

  return (
    <div className="flex flex-col min-h-[calc(100dvh-5rem)] px-5 pt-[max(1.5rem,env(safe-area-inset-top))] max-w-md mx-auto w-full pb-28">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">JOURNAL FOCUS</h1>
          <p className="text-xs text-zinc-500">Progression et historique</p>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
          <Flame className="w-4 h-4 fill-amber-400" />
          <span className="text-xs font-bold">
            {stats.currentStreakDays} jour{stats.currentStreakDays > 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {stats.currentStreakDays === 0 && (
        <p className="text-xs text-zinc-400 bg-[#0f111a] border border-[#1b1e2c] rounded-2xl px-3.5 py-2.5 mb-4">
          {stats.longestStreakDays > 0
            ? `Ton record est de ${stats.longestStreakDays} jour${stats.longestStreakDays > 1 ? 's' : ''}. Une seule session aujourd'hui relance ta série — sans culpabilité.`
            : "Une première session aujourd'hui lance ta série."}
        </p>
      )}

      <div className="grid grid-cols-4 gap-2 mb-5">
        <StatTile icon={<Clock className="w-4 h-4 mx-auto text-blue-400 mb-1" />} value={`${stats.totalMinutesFocused}m`} label="Temps total" />
        <StatTile icon={<Award className="w-4 h-4 mx-auto text-emerald-400 mb-1" />} value={String(stats.totalSessionsCompleted)} label="Terminées" />
        <StatTile icon={<Calendar className="w-4 h-4 mx-auto text-violet-400 mb-1" />} value={`${stats.completionRate}%`} label="Réussite" />
        <StatTile icon={<Trophy className="w-4 h-4 mx-auto text-amber-400 mb-1" />} value={`${stats.longestStreakDays}j`} label="Record" />
      </div>

      {/* 7 derniers jours */}
      <div className="bg-[#0f111a] border border-[#1b1e2c] rounded-2xl p-4 mb-3">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">7 derniers jours</span>
          <span className="text-[11px] text-zinc-500 font-mono">{weekTotal} min</span>
        </div>
        <div className="relative h-24 flex items-end gap-2" role="img" aria-label={`Minutes de focus par jour : ${week.map((d) => d.minutes).join(', ')}`}>
          {dailyGoalMinutes > 0 && (
            <div
              className="absolute left-0 right-0 border-t border-dashed border-emerald-500/40 pointer-events-none"
              style={{ bottom: `${(dailyGoalMinutes / chartMax) * 100}%` }}
            />
          )}
          {week.map((d) => (
            <div key={d.key} className="flex-1 h-full flex items-end">
              <div
                className={`w-full rounded-t-md transition-all ${
                  d.minutes === 0 ? 'bg-zinc-800/60' : dailyGoalMinutes > 0 && d.minutes >= dailyGoalMinutes ? 'bg-emerald-500' : 'bg-blue-500'
                }`}
                style={{ height: `${d.minutes === 0 ? 4 : Math.max(6, (d.minutes / chartMax) * 100)}%` }}
                title={`${d.minutes} min`}
              />
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-1.5">
          {week.map((d) => (
            <span key={d.key} className={`flex-1 text-center text-[10px] ${d.isToday ? 'text-white font-bold' : 'text-zinc-600'}`}>
              {WEEKDAYS[d.date.getDay()]}
            </span>
          ))}
        </div>
        {dailyGoalMinutes > 0 && <p className="text-[10px] text-zinc-600 mt-2">Pointillés : objectif de {dailyGoalMinutes} min/jour</p>}
      </div>

      {/* Équilibre de vie */}
      {categoryStats.length > 0 && (
        <div className="bg-[#0f111a] border border-[#1b1e2c] rounded-2xl p-4 mb-5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Équilibre · 7 jours</span>
          <div className="mt-3 space-y-2.5">
            {categoryStats.map((c) => {
              const cat = categoryById.get(c.categoryId)
              return (
                <div key={c.categoryId}>
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-zinc-300">
                      {cat?.icon ?? '•'} {cat?.name ?? 'Autre'}
                    </span>
                    <span className="text-zinc-500 font-mono">{c.minutes} min</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(c.minutes / categoryTotal) * 100}%`, backgroundColor: cat?.color ?? '#3b82f6' }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="flex bg-[#0d0e15] p-1 rounded-xl border border-[#191c2b] mb-5" role="tablist">
        {(['today', 'week', 'month', 'all'] as const).map((period) => (
          <button
            key={period}
            role="tab"
            aria-selected={filter === period}
            onClick={() => setFilter(period)}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              filter === period ? 'bg-[#1e2236] text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {period === 'today' ? "Auj." : period === 'week' ? 'Semaine' : period === 'month' ? 'Mois' : 'Tout'}
          </button>
        ))}
      </div>

      {groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <span className="text-4xl mb-2">🎯</span>
          <p className="text-sm font-semibold text-zinc-400">Aucune session sur cette période</p>
          <p className="text-xs text-zinc-600 mt-1">Lance la roulette pour démarrer ton prochain focus.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map(({ label, items }) => (
            <div key={label + items[0].id}>
              <h3 className="text-[10px] font-bold tracking-widest text-zinc-500 mb-2.5 px-1">{label}</h3>

              <div className="space-y-2">
                {items.map((s) => (
                  <div key={s.id} className="flex items-center justify-between p-3.5 rounded-2xl bg-[#0e1017] border border-[#1a1c29]">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-2xl">{s.activityIcon}</span>
                      <div className="text-left min-w-0">
                        <p className="text-sm font-semibold text-zinc-200 truncate">{s.activityName}</p>
                        <p className="text-xs text-zinc-500">
                          {s.status === 'skipped' ? 'Passée' : `${Math.max(1, Math.round(s.actualDurationSeconds / 60))} min`}
                          {s.mood && <span className="ml-2">{MOOD_EMOJI[s.mood]}</span>}
                          {s.skipReason && <span className="ml-2 text-rose-400/80">({s.skipReason})</span>}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {s.status === 'completed' && <CheckCircle2 className="w-5 h-5 text-emerald-400" aria-label="Terminée" />}
                      {s.status === 'abandoned' && <XCircle className="w-5 h-5 text-rose-500/80" aria-label="Abandonnée" />}
                      {s.status === 'skipped' && <FastForward className="w-5 h-5 text-zinc-600" aria-label="Passée" />}
                      <button
                        onClick={() => setPendingDelete(s)}
                        aria-label="Supprimer cette session"
                        className="p-2 text-zinc-600 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Supprimer cette session ?"
        message={pendingDelete ? `${pendingDelete.activityName} sera retirée du journal et des statistiques.` : undefined}
        confirmLabel="Supprimer"
        danger
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) onDeleteSession(pendingDelete.id)
          setPendingDelete(null)
        }}
      />
    </div>
  )
}

const StatTile: React.FC<{ icon: React.ReactNode; value: string; label: string }> = ({ icon, value, label }) => (
  <div className="bg-[#0f111a] border border-[#1b1e2c] p-2.5 rounded-2xl text-center">
    {icon}
    <span className="text-sm font-bold text-white">{value}</span>
    <p className="text-[10px] text-zinc-500 font-medium">{label}</p>
  </div>
)
