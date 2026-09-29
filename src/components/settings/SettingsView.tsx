import { useRef, useState, type FormEvent } from 'react'
import { Plus, Trash2, Edit2, Volume2, VolumeX, Sparkles, Sliders, Bell, Target, Vibrate, Download, Upload } from 'lucide-react'
import type { Activity, Category, RandomizerMode, UserSettings } from '../../types'
import { requestNotificationPermission } from '../../lib/notifications'
import { buildBackup, downloadBackup, parseBackup, restoreBackup } from '../../lib/storage/backup'
import { InstallPromptModal } from '../ui/InstallPromptModal'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { NumberInput } from '../ui/NumberInput'

interface SettingsViewProps {
  activities: Activity[]
  categories: Category[]
  settings: UserSettings
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void
  onToggleActivity: (id: string, active: boolean) => void
  onDeleteActivity: (id: string) => void
  onSaveActivity: (activity: Activity) => void
  onDataRestored: () => void
}

const GOAL_PRESETS = [0, 30, 60, 90, 120]
const FIELD = 'w-full bg-[#141724] border border-[#21263c] rounded-xl px-3 py-2.5 text-sm text-white'

const Toggle: React.FC<{ checked: boolean; onChange: () => void; color?: string; label: string }> = ({
  checked,
  onChange,
  color = 'bg-blue-600',
  label,
}) => (
  <button
    role="switch"
    aria-checked={checked}
    aria-label={label}
    onClick={onChange}
    className={`w-11 h-6 shrink-0 rounded-full transition-colors relative flex items-center px-1 cursor-pointer ${checked ? color : 'bg-zinc-800'}`}
  >
    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
  </button>
)

