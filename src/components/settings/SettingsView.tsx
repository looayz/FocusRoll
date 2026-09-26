import { useState, type FormEvent } from 'react'
import { Plus, Trash2, Edit2, Volume2, VolumeX, Sparkles, Sliders, Bell } from 'lucide-react'
import type { Activity, Category, RandomizerMode, UserSettings } from '../../types'
import { requestNotificationPermission } from '../../lib/notifications'

interface SettingsViewProps {
  activities: Activity[]
  categories: Category[]
  settings: UserSettings
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void
  onToggleActivity: (id: string, active: boolean) => void
  onDeleteActivity: (id: string) => void
  onSaveActivity: (activity: Activity) => void
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  activities,
  categories,
  settings,
  onUpdateSettings,
  onToggleActivity,
  onDeleteActivity,
  onSaveActivity,
}) => {
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleOpenCreate = () => {
    setEditingActivity({
      id: `act-${Date.now()}`,
      name: '',
      icon: '⚡',
      categoryId: categories[0]?.id || 'work',
      durationMode: 'fixed',
      defaultDurationMinutes: 30,
      weight: 3,
      accentColor: '#3b82f6',
      active: true,
      createdAt: Date.now(),
    })
    setIsModalOpen(true)
  }

  const handleOpenEdit = (act: Activity) => {
    setEditingActivity({ ...act })
    setIsModalOpen(true)
  }

  const handleSaveModal = (e: FormEvent) => {
    e.preventDefault()
    if (!editingActivity || !editingActivity.name.trim()) return
    onSaveActivity(editingActivity)
    setIsModalOpen(false)
    setEditingActivity(null)
  }


  const handleToggleNotifications = async () => {
    if (!settings.notificationsEnabled) {
      const granted = await requestNotificationPermission()
      onUpdateSettings({ notificationsEnabled: granted })
    } else {
      onUpdateSettings({ notificationsEnabled: false })
    }
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-80px)] px-5 py-6 max-w-md mx-auto w-full pb-24">
      {/* Title */}
      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tight text-white">RÉGLAGES</h1>
        <p className="text-xs text-zinc-500">Moteur de sélection et activités</p>
      </div>

      {/* Randomizer Mode Section */}
      <div className="mb-6 bg-[#0f1118] border border-[#1b1e2c] p-4 rounded-3xl">
        <div className="flex items-center gap-2 mb-3 text-xs uppercase tracking-wider font-bold text-zinc-400">
          <Sliders className="w-4 h-4 text-blue-400" />
          <span>Algorithme de Tirage</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {(
            [
              { id: 'smart', label: 'Smart', desc: 'Pondéré & anti-répétition' },
              { id: 'balanced', label: 'Balanced', desc: 'Équilibre catégories' },
              { id: 'pure', label: 'Aléatoire', desc: 'Pure chance 100%' },
            ] as const
          ).map((mode) => (
            <button
              key={mode.id}
              onClick={() => onUpdateSettings({ randomizerMode: mode.id as RandomizerMode })}
              className={`p-2.5 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                settings.randomizerMode === mode.id
                  ? 'bg-blue-600/20 border-blue-500 text-white'
                  : 'bg-[#151722] border-[#1d2030] text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <span className="text-xs font-bold text-zinc-200">{mode.label}</span>
              <span className="text-[10px] text-zinc-500 mt-1 leading-tight">{mode.desc}</span>
            </button>
          ))}
        </div>

        {/* No choice toggle */}
        <div className="mt-4 pt-3 border-t border-[#1d2030] flex items-center justify-between">
          <div className="text-left pr-4">
            <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Mode "No Choice"
            </span>
            <p className="text-[11px] text-zinc-500 leading-tight">
              Supprime toute hésitation : 1 clic = action directe sans deuxième choix.
            </p>
          </div>
          <button
            onClick={() => onUpdateSettings({ noChoiceMode: !settings.noChoiceMode })}
            className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-1 ${
              settings.noChoiceMode ? 'bg-blue-600' : 'bg-zinc-800'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform ${
                settings.noChoiceMode ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Sound toggle */}
        <div className="mt-3 pt-3 border-t border-[#1d2030] flex items-center justify-between">
          <div className="text-left">
            <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
              {settings.soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-zinc-500" />}
              Sons & Cloche Zen
            </span>
            <p className="text-[11px] text-zinc-500">Audio subtil généré par Web Audio</p>
          </div>
          <button
            onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
            className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-1 ${
              settings.soundEnabled ? 'bg-emerald-600' : 'bg-zinc-800'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform ${
                settings.soundEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Notifications toggle */}
        <div className="mt-3 pt-3 border-t border-[#1d2030] flex items-center justify-between">
          <div className="text-left">
            <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-blue-400" /> Notifications de fin
            </span>
            <p className="text-[11px] text-zinc-500">Avertissement quand le timer se termine</p>
          </div>
          <button
            onClick={handleToggleNotifications}
            className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-1 ${
              settings.notificationsEnabled ? 'bg-blue-600' : 'bg-zinc-800'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform ${
                settings.notificationsEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Activities list header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
          Vos Activités ({activities.length})
        </h2>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white text-black text-xs font-bold hover:bg-zinc-200 transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> Ajouter
        </button>
      </div>

      {/* Activities List */}
      <div className="space-y-2">
        {activities.map((act) => (
          <div
            key={act.id}
            className={`flex items-center justify-between p-3.5 rounded-2xl bg-[#0f1118] border transition-all ${
              act.active ? 'border-[#1b1e2c]' : 'border-zinc-800/40 opacity-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{act.icon}</span>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">{act.name}</span>
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: act.accentColor || '#3b82f6' }}
                  />
                </div>
                <p className="text-[11px] text-zinc-500">
                  {act.durationMode === 'range'
                    ? `${act.rangeMinMinutes}-${act.rangeMaxMinutes} min`
                    : `${act.defaultDurationMinutes} min`}{' '}
                  · Poids: {act.weight || 3}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onToggleActivity(act.id, !act.active)}
                className={`text-[10px] font-bold px-2 py-1 rounded-lg transition-all ${
                  act.active
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-zinc-800 text-zinc-500'
                }`}
              >
                {act.active ? 'ACTIF' : 'INACTIF'}
              </button>

              <button
                onClick={() => handleOpenEdit(act)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => onDeleteActivity(act.id)}
                className="p-1.5 text-zinc-500 hover:text-rose-400 rounded-lg hover:bg-rose-500/10"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit / Create Modal */}
      {isModalOpen && editingActivity && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveModal}
            className="bg-[#0e1017] border border-[#202538] rounded-3xl p-5 w-full max-w-sm text-left shadow-2xl space-y-4"
          >
            <h3 className="text-base font-bold text-white">
              {editingActivity.name ? "Modifier l'activité" : 'Nouvelle activité'}
            </h3>

            {/* Name & Icon */}
            <div className="flex gap-2">
              <div className="w-14">
                <label className="text-[10px] text-zinc-500 font-semibold block mb-1">Icône</label>
                <input
                  type="text"
                  value={editingActivity.icon}
                  onChange={(e) => setEditingActivity({ ...editingActivity, icon: e.target.value })}
                  className="w-full text-center text-xl bg-[#141724] border border-[#21263c] rounded-xl py-2 text-white"
                  required
                />
              </div>
              <div className="flex-1">
                <label className="text-[10px] text-zinc-500 font-semibold block mb-1">Nom</label>
                <input
                  type="text"
                  value={editingActivity.name}
                  onChange={(e) => setEditingActivity({ ...editingActivity, name: e.target.value })}
                  placeholder="Ex: Coder, Lire..."
                  className="w-full bg-[#141724] border border-[#21263c] rounded-xl px-3 py-2 text-sm text-white"
                  required
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="text-[10px] text-zinc-500 font-semibold block mb-1">Catégorie</label>
              <select
                value={editingActivity.categoryId}
                onChange={(e) => setEditingActivity({ ...editingActivity, categoryId: e.target.value })}
                className="w-full bg-[#141724] border border-[#21263c] rounded-xl px-3 py-2 text-xs text-white"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Duration Mode & Values */}
            <div>
              <label className="text-[10px] text-zinc-500 font-semibold block mb-1">Mode de durée</label>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setEditingActivity({ ...editingActivity, durationMode: 'fixed' })}
                  className={`py-1.5 text-xs font-semibold rounded-lg border ${
                    editingActivity.durationMode === 'fixed'
                      ? 'bg-blue-600/20 border-blue-500 text-white'
                      : 'bg-[#141724] border-[#21263c] text-zinc-400'
                  }`}
                >
                  Fixe
                </button>
                <button
                  type="button"
                  onClick={() => setEditingActivity({ ...editingActivity, durationMode: 'range' })}
                  className={`py-1.5 text-xs font-semibold rounded-lg border ${
                    editingActivity.durationMode === 'range'
                      ? 'bg-blue-600/20 border-blue-500 text-white'
                      : 'bg-[#141724] border-[#21263c] text-zinc-400'
                  }`}
                >
                  Plage (Min - Max)
                </button>
              </div>

              {editingActivity.durationMode === 'fixed' ? (
                <div>
                  <label className="text-[10px] text-zinc-500 font-semibold block mb-1">Minutes (ex: 30)</label>
                  <input
                    type="number"
                    min="5"
                    max="180"
                    value={editingActivity.defaultDurationMinutes}
                    onChange={(e) =>
                      setEditingActivity({
                        ...editingActivity,
                        defaultDurationMinutes: parseInt(e.target.value) || 25,
                      })
                    }
                    className="w-full bg-[#141724] border border-[#21263c] rounded-xl px-3 py-2 text-sm text-white"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-zinc-500 font-semibold block mb-1">Min (minutes)</label>
                    <input
                      type="number"
                      min="5"
                      max="180"
                      value={editingActivity.rangeMinMinutes || 20}
                      onChange={(e) =>
                        setEditingActivity({
                          ...editingActivity,
                          rangeMinMinutes: parseInt(e.target.value) || 15,
                        })
                      }
                      className="w-full bg-[#141724] border border-[#21263c] rounded-xl px-3 py-2 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-500 font-semibold block mb-1">Max (minutes)</label>
                    <input
                      type="number"
                      min="5"
                      max="180"
                      value={editingActivity.rangeMaxMinutes || 45}
                      onChange={(e) =>
                        setEditingActivity({
                          ...editingActivity,
                          rangeMaxMinutes: parseInt(e.target.value) || 45,
                        })
                      }
                      className="w-full bg-[#141724] border border-[#21263c] rounded-xl px-3 py-2 text-sm text-white"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Accent Color & Weight */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-zinc-500 font-semibold block mb-1">Couleur</label>
                <input
                  type="color"
                  value={editingActivity.accentColor}
                  onChange={(e) => setEditingActivity({ ...editingActivity, accentColor: e.target.value })}
                  className="w-full h-9 bg-transparent border-0 cursor-pointer rounded-lg"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-500 font-semibold block mb-1">Poids (1-5)</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={editingActivity.weight}
                  onChange={(e) =>
                    setEditingActivity({ ...editingActivity, weight: parseInt(e.target.value) || 3 })
                  }
                  className="w-full bg-[#141724] border border-[#21263c] rounded-xl px-3 py-1.5 text-sm text-white"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-2 text-xs font-semibold rounded-xl bg-zinc-800 text-zinc-400"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="flex-1 py-2 text-xs font-semibold rounded-xl bg-white text-black font-bold"
              >
                Sauvegarder
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
