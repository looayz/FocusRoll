import { useState } from 'react'
import { CheckCircle2, XCircle, FastForward, Flame, Calendar, Award, Clock } from 'lucide-react'
import type { Session } from '../../types'
import { computeStats } from '../../lib/statistics/calculator'

interface HistoryViewProps {
  sessions: Session[]
}

type FilterPeriod = 'today' | 'week' | 'month' | 'all'

export const HistoryView: React.FC<HistoryViewProps> = ({ sessions }) => {
  const [filter, setFilter] = useState<FilterPeriod>('today')

  const now = Date.now()
  const oneDay = 86400000

  const filteredSessions = sessions.filter((s) => {
    if (filter === 'today') {
      const startOfToday = new Date().setHours(0, 0, 0, 0)
      return s.startedAt >= startOfToday
    }
    if (filter === 'week') {
      return s.startedAt >= now - 7 * oneDay
    }
    if (filter === 'month') {
      return s.startedAt >= now - 30 * oneDay
    }
    return true
  })

  const stats = computeStats(sessions)

  // Formatter la date
  const formatDateGroup = (timestamp: number) => {
    const d = new Date(timestamp)
    const today = new Date().toDateString()
    const yesterday = new Date(Date.now() - oneDay).toDateString()

    if (d.toDateString() === today) return "AUJOURD'HUI"
    if (d.toDateString() === yesterday) return 'HIER'
    return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase()
  }

  // Grouper les sessions par jour
  const groups: { [dateStr: string]: Session[] } = {}
  filteredSessions.forEach((s) => {
    const key = formatDateGroup(s.startedAt)
    if (!groups[key]) groups[key] = []
    groups[key].push(s)
  })

  return (
    <div className="flex flex-col min-h-[calc(100vh-80px)] px-5 py-6 max-w-md mx-auto w-full pb-20">
      {/* Top Title & Streaks */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">JOURNAL FOCUS</h1>
          <p className="text-xs text-zinc-500">Progression et historique</p>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
          <Flame className="w-4 h-4 fill-amber-400" />
          <span className="text-xs font-bold">{stats.currentStreakDays} jours</span>
        </div>
      </div>

      {/* Highlights stats banner */}
      <div className="grid grid-cols-3 gap-2.5 mb-6">
        <div className="bg-[#0f111a] border border-[#1b1e2c] p-3 rounded-2xl text-center">
          <Clock className="w-4 h-4 mx-auto text-blue-400 mb-1" />
          <span className="text-base font-bold text-white">{stats.totalMinutesFocused}m</span>
          <p className="text-[10px] text-zinc-500 font-medium">Temps total</p>
        </div>

        <div className="bg-[#0f111a] border border-[#1b1e2c] p-3 rounded-2xl text-center">
          <Award className="w-4 h-4 mx-auto text-emerald-400 mb-1" />
          <span className="text-base font-bold text-white">{stats.totalSessionsCompleted}</span>
          <p className="text-[10px] text-zinc-500 font-medium">Complétées</p>
        </div>

        <div className="bg-[#0f111a] border border-[#1b1e2c] p-3 rounded-2xl text-center">
          <Calendar className="w-4 h-4 mx-auto text-violet-400 mb-1" />
          <span className="text-base font-bold text-white">{stats.completionRate}%</span>
          <p className="text-[10px] text-zinc-500 font-medium">Réussite</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex bg-[#0d0e15] p-1 rounded-xl border border-[#191c2b] mb-5">
        {(['today', 'week', 'month', 'all'] as const).map((period) => (
          <button
            key={period}
            onClick={() => setFilter(period)}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all ${
              filter === period
                ? 'bg-[#1e2236] text-white shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {period === 'today' ? "Auj." : period === 'week' ? 'Semaine' : period === 'month' ? 'Mois' : 'Tout'}
          </button>
        ))}
      </div>

      {/* List by days */}
      {Object.keys(groups).length === 0 ? (
        <div className="flex flex-col items-center justify-center my-auto py-12 text-center">
          <span className="text-4xl mb-2">🎯</span>
          <p className="text-sm font-semibold text-zinc-400">Aucune session enregistrée</p>
          <p className="text-xs text-zinc-600 mt-1">Lancez la roulette pour démarrer votre premier focus.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groups).map(([dateGroup, items]) => (
            <div key={dateGroup}>
              <h3 className="text-[10px] font-bold tracking-widest text-zinc-500 mb-2.5 px-1">
                {dateGroup}
              </h3>

              <div className="space-y-2">
                {items.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-[#0e1017] border border-[#1a1c29]"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{s.activityIcon}</span>
                      <div className="text-left">
                        <p className="text-sm font-semibold text-zinc-200">{s.activityName}</p>
                        <p className="text-xs text-zinc-500">
                          {Math.max(1, Math.round(s.actualDurationSeconds / 60))} min
                          {s.mood && (
                            <span className="ml-2">
                              {s.mood === 'great' ? '🔥' : s.mood === 'good' ? '🙂' : s.mood === 'okay' ? '😐' : '😫'}
                            </span>
                          )}
                          {s.skipReason && (
                            <span className="ml-2 text-rose-400/80">({s.skipReason})</span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div>
                      {s.status === 'completed' && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      )}
                      {s.status === 'abandoned' && (
                        <XCircle className="w-5 h-5 text-rose-500/80" />
                      )}
                      {s.status === 'skipped' && (
                        <FastForward className="w-5 h-5 text-zinc-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
