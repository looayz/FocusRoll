import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import type { Activity } from '../../types'
import { sounds } from '../../lib/sound'

interface RouletteProps {
  activities: Activity[]
  targetActivity: Activity
  isSpinning: boolean
  onComplete: () => void
  soundEnabled: boolean
}

export const Roulette: React.FC<RouletteProps> = ({
  activities,
  targetActivity,
  isSpinning,
  onComplete,
  soundEnabled,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (!isSpinning) return

    let current = 0
    let delay = 50 // ms
    const maxSteps = 28 // nombre de sauts
    let step = 0
    let timeoutId: number


    const spin = () => {
      step++
      current = (current + 1) % activities.length
      setCurrentIndex(current)

      if (soundEnabled) {
        sounds.tick()
      }

      if (step < maxSteps) {
        // Courbe de décélération exponentielle
        if (step > maxSteps - 10) {
          delay += 35
        } else if (step > maxSteps - 5) {
          delay += 70
        } else {
          delay += 5
        }
        timeoutId = window.setTimeout(spin, delay)
      } else {
        // Fin de course : atterrir sur targetActivity
        const finalIdx = activities.findIndex((a) => a.id === targetActivity.id)
        setCurrentIndex(finalIdx !== -1 ? finalIdx : 0)
        if (soundEnabled) {
          sounds.lock()
        }
        window.setTimeout(() => {
          onComplete()
        }, 500)
      }
    }

    timeoutId = window.setTimeout(spin, delay)
    return () => window.clearTimeout(timeoutId)
  }, [isSpinning, activities, targetActivity, onComplete, soundEnabled])


  const currentDisplay = activities[currentIndex] || targetActivity

  return (
    <div className="relative w-full max-w-xs h-56 flex flex-col items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-b from-[#11131c] to-[#0a0b10] border border-[#1e2235] shadow-2xl p-6">
      {/* Glow subtle background */}
      <div
        className="absolute inset-0 opacity-20 blur-3xl transition-colors duration-500 pointer-events-none"
        style={{ backgroundColor: currentDisplay.accentColor || '#3b82f6' }}
      />

      {/* Roulette items motion */}
      <motion.div
        key={currentDisplay.id}
        initial={{ y: isSpinning ? 30 : 0, opacity: isSpinning ? 0.3 : 1, scale: isSpinning ? 0.9 : 1 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: -30, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
        className="flex flex-col items-center justify-center text-center z-10"
      >
        <span className="text-6xl mb-3 drop-shadow-md select-none">{currentDisplay.icon}</span>
        <h2 className="text-2xl font-bold tracking-tight text-white line-clamp-1">
          {currentDisplay.name}
        </h2>
        <div className="mt-2 flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: currentDisplay.accentColor || '#3b82f6' }}
          />
          <span className="text-xs uppercase tracking-widest text-zinc-400 font-medium">
            {currentDisplay.durationMode === 'range'
              ? `${currentDisplay.rangeMinMinutes}-${currentDisplay.rangeMaxMinutes} min`
              : `${currentDisplay.defaultDurationMinutes} min`}
          </span>
        </div>
      </motion.div>

      {/* Frame accents */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-zinc-700/60 rounded-full" />
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-zinc-700/60 rounded-full" />
    </div>
  )
}
