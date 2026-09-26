import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Pause, Play, CheckCircle, X, Sparkles } from 'lucide-react'
import confetti from 'canvas-confetti'
import type { Activity, SessionMood } from '../../types'
import { sounds } from '../../lib/sound'

interface FocusViewProps {
  activity: Activity
  durationMinutes: number
  soundEnabled: boolean
  onComplete: (elapsedSeconds: number, mood?: SessionMood) => void
  onAbandon: (elapsedSeconds: number) => void
  onSkip: (reason: string) => void
}

export const FocusView: React.FC<FocusViewProps> = ({
  activity,
  durationMinutes,
  soundEnabled,
  onComplete,
  onAbandon,
  onSkip,
}) => {
  const totalSeconds = durationMinutes * 60
  const [timeLeft, setTimeLeft] = useState(totalSeconds)
  const [isPaused, setIsPaused] = useState(false)
  const [showSkipModal, setShowSkipModal] = useState(false)
  const [showCompletionModal, setShowCompletionModal] = useState(false)
  const [selectedMood, setSelectedMood] = useState<SessionMood>('good')
  const [skipReason, setSkipReason] = useState('')

  const timerRef = useRef<number | null>(null)

  const elapsedSeconds = totalSeconds - timeLeft

  useEffect(() => {
    if (soundEnabled) {
      sounds.start()
    }
  }, [soundEnabled])

  useEffect(() => {
    if (isPaused || showCompletionModal) return

    timerRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          triggerFinish()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }

  }, [isPaused, showCompletionModal])

  const triggerFinish = () => {
    if (soundEnabled) {
      sounds.complete()
    }
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      })
    } catch {
      // fallback
    }
    setShowCompletionModal(true)
  }

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60)
    const s = secs % 60
    return `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const progress = ((totalSeconds - timeLeft) / totalSeconds) * 100

  const skipOptions = [
    'Trop fatigué',
    'Pas dans le mood',
    'Pas assez de temps',
    'Mauvaise activité',
    'Autre urgence',
  ]

  return (
    <div className="relative flex flex-col items-center justify-between min-h-screen px-6 py-10 max-w-md mx-auto text-center bg-[#050608]">
      {/* Background glow for current activity */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full blur-[120px] opacity-15 pointer-events-none"
        style={{ backgroundColor: activity.accentColor || '#3b82f6' }}
      />

      {/* Top minimalistic header */}
      <div className="w-full flex items-center justify-between text-xs text-zinc-500 font-medium z-10">
        <span className="tracking-widest uppercase text-[10px] text-zinc-400">SESSION EN COURS</span>
        <button
          onClick={() => setShowSkipModal(true)}
          className="hover:text-zinc-300 transition-colors"
        >
          Passer
        </button>
      </div>

      {/* Central Focal Zen Ring */}
      <div className="flex flex-col items-center justify-center my-auto z-10 w-full">
        <div className="relative w-64 h-64 flex items-center justify-center">
          {/* Circular SVG Progress */}
          <svg className="absolute w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              className="text-[#131622] stroke-current"
              strokeWidth="3.5"
              fill="transparent"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke={activity.accentColor || '#3b82f6'}
              strokeWidth="4"
              strokeDasharray="282.7"
              strokeDashoffset={282.7 - (282.7 * progress) / 100}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-1000 ease-linear"
            />
          </svg>

          {/* Time & Activity Display */}
          <div className="flex flex-col items-center select-none">
            <span className="text-4xl mb-2 drop-shadow-sm">{activity.icon}</span>
            <span className="font-mono text-4xl font-extrabold tracking-tight text-white">
              {formatTime(timeLeft)}
            </span>
            <p className="text-sm font-semibold text-zinc-300 mt-1 uppercase tracking-wider">
              {activity.name}
            </p>
            <p className="text-[11px] text-zinc-500 italic mt-0.5">Stay focused.</p>
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="w-full max-w-xs flex items-center justify-center gap-4 z-10 pb-4">
        {/* Abandon button */}
        <button
          onClick={() => onAbandon(elapsedSeconds)}
          title="Abandonner"
          className="p-3.5 rounded-full bg-[#12141f] text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 border border-[#1e2235] transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Pause / Play button */}
        <button
          onClick={() => setIsPaused(!isPaused)}
          className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold transition-all border cursor-pointer ${
            isPaused
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              : 'bg-white text-black border-transparent hover:bg-zinc-200'
          }`}
        >
          {isPaused ? <Play className="w-5 h-5 fill-current" /> : <Pause className="w-5 h-5" />}
          <span>{isPaused ? 'REPRENDRE' : 'PAUSE'}</span>
        </button>

        {/* Finish early button */}
        <button
          onClick={triggerFinish}
          title="Terminer maintenant"
          className="p-3.5 rounded-full bg-[#12141f] text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 border border-[#1e2235] transition-all cursor-pointer"
        >
          <CheckCircle className="w-5 h-5" />
        </button>
      </div>

      {/* Skip / Reason Modal */}
      <AnimatePresence>
        {showSkipModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-5">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0e1017] border border-[#202538] rounded-3xl p-6 w-full max-w-sm text-left shadow-2xl"
            >
              <h3 className="text-lg font-bold text-white mb-1">Passer cette session ?</h3>
              <p className="text-xs text-zinc-400 mb-4">
                Pourquoi souhaitez-vous passer ? Cela aide à affiner la roulette.
              </p>

              <div className="space-y-2 mb-5">
                {skipOptions.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setSkipReason(opt)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-medium border transition-all ${
                      skipReason === opt
                        ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                        : 'bg-[#151824] border-[#1e2235] text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowSkipModal(false)}
                  className="flex-1 py-2.5 text-xs font-semibold rounded-xl bg-zinc-800 text-zinc-300"
                >
                  Annuler
                </button>
                <button
                  onClick={() => onSkip(skipReason || 'Non spécifié')}
                  className="flex-1 py-2.5 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-500 text-white"
                >
                  Passer & Relancer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Session Complete Feedback Modal */}
      <AnimatePresence>
        {showCompletionModal && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-lg flex items-center justify-center p-5">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-[#0e1017] border border-[#202538] rounded-3xl p-6 w-full max-w-sm text-center shadow-2xl"
            >
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
                <Sparkles className="w-7 h-7" />
              </div>

              <h2 className="text-xl font-bold text-white">SESSION COMPLETE ✓</h2>
              <p className="text-sm text-zinc-400 mt-1 mb-5">
                {activity.name} · {Math.max(1, Math.round(elapsedSeconds / 60))} minutes
              </p>

              <p className="text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-3">
                How did it feel?
              </p>

              <div className="grid grid-cols-4 gap-2 mb-6">
                {(
                  [
                    { id: 'difficult', emoji: '😫', label: 'Difficile' },
                    { id: 'okay', emoji: '😐', label: 'Moyen' },
                    { id: 'good', emoji: '🙂', label: 'Bien' },
                    { id: 'great', emoji: '🔥', label: 'Super' },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedMood(item.id)}
                    className={`flex flex-col items-center py-2.5 rounded-xl border transition-all ${
                      selectedMood === item.id
                        ? 'bg-blue-600/20 border-blue-500 scale-105'
                        : 'bg-[#151824] border-[#1e2235] opacity-60 hover:opacity-100'
                    }`}
                  >
                    <span className="text-2xl mb-1">{item.emoji}</span>
                    <span className="text-[10px] text-zinc-300 font-medium">{item.label}</span>
                  </button>
                ))}
              </div>

              <button
                onClick={() => onComplete(elapsedSeconds, selectedMood)}
                className="w-full py-3.5 rounded-2xl bg-white text-black font-bold text-sm hover:bg-zinc-100 transition-all cursor-pointer"
              >
                DONE
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
