import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import type { Activity } from '../../types'
import { sounds } from '../../lib/sound'

interface RouletteProps {
  /** Activités actives uniquement : ce sont les seules qui peuvent sortir. */
  activities: Activity[]
  targetActivity: Activity
  onComplete: () => void
  soundEnabled: boolean
}

const MIN_STEPS = 18
const FIRST_DELAY_MS = 45
const LAST_EXTRA_DELAY_MS = 260

export const Roulette: React.FC<RouletteProps> = ({ activities, targetActivity, onComplete, soundEnabled }) => {
  const [currentIndex, setCurrentIndex] = useState(0)

  // Les callbacks changent à chaque rendu du parent : on les lit via une ref pour ne pas relancer l'animation.
  const onCompleteRef = useRef(onComplete)
  const soundRef = useRef(soundEnabled)
  useEffect(() => {
    onCompleteRef.current = onComplete
    soundRef.current = soundEnabled
  })

  useEffect(() => {
    const n = activities.length
    const targetIdx = Math.max(0, activities.findIndex((a) => a.id === targetActivity.id))
    const timers: number[] = []

    if (n <= 1) {
      // Rien à faire défiler : on "verrouille" tout de suite
      if (soundRef.current) sounds.lock()
      timers.push(window.setTimeout(() => onCompleteRef.current(), 400))
      return () => timers.forEach(window.clearTimeout)
    }

    // Nombre de pas choisi pour que la dernière case soit exactement la cible : pas de saut final.
    const startIdx = 0
    const steps = MIN_STEPS + ((targetIdx - startIdx - MIN_STEPS) % n + n) % n
    let step = 0

    const spin = () => {
      step++
      setCurrentIndex((startIdx + step) % n)
      if (soundRef.current) sounds.tick()

      if (step < steps) {
        // Décélération cubique : de plus en plus lent vers la fin
        const delay = FIRST_DELAY_MS + LAST_EXTRA_DELAY_MS * (step / steps) ** 3
        timers.push(window.setTimeout(spin, delay))
      } else {
        if (soundRef.current) sounds.lock()
        timers.push(window.setTimeout(() => onCompleteRef.current(), 500))
      }
    }
    timers.push(window.setTimeout(spin, FIRST_DELAY_MS))
    return () => timers.forEach(window.clearTimeout)
  }, [activities, targetActivity])

  const currentDisplay = activities[currentIndex] || targetActivity

  return (
    <div className="relative w-full max-w-xs h-56 flex flex-col items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-b from-[#11131c] to-[#0a0b10] border border-[#1e2235] shadow-2xl p-6">
      <div
        className="absolute inset-0 opacity-20 blur-3xl transition-colors duration-500 pointer-events-none"
        style={{ backgroundColor: currentDisplay.accentColor || '#3b82f6' }}
      />

      <motion.div
        key={currentDisplay.id}
        initial={{ y: 30, opacity: 0.3, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
        className="flex flex-col items-center justify-center text-center z-10"
        aria-live="off"
      >
        <span className="text-6xl mb-3 drop-shadow-md select-none">{currentDisplay.icon}</span>
        <h2 className="text-2xl font-bold tracking-tight text-white line-clamp-1">{currentDisplay.name}</h2>
        <div className="mt-2 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: currentDisplay.accentColor || '#3b82f6' }} />
          <span className="text-xs uppercase tracking-widest text-zinc-400 font-medium">
            {currentDisplay.durationMode === 'range' && currentDisplay.rangeMinMinutes && currentDisplay.rangeMaxMinutes
              ? `${currentDisplay.rangeMinMinutes}-${currentDisplay.rangeMaxMinutes} min`
              : `${currentDisplay.defaultDurationMinutes} min`}
          </span>
        </div>
      </motion.div>

      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-zinc-700/60 rounded-full" />
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-zinc-700/60 rounded-full" />
    </div>
  )
}
