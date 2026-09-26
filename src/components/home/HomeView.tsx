import { useState } from 'react'
import { motion } from 'framer-motion'
import { Dice5, Play, Sparkles, Clock, CheckCircle2 } from 'lucide-react'
import type { Activity, Session } from '../../types'
import { Roulette } from '../roulette/Roulette'

interface HomeViewProps {
  activities: Activity[]
  onRoll: () => void
  isSpinning: boolean
  selectedActivity: Activity | null
  calculatedDuration: number
  onStartFocus: (durationMinutes: number) => void
  onSkipAndReroll: () => void
  onSpinDone: () => void
  soundEnabled: boolean
  noChoiceMode: boolean
  todayMinutes: number
  todaySessionsCount: number
  lastSession?: Session
}

export const HomeView: React.FC<HomeViewProps> = ({
  activities,
  onRoll,
  isSpinning,
  selectedActivity,
  calculatedDuration,
  onStartFocus,
  onSkipAndReroll,
  onSpinDone,
  soundEnabled,
  noChoiceMode,
  todayMinutes,
  todaySessionsCount,
  lastSession,
}) => {
  const [customDuration, setCustomDuration] = useState<number | null>(null)
  const durationToUse = customDuration || calculatedDuration

  const presetDurations = [15, 25, 30, 45, 60]

  return (
    <div className="flex flex-col items-center justify-between min-h-[calc(100vh-80px)] px-5 py-6 max-w-md mx-auto text-center">
      {/* Top Header / Clock */}
      <div className="w-full flex items-center justify-between text-zinc-500 text-xs font-medium tracking-wider">
        <span>FOCUSROLL</span>
        {noChoiceMode ? (
          <span className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            <Sparkles className="w-3 h-3" /> NO CHOICE
          </span>
        ) : (
          <span>{todaySessionsCount} sessions · {todayMinutes} min</span>
        )}
      </div>

      {/* Hero / State Area */}
      <div className="my-auto w-full flex flex-col items-center">
        {!selectedActivity && !isSpinning && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center"
          >
            <span className="text-zinc-500 uppercase tracking-widest text-xs font-semibold mb-2">
              Next Step
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-6">
              WHAT'S NEXT?
            </h1>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onRoll}
              className="group relative flex items-center justify-center gap-3 px-8 py-5 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white font-bold text-lg shadow-xl shadow-indigo-500/20 border border-indigo-400/30 overflow-hidden cursor-pointer"
            >
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Dice5 className="w-6 h-6 animate-spin-slow" />
              <span>ROLL ACTIVITY</span>
            </motion.button>
          </motion.div>
        )}

        {(isSpinning || (selectedActivity && isSpinning)) && selectedActivity && (
          <Roulette
            activities={activities}
            targetActivity={selectedActivity}
            isSpinning={isSpinning}
            onComplete={onSpinDone}
            soundEnabled={soundEnabled}
          />
        )}

        {selectedActivity && !isSpinning && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full flex flex-col items-center"
          >
            {/* Selected Card */}
            <div className="w-full max-w-xs rounded-3xl bg-[#0f1118] border border-[#1f2233] p-6 shadow-2xl relative overflow-hidden mb-6">
              <div
                className="absolute -top-16 -right-16 w-36 h-36 rounded-full blur-3xl opacity-20 pointer-events-none"
                style={{ backgroundColor: selectedActivity.accentColor || '#3b82f6' }}
              />

              <div className="text-5xl mb-3">{selectedActivity.icon}</div>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                {selectedActivity.name}
              </h2>

              <div className="mt-4 flex items-center justify-center gap-2">
                <Clock className="w-4 h-4 text-zinc-400" />
                <span className="text-lg font-semibold text-zinc-200">
                  {durationToUse} MIN
                </span>
              </div>

              {/* Quick duration presets */}
              <div className="flex justify-center gap-1.5 mt-4 pt-3 border-t border-zinc-800/60">
                {presetDurations.map((dur) => (
                  <button
                    key={dur}
                    onClick={() => setCustomDuration(dur)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                      durationToUse === dur
                        ? 'bg-white text-black font-bold'
                        : 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {dur}m
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 w-full max-w-xs">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onStartFocus(durationToUse)}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-white text-black font-bold text-base shadow-lg hover:bg-zinc-100 transition-all cursor-pointer"
              >
                <Play className="w-5 h-5 fill-black" />
                <span>START FOCUS</span>
              </motion.button>

              {!noChoiceMode && (
                <button
                  onClick={onSkipAndReroll}
                  className="text-xs text-zinc-500 hover:text-zinc-300 py-1 transition-colors"
                >
                  Relancer la roulette
                </button>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Bottom Summary widget */}
      {!selectedActivity && !isSpinning && lastSession && (
        <div className="w-full max-w-xs rounded-2xl bg-[#0f1118]/70 border border-[#1c1f2e] p-3 text-left flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">{lastSession.activityIcon}</span>
            <div>
              <p className="text-xs font-semibold text-zinc-300">Dernière session</p>
              <p className="text-[11px] text-zinc-500">{lastSession.activityName} · {Math.round(lastSession.actualDurationSeconds / 60)} min</p>
            </div>
          </div>
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
        </div>
      )}
    </div>
  )
}
