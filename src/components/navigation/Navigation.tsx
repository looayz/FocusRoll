import { Compass, Flame, History as HistoryIcon, Settings as SettingsIcon } from 'lucide-react'

export type NavTab = 'home' | 'history' | 'settings'

interface NavigationProps {
  currentTab: NavTab
  onSelectTab: (tab: NavTab) => void
  currentStreak: number
}

const TABS = [
  { id: 'home', label: 'Roll', Icon: Compass },
  { id: 'history', label: 'Journal', Icon: HistoryIcon },
  { id: 'settings', label: 'Réglages', Icon: SettingsIcon },
] as const

export const Navigation: React.FC<NavigationProps> = ({ currentTab, onSelectTab, currentStreak }) => {
  return (
    <nav
      aria-label="Navigation principale"
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#07080c]/90 backdrop-blur-xl border-t border-[#1a1d2c] max-w-md mx-auto pb-[env(safe-area-inset-bottom)]"
    >
      <div className="flex items-center justify-around py-2 px-4">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => onSelectTab(id)}
            aria-current={currentTab === id ? 'page' : undefined}
            className={`flex flex-col items-center gap-1 px-4 py-1.5 transition-all cursor-pointer ${
              currentTab === id ? 'text-white scale-105' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[11px] font-medium tracking-wide">{label}</span>
          </button>
        ))}

        {currentStreak > 0 && (
          <div
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold"
            title={`Série de ${currentStreak} jour${currentStreak > 1 ? 's' : ''}`}
          >
            <Flame className="w-3.5 h-3.5 fill-amber-400" />
            <span>{currentStreak}j</span>
          </div>
        )}
      </div>
    </nav>
  )
}
