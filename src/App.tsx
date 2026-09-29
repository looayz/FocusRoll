import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { db, initializeDatabase, withSettingsDefaults, DEFAULT_SETTINGS } from './lib/storage/db'
import type { ActiveSession, Activity, Category, Session, SessionMood, SessionStatus, UserSettings } from './types'
import { pickNextActivity, computeActivityDuration } from './lib/randomizer/engine'
import { computeStats, dayKey } from './lib/statistics/calculator'
import { loadActiveSession, newActiveSession, saveActiveSession } from './lib/activeSession'
import { Navigation, type NavTab } from './components/navigation/Navigation'
import { HomeView } from './components/home/HomeView'
import { FocusView, MIN_ABANDON_RECORD_SECONDS } from './components/focus/FocusView'
import { HistoryView } from './components/history/HistoryView'
import { SettingsView } from './components/settings/SettingsView'

interface LoadedData {
  activities: Activity[]
  sessions: Session[]
  settings: UserSettings
}

export function App() {
  const [tab, setTab] = useState<NavTab>('home')
  const [loaded, setLoaded] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [activities, setActivities] = useState<Activity[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS)
  const [today, setToday] = useState(() => dayKey(Date.now()))

  // Roulette
  const [isSpinning, setIsSpinning] = useState(false)
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const [duration, setDuration] = useState(25)

  // Session en cours, restaurée après un rechargement / une fermeture de l'app
  const [active, setActive] = useState<ActiveSession | null>(loadActiveSession)

  const activeActivities = useMemo(() => activities.filter((a) => a.active), [activities])

  const loadData = useCallback(async (): Promise<LoadedData> => {
    await initializeDatabase()
    const [acts, cats, sess, userSettings] = await Promise.all([
      db.activities.toArray(),
      db.categories.toArray(),
      db.sessions.orderBy('startedAt').reverse().toArray(),
      db.settings.get(DEFAULT_SETTINGS.id),
    ])
    setActivities(acts)
    setCategories(cats)
    setSessions(sess)
    const merged = withSettingsDefaults(userSettings)
    setSettings(merged)
    return { activities: acts, sessions: sess, settings: merged }
  }, [])

  const rollFrom = useCallback(
    (acts: Activity[], sess: Session[], mode: UserSettings['randomizerMode'], excludeId?: string) => {
      const next = pickNextActivity(acts, sess, mode, { excludeId })
      if (!next) return
      setSelectedActivity(next)
      setDuration(computeActivityDuration(next))
      setIsSpinning(true)
    },
    [],
  )

  const shortcutHandled = useRef(false)
  useEffect(() => {
    loadData()
      .then((data) => {
        setLoaded(true)
        // Raccourci PWA "Lancer un Roll" (manifest : /?action=roll)
        const params = new URLSearchParams(window.location.search)
        if (params.get('action') === 'roll' && !shortcutHandled.current) {
          shortcutHandled.current = true
          window.history.replaceState(null, '', window.location.pathname)
          if (!loadActiveSession()) rollFrom(data.activities, data.sessions, data.settings.randomizerMode)
        }
      })
      .catch(() => setLoadError(true))
    // Demande au navigateur de ne pas purger les données locales (historique = précieux)
    void navigator.storage?.persist?.()
  }, [loadData, rollFrom])

  // Recalcule les stats "du jour" si l'app reste ouverte au-delà de minuit
  useEffect(() => {
    const onVisible = () => document.visibilityState === 'visible' && setToday(dayKey(Date.now()))
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stats = useMemo(() => computeStats(sessions), [sessions, today])

  const handleRoll = () => rollFrom(activities, sessions, settings.randomizerMode)
  const handleReroll = () => rollFrom(activities, sessions, settings.randomizerMode, selectedActivity?.id)

  const handleManualSelectActivity = (act: Activity) => {
    setSelectedActivity(act)
    setDuration(computeActivityDuration(act))
    setIsSpinning(false)
  }

  const updateActive = useCallback((next: ActiveSession | null) => {
    setActive(next)
    saveActiveSession(next)
  }, [])

  const handleStartFocus = (durationMinutes: number) => {
    if (!selectedActivity) return
    updateActive(newActiveSession(selectedActivity, durationMinutes))
    setSelectedActivity(null)
    setIsSpinning(false)
  }

  const handleSpinDone = () => {
    setIsSpinning(false)
    // Mode No Choice : on enchaîne directement sur le focus
    if (settings.noChoiceMode && selectedActivity) handleStartFocus(duration)
  }

  const recordSession = async (
    session: ActiveSession,
    status: SessionStatus,
    extra: { elapsedSeconds: number; mood?: SessionMood; skipReason?: string },
  ) => {
    const { activity } = session
    const endedAt = session.finishedAt ?? Date.now()
    const entry: Session = {
      id: crypto.randomUUID(),
      activityId: activity.id,
      activityName: activity.name,
      activityIcon: activity.icon,
      activityColor: activity.accentColor,
      categoryId: activity.categoryId,
      plannedDurationMinutes: session.durationMinutes,
      actualDurationSeconds: extra.elapsedSeconds,
      startedAt: status === 'skipped' ? endedAt : session.startedAt,
      endedAt,
      status,
      mood: extra.mood,
      skipReason: extra.skipReason,
    }
    await db.sessions.add(entry)
  }

  const handleFocusComplete = async (elapsedSeconds: number, mood?: SessionMood) => {
    if (!active) return
    await recordSession(active, 'completed', { elapsedSeconds, mood })
    updateActive(null)
    await loadData()
  }

  const handleFocusAbandon = async (elapsedSeconds: number) => {
    if (!active) return
    await recordSession(active, elapsedSeconds >= MIN_ABANDON_RECORD_SECONDS ? 'abandoned' : 'skipped', {
      elapsedSeconds,
    })
    updateActive(null)
    await loadData()
  }

  /** Quitte la session sans rien enregistrer (abandon dans les toutes premières secondes, ou session non réalisée). */
  const handleFocusDiscard = async () => {
    updateActive(null)
    await loadData()
  }

  const handleFocusSkip = async (reason: string) => {
    if (!active) return
    const skipped = active.activity
    await recordSession(active, 'skipped', { elapsedSeconds: 0, skipReason: reason })
    updateActive(null)
    const fresh = await loadData()
    // On retire une autre activité que celle qu'on vient de passer
    rollFrom(fresh.activities, fresh.sessions, settings.randomizerMode, skipped.id)
  }

  const handleUpdateSettings = async (partial: Partial<UserSettings>) => {
    const updated = { ...settings, ...partial }
    setSettings(updated)
    await db.settings.put(updated)
  }

  const clearSelectionIf = (id: string) => {
    if (selectedActivity?.id === id) {
      setSelectedActivity(null)
      setIsSpinning(false)
    }
  }

  const handleToggleActivity = async (id: string, isActive: boolean) => {
    await db.activities.update(id, { active: isActive })
    setActivities((prev) => prev.map((a) => (a.id === id ? { ...a, active: isActive } : a)))
    if (!isActive) clearSelectionIf(id)
  }

  const handleDeleteActivity = async (id: string) => {
    await db.activities.delete(id)
    setActivities((prev) => prev.filter((a) => a.id !== id))
    clearSelectionIf(id)
  }

  const handleSaveActivity = async (act: Activity) => {
    await db.activities.put(act)
    clearSelectionIf(act.id)
    await loadData()
  }

  const handleDeleteSession = async (id: string) => {
    await db.sessions.delete(id)
    await loadData()
  }

  const shell = (children: React.ReactNode) => (
    <div className="min-h-dvh bg-[#07080c] text-white flex flex-col items-center justify-start antialiased selection:bg-blue-600/30">
      <div className="w-full max-w-md min-h-dvh flex flex-col relative bg-[#07080c] shadow-2xl border-x border-[#131622]/60">{children}</div>
    </div>
  )

  if (loadError) {
    return shell(
      <div className="m-auto p-8 text-center">
        <p className="text-4xl mb-3">⚠️</p>
        <p className="font-semibold mb-1">Stockage local indisponible</p>
        <p className="text-sm text-zinc-500">
          FOCUSROLL a besoin d'IndexedDB. Quitte la navigation privée ou autorise le stockage du site, puis recharge la page.
        </p>
      </div>,
    )
  }

  // Une session en cours prime sur tout le reste (elle survit au rechargement)
  if (active) {
    return shell(
      <FocusView
        session={active}
        soundEnabled={settings.soundEnabled}
        vibrationEnabled={settings.vibrationEnabled}
        notificationsEnabled={settings.notificationsEnabled}
        onChange={updateActive}
        onComplete={handleFocusComplete}
        onAbandon={handleFocusAbandon}
        onDiscard={handleFocusDiscard}
        onSkip={handleFocusSkip}
      />,
    )
  }

  if (!loaded) return shell(null)

  return shell(
    <>
      {tab === 'home' && (
        <HomeView
          activeActivities={activeActivities}
          hasActivities={activities.length > 0}
          onRoll={handleRoll}
          onManualSelectActivity={handleManualSelectActivity}
          isSpinning={isSpinning}
          selectedActivity={selectedActivity}
          duration={duration}
          onDurationChange={setDuration}
          onStartFocus={handleStartFocus}
          onReroll={handleReroll}
          onSpinDone={handleSpinDone}
          soundEnabled={settings.soundEnabled}
          noChoiceMode={settings.noChoiceMode}
          todayMinutes={stats.todayMinutes}
          todaySessionsCount={stats.todaySessionsCount}
          dailyGoalMinutes={settings.dailyGoalMinutes}
          lastSession={sessions[0]}
          onGoToSettings={() => setTab('settings')}
        />
      )}

      {tab === 'history' && (
        <HistoryView
          sessions={sessions}
          categories={categories}
          dailyGoalMinutes={settings.dailyGoalMinutes}
          onDeleteSession={handleDeleteSession}
        />
      )}

      {tab === 'settings' && (
        <SettingsView
          activities={activities}
          categories={categories}
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onToggleActivity={handleToggleActivity}
          onDeleteActivity={handleDeleteActivity}
          onSaveActivity={handleSaveActivity}
          onDataRestored={() => void loadData()}
        />
      )}

      <Navigation currentTab={tab} onSelectTab={setTab} currentStreak={stats.currentStreakDays} />
    </>,
  )
}

export default App
