import { useState, useEffect } from 'react'
import { Download, Smartphone, Share, PlusSquare, X } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export const InstallPromptModal: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Détection si déjà installé en mode standalone
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true
    setIsStandalone(standalone)

    // Détection iOS Safari
    const ua = window.navigator.userAgent.toLowerCase()
    const ios = /iphone|ipad|ipod/.test(ua)
    setIsIOS(ios)

    // Événement avant installation PWA (Android Chrome, Edge, etc.)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
    }
  }, [])

  if (isStandalone) {
    return null
  }

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setDeferredPrompt(null)
        setIsOpen(false)
      }
    } else {
      setIsOpen(true)
    }
  }

  return (
    <>
      {/* Bouton discret d'installation */}
      <button
        onClick={handleInstallClick}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-600/15 border border-blue-500/30 text-blue-400 text-xs font-semibold hover:bg-blue-600/25 transition-all cursor-pointer"
      >
        <Smartphone className="w-3.5 h-3.5" />
        <span>Installer l'app</span>
      </button>

      {/* Modal explicatif iOS / instructions manuelles */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0e1017] border border-[#202538] rounded-3xl p-6 w-full max-w-sm text-left shadow-2xl relative">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-zinc-500 hover:text-white rounded-full hover:bg-zinc-800"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Installer sur votre téléphone</h3>
                <p className="text-[11px] text-zinc-400">Accès 1-clic direct plein écran</p>
              </div>
            </div>

            {isIOS ? (
              <div className="space-y-3 text-xs text-zinc-300 bg-[#141724] border border-[#1e2338] p-4 rounded-2xl">
                <p className="font-semibold text-white">Sur iPhone (Safari) :</p>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] text-zinc-300 font-bold">1</span>
                  <span>Appuyez sur le bouton <strong>Partager</strong></span>
                  <Share className="w-4 h-4 text-blue-400 inline" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] text-zinc-300 font-bold">2</span>
                  <span>Faites défiler et sélectionnez <strong>Sur l'écran d'accueil</strong></span>
                  <PlusSquare className="w-4 h-4 text-emerald-400 inline" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] text-zinc-300 font-bold">3</span>
                  <span>Validez en haut à droite avec <strong>Ajouter</strong></span>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs text-zinc-300 bg-[#141724] border border-[#1e2338] p-4 rounded-2xl">
                <p className="font-semibold text-white">Sur Android / Chrome / Opera :</p>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] text-zinc-300 font-bold">1</span>
                  <span>Ouvrez le menu <strong>⋮</strong> en haut à droite</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] text-zinc-300 font-bold">2</span>
                  <span>Appuyez sur <strong>Installer l'application</strong> ou <strong>Ajouter à l'écran d'accueil</strong></span>
                </div>
              </div>
            )}

            <button
              onClick={() => setIsOpen(false)}
              className="mt-5 w-full py-3 rounded-2xl bg-white text-black font-bold text-xs hover:bg-zinc-200 transition-all cursor-pointer"
            >
              J'ai compris
            </button>
          </div>
        </div>
      )}
    </>
  )
}
