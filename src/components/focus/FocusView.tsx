import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Pause, Play, CheckCircle, X, Sparkles } from 'lucide-react'
import type { ActiveSession, SessionMood } from '../../types'
import { sounds } from '../../lib/sound'
import { notifySessionComplete, vibrate } from '../../lib/notifications'
import { useWakeLock } from '../../lib/useWakeLock'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { elapsedMs, finishSession, pauseSession, remainingMs, resumeSession } from '../../lib/activeSession'

/** En dessous, la session n'est pas enregistrée si on abandonne, et ne peut pas être "terminée" à la main. */
export const MIN_ABANDON_RECORD_SECONDS = 30
export const MIN_EARLY_FINISH_SECONDS = 60

interface FocusViewProps {
  session: ActiveSession
  soundEnabled: boolean
  vibrationEnabled: boolean
  notificationsEnabled: boolean
  onChange: (session: ActiveSession) => void
  onComplete: (elapsedSeconds: number, mood?: SessionMood) => void
  onAbandon: (elapsedSeconds: number) => void
  onDiscard: () => void
  onSkip: (reason: string) => void
}

const SKIP_OPTIONS = ['Trop fatigué', 'Pas dans le mood', 'Pas assez de temps', 'Mauvaise activité', 'Autre urgence']

const MOODS = [
  { id: 'difficult', emoji: '😫', label: 'Difficile' },
  { id: 'okay', emoji: '😐', label: 'Moyen' },
  { id: 'good', emoji: '🙂', label: 'Bien' },
  { id: 'great', emoji: '🔥', label: 'Super' },
] as const

const RING_LENGTH = 282.7

const formatTime = (secs: number) =>
  `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`