export const SettingsView: React.FC<SettingsViewProps> = ({
  activities,
  categories,
  settings,
  onUpdateSettings,
  onToggleActivity,
  onDeleteActivity,
  onSaveActivity,
  onDataRestored,
}) => {
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<Activity | null>(null)
  const [dataMessage, setDataMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const [notifDenied, setNotifDenied] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleOpenCreate = () => {
    setEditingActivity({
      id: crypto.randomUUID(),
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
    setIsNew(true)
  }

  const handleOpenEdit = (act: Activity) => {
    setEditingActivity({ ...act })
    setIsNew(false)
  }

  const setDurationMode = (mode: 'fixed' | 'range') => {
    if (!editingActivity) return
    const base = editingActivity.defaultDurationMinutes
    // On initialise réellement la plage (avant, elle n'était qu'affichée => "undefined-undefined min")
    setEditingActivity({
      ...editingActivity,
      durationMode: mode,
      rangeMinMinutes: editingActivity.rangeMinMinutes ?? Math.max(5, base - 10),
      rangeMaxMinutes: editingActivity.rangeMaxMinutes ?? base + 10,
    })
  }

  const handleSaveModal = (e: FormEvent) => {
    e.preventDefault()
    if (!editingActivity || !editingActivity.name.trim()) return
    const a = { ...editingActivity, name: editingActivity.name.trim(), icon: editingActivity.icon.trim() || '⚡' }
    if (a.durationMode === 'range') {
      const lo = Math.min(a.rangeMinMinutes ?? 20, a.rangeMaxMinutes ?? 45)
      const hi = Math.max(a.rangeMinMinutes ?? 20, a.rangeMaxMinutes ?? 45)
      a.rangeMinMinutes = lo
      a.rangeMaxMinutes = hi
      a.defaultDurationMinutes = Math.round((lo + hi) / 2)
    }
    onSaveActivity(a)
    setEditingActivity(null)
  }

  const handleToggleNotifications = async () => {
    if (settings.notificationsEnabled) {
      onUpdateSettings({ notificationsEnabled: false })
      return
    }
    const granted = await requestNotificationPermission()
    setNotifDenied(!granted)
    onUpdateSettings({ notificationsEnabled: granted })
  }

  const handleExport = async () => {
    downloadBackup(await buildBackup())
    setDataMessage({ ok: true, text: 'Sauvegarde téléchargée.' })
  }

  const handleImport = async (file: File | undefined) => {
    if (!file) return
    try {
      const result = await restoreBackup(parseBackup(await file.text()))
      onDataRestored()
      setDataMessage({ ok: true, text: `Restauré : ${result.sessions} sessions, ${result.activities} activités.` })
    } catch (err) {
      setDataMessage({ ok: false, text: err instanceof Error ? err.message : "Échec de l'import." })
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const rangeDesc = (a: Activity) =>
    a.durationMode === 'range' && a.rangeMinMinutes && a.rangeMaxMinutes
      ? `${a.rangeMinMinutes}-${a.rangeMaxMinutes} min`
      : `${a.defaultDurationMinutes} min`

  return (
    <div className="flex flex-col min-h-[calc(100dvh-5rem)] px-5 pt-[max(1.5rem,env(safe-area-inset-top))] max-w-md mx-auto w-full pb-28">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">RÉGLAGES</h1>
          <p className="text-xs text-zinc-500">Moteur de sélection et activités</p>
        </div>
        <InstallPromptModal />
      </div>

      {/* Algorithme */}
      <div className="mb-4 bg-[#0f1118] border border-[#1b1e2c] p-4 rounded-3xl">
        <div className="flex items-center gap-2 mb-3 text-xs uppercase tracking-wider font-bold text-zinc-400">
          <Sliders className="w-4 h-4 text-blue-400" />
          <span>Algorithme de tirage</span>
        </div>

        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Algorithme de tirage">
          {(
            [
              { id: 'smart', label: 'Smart', desc: 'Pondéré & anti-répétition' },
              { id: 'balanced', label: 'Balanced', desc: 'Équilibre les catégories' },
              { id: 'pure', label: 'Aléatoire', desc: 'Pure chance 100%' },
            ] as const
          ).map((mode) => (
            <button
              key={mode.id}
              role="radio"
              aria-checked={settings.randomizerMode === mode.id}
              onClick={() => onUpdateSettings({ randomizerMode: mode.id as RandomizerMode })}
              className={`p-2.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
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

        <div className="mt-4 pt-3 border-t border-[#1d2030] flex items-center justify-between gap-4">
          <div className="text-left">
            <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Mode "No Choice"
            </span>
            <p className="text-[11px] text-zinc-500 leading-tight">Supprime toute hésitation : le tirage lance directement le focus.</p>
          </div>
          <Toggle label='Mode "No Choice"' checked={settings.noChoiceMode} onChange={() => onUpdateSettings({ noChoiceMode: !settings.noChoiceMode })} />
        </div>
      </div>

      {/* Objectif */}
      <div className="mb-4 bg-[#0f1118] border border-[#1b1e2c] p-4 rounded-3xl">
        <div className="flex items-center gap-2 mb-1 text-xs uppercase tracking-wider font-bold text-zinc-400">
          <Target className="w-4 h-4 text-emerald-400" />
          <span>Objectif quotidien</span>
        </div>
        <p className="text-[11px] text-zinc-500 mb-3">Minutes de focus visées chaque jour. Suivi sur l'accueil et le journal.</p>
        <div className="flex gap-1.5 mb-2.5">
          {GOAL_PRESETS.map((g) => (
            <button
              key={g}
              onClick={() => onUpdateSettings({ dailyGoalMinutes: g })}
              aria-pressed={settings.dailyGoalMinutes === g}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                settings.dailyGoalMinutes === g ? 'bg-white text-black font-bold' : 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {g === 0 ? 'Aucun' : `${g}m`}
            </button>
          ))}
        </div>
        {!GOAL_PRESETS.includes(settings.dailyGoalMinutes) && (
          <p className="text-[11px] text-zinc-500">Objectif actuel : {settings.dailyGoalMinutes} min</p>
        )}
      </div>

      {/* Sons & alertes */}
      <div className="mb-6 bg-[#0f1118] border border-[#1b1e2c] p-4 rounded-3xl space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div className="text-left">
            <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
              {settings.soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-zinc-500" />}
              Sons & cloche zen
            </span>
            <p className="text-[11px] text-zinc-500">Audio subtil généré par Web Audio</p>
          </div>
          <Toggle label="Sons" color="bg-emerald-600" checked={settings.soundEnabled} onChange={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })} />
        </div>

        <div className="pt-3 border-t border-[#1d2030] flex items-center justify-between gap-4">
          <div className="text-left">
            <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
              <Vibrate className="w-3.5 h-3.5 text-violet-400" /> Vibration
            </span>
            <p className="text-[11px] text-zinc-500">À la fin d'une session (Android)</p>
          </div>
          <Toggle label="Vibration" checked={settings.vibrationEnabled} onChange={() => onUpdateSettings({ vibrationEnabled: !settings.vibrationEnabled })} />
        </div>

        <div className="pt-3 border-t border-[#1d2030] flex items-center justify-between gap-4">
          <div className="text-left">
            <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-blue-400" /> Notification de fin
            </span>
            <p className="text-[11px] text-zinc-500">
              {notifDenied ? 'Permission refusée : autorise-la dans les réglages du navigateur.' : "Si l'app est en arrière-plan quand le minuteur se termine"}
            </p>
          </div>
          <Toggle label="Notification de fin" checked={settings.notificationsEnabled} onChange={handleToggleNotifications} />
        </div>
      </div>

      {/* Activités */}
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Tes activités ({activities.length})</h2>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1 px-3 py-2 rounded-xl bg-white text-black text-xs font-bold hover:bg-zinc-200 transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> Ajouter
        </button>
      </div>

      <div className="space-y-2">
        {activities.map((act) => (
          <div
            key={act.id}
            className={`flex items-center justify-between p-3.5 rounded-2xl bg-[#0f1118] border transition-all ${
              act.active ? 'border-[#1b1e2c]' : 'border-zinc-800/40 opacity-50'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-2xl">{act.icon}</span>
              <div className="text-left min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white truncate">{act.name}</span>
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: act.accentColor || '#3b82f6' }} />
                </div>
                <p className="text-[11px] text-zinc-500">
                  {rangeDesc(act)} · Poids : {act.weight || 3}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => onToggleActivity(act.id, !act.active)}
                aria-pressed={act.active}
                className={`text-[10px] font-bold px-2 py-1.5 rounded-lg transition-all cursor-pointer ${
                  act.active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-zinc-800 text-zinc-500'
                }`}
              >
                {act.active ? 'ACTIF' : 'INACTIF'}
              </button>
              <button onClick={() => handleOpenEdit(act)} aria-label={`Modifier ${act.name}`} className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 cursor-pointer">
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setPendingDelete(act)} aria-label={`Supprimer ${act.name}`} className="p-2 text-zinc-500 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 cursor-pointer">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Données */}
      <div className="mt-8 bg-[#0f1118] border border-[#1b1e2c] p-4 rounded-3xl">
        <div className="text-xs uppercase tracking-wider font-bold text-zinc-400 mb-1">Tes données</div>
        <p className="text-[11px] text-zinc-500 mb-3">
          Tout reste sur cet appareil. Exporte une sauvegarde pour ne rien perdre si tu changes de téléphone ou vides le navigateur.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={handleExport} className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-zinc-800 text-zinc-200 text-xs font-semibold hover:bg-zinc-700 cursor-pointer">
            <Download className="w-3.5 h-3.5" /> Exporter
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-zinc-800 text-zinc-200 text-xs font-semibold hover:bg-zinc-700 cursor-pointer">
            <Upload className="w-3.5 h-3.5" /> Importer
          </button>
        </div>
        <input ref={fileInputRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => handleImport(e.target.files?.[0])} />
        {dataMessage && (
          <p className={`text-[11px] mt-2.5 ${dataMessage.ok ? 'text-emerald-400' : 'text-rose-400'}`} role="status">
            {dataMessage.text}
          </p>
        )}
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Supprimer cette activité ?"
        message={pendingDelete ? `« ${pendingDelete.name} » disparaîtra de la roulette. Ton historique est conservé.` : undefined}
        confirmLabel="Supprimer"
        danger
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) onDeleteActivity(pendingDelete.id)
          setPendingDelete(null)
        }}
      />

      {editingActivity && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto" role="dialog" aria-modal="true">
          <form onSubmit={handleSaveModal} className="bg-[#0e1017] border border-[#202538] rounded-3xl p-5 w-full max-w-sm text-left shadow-2xl space-y-4 my-auto">
            <h3 className="text-base font-bold text-white">{isNew ? 'Nouvelle activité' : "Modifier l'activité"}</h3>

            <div className="flex gap-2">
              <div className="w-16">
                <label htmlFor="act-icon" className="text-[10px] text-zinc-500 font-semibold block mb-1">Icône</label>
                <input
                  id="act-icon"
                  type="text"
                  value={editingActivity.icon}
                  onChange={(e) => setEditingActivity({ ...editingActivity, icon: e.target.value })}
                  className="w-full text-center text-xl bg-[#141724] border border-[#21263c] rounded-xl py-2 text-white"
                  required
                />
              </div>
              <div className="flex-1">
                <label htmlFor="act-name" className="text-[10px] text-zinc-500 font-semibold block mb-1">Nom</label>
                <input
                  id="act-name"
                  type="text"
                  value={editingActivity.name}
                  onChange={(e) => setEditingActivity({ ...editingActivity, name: e.target.value })}
                  placeholder="Ex : Coder, Lire..."
                  maxLength={40}
                  className={FIELD}
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="act-cat" className="text-[10px] text-zinc-500 font-semibold block mb-1">Catégorie</label>
              <select
                id="act-cat"
                value={editingActivity.categoryId}
                onChange={(e) => setEditingActivity({ ...editingActivity, categoryId: e.target.value })}
                className={FIELD}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="text-[10px] text-zinc-500 font-semibold block mb-1">Mode de durée</span>
              <div className="grid grid-cols-2 gap-2 mb-2">
                {(
                  [
                    ['fixed', 'Fixe'],
                    ['range', 'Plage (min - max)'],
                  ] as const
                ).map(([mode, label]) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setDurationMode(mode)}
                    aria-pressed={editingActivity.durationMode === mode}
                    className={`py-2 text-xs font-semibold rounded-lg border cursor-pointer ${
                      editingActivity.durationMode === mode ? 'bg-blue-600/20 border-blue-500 text-white' : 'bg-[#141724] border-[#21263c] text-zinc-400'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {editingActivity.durationMode === 'range' ? (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-zinc-500 font-semibold block mb-1">Min (minutes)</label>
                    <NumberInput aria-label="Durée minimale" min={5} max={180} value={editingActivity.rangeMinMinutes ?? 20} onChange={(v) => setEditingActivity({ ...editingActivity, rangeMinMinutes: v })} className={FIELD} />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-500 font-semibold block mb-1">Max (minutes)</label>
                    <NumberInput aria-label="Durée maximale" min={5} max={180} value={editingActivity.rangeMaxMinutes ?? 45} onChange={(v) => setEditingActivity({ ...editingActivity, rangeMaxMinutes: v })} className={FIELD} />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-[10px] text-zinc-500 font-semibold block mb-1">Minutes (5 à 180)</label>
                  <NumberInput aria-label="Durée en minutes" min={5} max={180} value={editingActivity.defaultDurationMinutes} onChange={(v) => setEditingActivity({ ...editingActivity, defaultDurationMinutes: v })} className={FIELD} />
                </div>
              )}
            </div>

            <div className="grid grid-cols-[auto_1fr] gap-4 items-end">
              <div>
                <label htmlFor="act-color" className="text-[10px] text-zinc-500 font-semibold block mb-1">Couleur</label>
                <input
                  id="act-color"
                  type="color"
                  value={editingActivity.accentColor}
                  onChange={(e) => setEditingActivity({ ...editingActivity, accentColor: e.target.value })}
                  className="w-14 h-10 bg-transparent border-0 cursor-pointer rounded-lg"
                />
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 font-semibold block mb-1">Fréquence (poids 1-5)</span>
                <div className="grid grid-cols-5 gap-1" role="radiogroup" aria-label="Poids">
                  {[1, 2, 3, 4, 5].map((w) => (
                    <button
                      key={w}
                      type="button"
                      role="radio"
                      aria-checked={editingActivity.weight === w}
                      onClick={() => setEditingActivity({ ...editingActivity, weight: w })}
                      className={`py-2 text-xs font-bold rounded-lg border cursor-pointer ${
                        editingActivity.weight === w ? 'bg-blue-600/20 border-blue-500 text-white' : 'bg-[#141724] border-[#21263c] text-zinc-500'
                      }`}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setEditingActivity(null)} className="flex-1 py-3 text-sm font-semibold rounded-xl bg-zinc-800 text-zinc-400 cursor-pointer">
                Annuler
              </button>
              <button type="submit" className="flex-1 py-3 text-sm font-bold rounded-xl bg-white text-black cursor-pointer">
                Sauvegarder
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
