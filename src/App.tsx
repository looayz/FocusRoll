import { useEffect, useState } from 'react'
import { db, initializeDatabase, DEFAULT_SETTINGS } from './lib/storage/db'
import type { Activity, Category, Session, SessionMood, UserSettings } from './types'
import { pickNextActivity, computeActivityDuration } from './lib/randomizer/engine'
import { computeStats } from './lib/statistics/calculator'
import { notifySessionComplete } from './lib/notifications'
import { Navigation, type NavTab } from './components/navigation/Navigation'
import { HomeView } from './components/home/HomeView'
import { FocusView } from './components/focus/FocusView'
import { HistoryView } from './components/history/HistoryView'
import { SettingsView } from './components/settings/SettingsView'

export function App() {
  const [tab, setTab] = useState<NavTab>('home')
  const [activities, setActivities] = useState<Activity[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS)

  // Roulette & Focus states
  const [isSpinning, setIsSpinning] = useState(false)
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const [calculatedDuration, setCalculatedDuration] = useState<number>(25)
  const [isFocusActive, setIsFocusActive] = useState(false)
  const [activeSessionDuration, setActiveSessionDuration] = useState<number>(25)

  // Initialize DB and load data
  const loadData = async () => {
    await initializeDatabase()
    const acts = await db.activities.toArray()
    const cats = await db.categories.toArray()
    const sess = await db.sessions.reverse().sortBy('startedAt')
    const userSettings = await db.settings.get(DEFAULT_SETTINGS.id)

    setActivities(acts)
    setCategories(cats)
    setSessions(sess)
    if (userSettings) setSettings(userSettings)
  }

  useEffect(() => {
    loadData()
  }, [])

  // Action: Launch Roll
  const handleRoll = () => {
    const next = pickNextActivity(activities, sessions, settings.randomizerMode)
    if (!next) return

    setSelectedActivity(next)
    const dur = computeActivityDuration(next)
    setCalculatedDuration(dur)
    setIsSpinning(true)
  }

  // Action: Spin completes
  const handleSpinDone = () => {
    setIsSpinning(false)
    if (settings.noChoiceMode && selectedActivity) {
      // Auto start focus directly in No Choice mode
      handleStartFocus(calculatedDuration)
    }
  }

  // Action: Start Focus
  const handleStartFocus = (durationMinutes: number) => {
    setActiveSessionDuration(durationMinutes)
    setIsFocusActive(true)
  }

  // Action: Focus complete
  const handleFocusComplete = async (elapsedSeconds: number, mood?: SessionMood) => {
    if (!selectedActivity) return

    const newSession: Session = {
      id: `sess-${Date.now()}`,
      activityId: selectedActivity.id,
      activityName: selectedActivity.name,
      activityIcon: selectedActivity.icon,
      activityColor: selectedActivity.accentColor,
      categoryId: selectedActivity.categoryId,
      plannedDurationMinutes: activeSessionDuration,
      actualDurationSeconds: elapsedSeconds,
      startedAt: Date.now() - elapsedSeconds * 1000,
      endedAt: Date.now(),
      status: 'completed',
      mood,
    }

    await db.sessions.add(newSession)
    if (settings.notificationsEnabled) {
      notifySessionComplete(selectedActivity.name, activeSessionDuration)
    }

    setIsFocusActive(false)
    setSelectedActivity(null)
    loadData()
  }

  // Action: Focus abandon
  const handleFocusAbandon = async (elapsedSeconds: number) => {
    if (!selectedActivity) return

    const newSession: Session = {
      id: `sess-${Date.now()}`,
      activityId: selectedActivity.id,
      activityName: selectedActivity.name,
      activityIcon: selectedActivity.icon,
      activityColor: selectedActivity.accentColor,
      categoryId: selectedActivity.categoryId,
      plannedDurationMinutes: activeSessionDuration,
      actualDurationSeconds: elapsedSeconds,
      startedAt: Date.now() - elapsedSeconds * 1000,
      endedAt: Date.now(),
      status: 'abandoned',
    }

    await db.sessions.add(newSession)
    setIsFocusActive(false)
    setSelectedActivity(null)
    loadData()
  }

  // Action: Focus skip
  const handleFocusSkip = async (reason: string) => {
    if (!selectedActivity) return

    const newSession: Session = {
      id: `sess-${Date.now()}`,
      activityId: selectedActivity.id,
      activityName: selectedActivity.name,
      activityIcon: selectedActivity.icon,
      activityColor: selectedActivity.accentColor,
      categoryId: selectedActivity.categoryId,
      plannedDurationMinutes: activeSessionDuration,
      actualDurationSeconds: 0,
      startedAt: Date.now(),
      endedAt: Date.now(),
      status: 'skipped',
      skipReason: reason,
    }

    await db.sessions.add(newSession)
    setIsFocusActive(false)
    setSelectedActivity(null)
    await loadData()
    // Reroll immediately
    handleRoll()
  }

  // Settings update
  const handleUpdateSettings = async (partial: Partial<UserSettings>) => {
    const updated = { ...settings, ...partial }
    setSettings(updated)
    await db.settings.put(updated)
  }

  // Toggle activity
  const handleToggleActivity = async (id: string, active: boolean) => {
    await db.activities.update(id, { active })
    setActivities((prev) => prev.map((a) => (a.id === id ? { ...a, active } : a)))
  }

  // Delete activity
  const handleDeleteActivity = async (id: string) => {
    await db.activities.delete(id)
    setActivities((prev) => prev.filter((a) => a.id !== id))
  }

  // Save activity (create or edit)
  const handleSaveActivity = async (act: Activity) => {
    await db.activities.put(act)
    await loadData()
  }

  const stats = computeStats(sessions)

  return (
    <div className="min-h-screen bg-[#07080c] text-white flex flex-col items-center justify-start antialiased selection:bg-blue-600/30">
      <div className="w-full max-w-md min-h-screen flex flex-col relative bg-[#07080c] shadow-2xl border-x border-[#131622]/60">
        {isFocusActive && selectedActivity ? (
          <FocusView
            activity={selectedActivity}
            durationMinutes={activeSessionDuration}
            soundEnabled={settings.soundEnabled}
            onComplete={handleFocusComplete}
            onAbandon={handleFocusAbandon}
            onSkip={handleFocusSkip}
          />
        ) : (
          <>
            {tab === 'home' && (
              <HomeView
                activities={activities}
                onRoll={handleRoll}
                isSpinning={isSpinning}
                selectedActivity={selectedActivity}
                calculatedDuration={calculatedDuration}
                onStartFocus={handleStartFocus}
                onSkipAndReroll={handleRoll}
                onSpinDone={handleSpinDone}
                soundEnabled={settings.soundEnabled}
                noChoiceMode={settings.noChoiceMode}
                todayMinutes={stats.todayMinutes}
                todaySessionsCount={stats.todaySessionsCount}
                lastSession={sessions[0]}
              />
            )}

            {tab === 'history' && <HistoryView sessions={sessions} />}

            {tab === 'settings' && (
              <SettingsView
                activities={activities}
                categories={categories}
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
                onToggleActivity={handleToggleActivity}
                onDeleteActivity={handleDeleteActivity}
                onSaveActivity={handleSaveActivity}
              />
            )}

            <Navigation
              currentTab={tab}
              onSelectTab={setTab}
              currentStreak={stats.currentStreakDays}
            />
          </>
        )}
      </div>
    </div>
  )
}

export default App
