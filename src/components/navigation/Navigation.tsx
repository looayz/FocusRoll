import { Compass, Flame, History as HistoryIcon, Settings as SettingsIcon } from 'lucide-react'

export type NavTab = 'home' | 'history' | 'settings'

interface NavigationProps {
  currentTab: NavTab
  onSelectTab: (tab: NavTab) => void
  currentStreak: number
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onSelectTab,
  currentStreak,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#07080c]/90 backdrop-blur-xl border-t border-[#1a1d2c] max-w-md mx-auto">
      <div className="flex items-center justify-around py-3 px-4">
        <button
          onClick={() => onSelectTab('home')}
          className={`flex flex-col items-center gap-1 transition-all ${
            currentTab === 'home'
              ? 'text-white scale-105'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Compass className="w-5 h-5" />
          <span className="text-[11px] font-medium tracking-wide">Roll</span>
        </button>

        <button
          onClick={() => onSelectTab('history')}
          className={`flex flex-col items-center gap-1 transition-all ${
            currentTab === 'history'
              ? 'text-white scale-105'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <HistoryIcon className="w-5 h-5" />
          <span className="text-[11px] font-medium tracking-wide">Journal</span>
        </button>

        <button
          onClick={() => onSelectTab('settings')}
          className={`flex flex-col items-center gap-1 transition-all relative ${
            currentTab === 'settings'
              ? 'text-white scale-105'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <SettingsIcon className="w-5 h-5" />
          <span className="text-[11px] font-medium tracking-wide">Réglages</span>
        </button>

        {currentStreak > 0 && (
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
            <Flame className="w-3.5 h-3.5 fill-amber-400" />
            <span>{currentStreak}j</span>
          </div>
        )}
      </div>
    </nav>
  )
}