export const FocusView: React.FC<FocusViewProps> = ({
  session,
  soundEnabled,
  vibrationEnabled,
  notificationsEnabled,
  onChange,
  onComplete,
  onAbandon,
  onDiscard,
  onSkip,
}) => {
  const { activity } = session
  const totalSeconds = session.durationMinutes * 60
  const isPaused = session.pausedAt !== null
  const isFinished = session.finishedAt !== null

  // `now` ne sert qu'à provoquer un rendu : la vérité est l'horloge (startedAt/pausedTotalMs),
  // donc le temps reste juste même si l'onglet est gelé en arrière-plan.
  const [now, setNow] = useState(() => Date.now())
  const [confirm, setConfirm] = useState<'abandon' | 'finish' | null>(null)
  const [showSkipModal, setShowSkipModal] = useState(false)
  const [selectedMood, setSelectedMood] = useState<SessionMood>('good')
  const [skipReason, setSkipReason] = useState('')

  const sessionRef = useRef(session)
  useEffect(() => {
    sessionRef.current = session
  })

  const elapsedSeconds = Math.floor(elapsedMs(session, now) / 1000)
  const timeLeft = Math.ceil(remainingMs(session, now) / 1000)
  const progress = totalSeconds > 0 ? (elapsedSeconds / totalSeconds) * 100 : 0

  useWakeLock(!isPaused && !isFinished)

  // Tick d'affichage (250 ms => pas de seconde sautée) + resynchro immédiate au retour sur l'onglet
  useEffect(() => {
    if (isPaused || isFinished) return
    const tick = () => setNow(Date.now())
    const id = window.setInterval(tick, 250)
    document.addEventListener('visibilitychange', tick)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [isPaused, isFinished])

  const startSoundPlayed = useRef(false)
  useEffect(() => {
    // Pas de jingle de départ quand on reprend une session après un rechargement
    if (startSoundPlayed.current) return
    startSoundPlayed.current = true
    if (soundEnabled && Date.now() - session.startedAt < 3000) sounds.start()
  }, [soundEnabled, session.startedAt])

  const finish = useCallback(
    (natural: boolean) => {
      const current = sessionRef.current
      if (current.finishedAt) return
      const at = Date.now()
      onChange(finishSession(current, at, natural))
      if (natural) {
        if (soundEnabled) sounds.complete()
        if (vibrationEnabled) vibrate([200, 100, 200, 100, 400])
        if (notificationsEnabled && document.visibilityState === 'hidden') {
          void notifySessionComplete(current.activity.name, current.durationMinutes)
        }
      }
      import('canvas-confetti')
        .then(({ default: confetti }) => confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } }))
        .catch(() => {})
    },
    [onChange, soundEnabled, vibrationEnabled, notificationsEnabled],
  )

  // Fin naturelle : déclenchée une seule fois, y compris si on revient après la fin
  useEffect(() => {
    if (!isFinished && !isPaused && timeLeft <= 0) finish(true)
  }, [timeLeft, isFinished, isPaused, finish])

  // Titre de l'onglet = compte à rebours (utile sur desktop)
  useEffect(() => {
    const base = document.title
    document.title = isFinished ? `✓ ${activity.name} — FOCUSROLL` : `${formatTime(timeLeft)} · ${activity.name}`
    return () => {
      document.title = base
    }
  }, [timeLeft, isFinished, activity.name])

  const togglePause = () => onChange(isPaused ? resumeSession(session, Date.now()) : pauseSession(session, Date.now()))

  const canFinishEarly = elapsedSeconds >= MIN_EARLY_FINISH_SECONDS
  const accent = activity.accentColor || '#3b82f6'

  return (
    <div className="relative flex flex-col items-center justify-between min-h-dvh px-6 pt-[max(2.5rem,env(safe-area-inset-top))] pb-[max(2.5rem,env(safe-area-inset-bottom))] max-w-md mx-auto text-center bg-[#050608]">
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full blur-[120px] opacity-15 pointer-events-none"
        style={{ backgroundColor: accent }}
      />

      <div className="w-full flex items-center justify-between text-xs text-zinc-500 font-medium z-10">
        <span className="tracking-widest uppercase text-[10px] text-zinc-400">
          {isPaused ? 'EN PAUSE' : 'SESSION EN COURS'}
        </span>
        <button onClick={() => setShowSkipModal(true)} className="p-2 -m-2 hover:text-zinc-300 transition-colors cursor-pointer">
          Passer
        </button>
      </div>

      <div className="flex flex-col items-center justify-center my-auto z-10 w-full">
        <div className="relative w-64 h-64 flex items-center justify-center">
          <svg className="absolute w-full h-full -rotate-90 transform" viewBox="0 0 100 100" aria-hidden="true">
            <circle cx="50" cy="50" r="45" className="text-[#131622] stroke-current" strokeWidth="3.5" fill="transparent" />
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke={accent}
              strokeWidth="4"
              strokeDasharray={RING_LENGTH}
              strokeDashoffset={RING_LENGTH - (RING_LENGTH * Math.min(100, progress)) / 100}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-300 ease-linear"
            />
          </svg>

          <div className="flex flex-col items-center select-none" role="timer" aria-live="off">
            <span className="text-4xl mb-2 drop-shadow-sm">{activity.icon}</span>
            <span className={`font-mono text-4xl font-extrabold tracking-tight ${isPaused ? 'text-amber-300' : 'text-white'}`}>
              {formatTime(timeLeft)}
            </span>
            <p className="text-sm font-semibold text-zinc-300 mt-1 uppercase tracking-wider">{activity.name}</p>
            <p className="text-[11px] text-zinc-500 italic mt-0.5">{isPaused ? 'Le temps est suspendu.' : 'Reste concentré.'}</p>
          </div>
        </div>
      </div>

      <div className="w-full max-w-xs flex items-center justify-center gap-4 z-10 pb-4">
        <button
          onClick={() => setConfirm('abandon')}
          title="Abandonner"
          aria-label="Abandonner"
          className="p-3.5 rounded-full bg-[#12141f] text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 border border-[#1e2235] transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <button
          onClick={togglePause}
          className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold transition-all border cursor-pointer ${
            isPaused
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              : 'bg-white text-black border-transparent hover:bg-zinc-200'
          }`}
        >
          {isPaused ? <Play className="w-5 h-5 fill-current" /> : <Pause className="w-5 h-5" />}
          <span>{isPaused ? 'REPRENDRE' : 'PAUSE'}</span>
        </button>

        <button
          onClick={() => setConfirm('finish')}
          disabled={!canFinishEarly}
          title={canFinishEarly ? 'Terminer maintenant' : 'Disponible après 1 minute'}
          aria-label="Terminer maintenant"
          className="p-3.5 rounded-full bg-[#12141f] text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 border border-[#1e2235] transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-zinc-400 disabled:hover:bg-[#12141f]"
        >
          <CheckCircle className="w-5 h-5" />
        </button>
      </div>

      <ConfirmDialog
        open={confirm === 'abandon'}
        title="Abandonner la session ?"
        message={
          elapsedSeconds < MIN_ABANDON_RECORD_SECONDS
            ? "Tu viens de commencer : rien ne sera enregistré."
            : `Elle sera notée comme abandonnée (${Math.max(1, Math.round(elapsedSeconds / 60))} min effectuées).`
        }
        confirmLabel="Abandonner"
        cancelLabel="Continuer"
        danger
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          setConfirm(null)
          if (elapsedSeconds < MIN_ABANDON_RECORD_SECONDS) onDiscard()
          else onAbandon(elapsedSeconds)
        }}
      />
      <ConfirmDialog
        open={confirm === 'finish'}
        title="Terminer maintenant ?"
        message={`${Math.round(elapsedSeconds / 60)} min effectuées sur ${session.durationMinutes}. La session sera validée.`}
        confirmLabel="Terminer"
        cancelLabel="Continuer"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          setConfirm(null)
          finish(false)
        }}
      />

      <AnimatePresence>
        {showSkipModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-5" role="dialog" aria-modal="true">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0e1017] border border-[#202538] rounded-3xl p-6 w-full max-w-sm text-left shadow-2xl"
            >
              <h3 className="text-lg font-bold text-white mb-1">Passer cette activité ?</h3>
              <p className="text-xs text-zinc-400 mb-4">
                Une autre activité sera tirée. La raison est notée dans ton journal pour repérer tes blocages.
              </p>

              <div className="space-y-2 mb-5">
                {SKIP_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setSkipReason(opt)}
                    className={`w-full text-left px-3.5 py-3 rounded-xl text-sm font-medium border transition-all cursor-pointer ${
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
                  className="flex-1 py-3 text-sm font-semibold rounded-xl bg-zinc-800 text-zinc-300 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  onClick={() => onSkip(skipReason || 'Non spécifié')}
                  className="flex-1 py-3 text-sm font-semibold rounded-xl bg-rose-600 hover:bg-rose-500 text-white cursor-pointer"
                >
                  Passer & Relancer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isFinished && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-lg flex items-center justify-center p-5" role="dialog" aria-modal="true">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-[#0e1017] border border-[#202538] rounded-3xl p-6 w-full max-w-sm text-center shadow-2xl"
            >
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
                <Sparkles className="w-7 h-7" />
              </div>

              <h2 className="text-xl font-bold text-white">SESSION TERMINÉE ✓</h2>
              <p className="text-sm text-zinc-400 mt-1 mb-5">
                {activity.name} · {Math.max(1, Math.round(elapsedSeconds / 60))} min
              </p>

              <p className="text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-3">Comment c'était ?</p>

              <div className="grid grid-cols-4 gap-2 mb-6">
                {MOODS.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedMood(item.id)}
                    aria-pressed={selectedMood === item.id}
                    className={`flex flex-col items-center py-2.5 rounded-xl border transition-all cursor-pointer ${
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
                VALIDER
              </button>
              <button
                onClick={onDiscard}
                className="mt-3 text-xs text-zinc-500 hover:text-zinc-300 py-1 transition-colors cursor-pointer"
              >
                Je n'ai pas fait cette session
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
