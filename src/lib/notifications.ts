export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission !== 'denied') {
    const perm = await Notification.requestPermission()
    return perm === 'granted'
  }
  return false
}

/**
 * Notifie la fin d'une session. On passe par le service worker quand il est disponible :
 * `new Notification()` est refusé sur Android Chrome, seule `showNotification` y fonctionne.
 */
export async function notifySessionComplete(activityName: string, durationMinutes: number) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  const title = 'FOCUSROLL — Session terminée ! 🎉'
  const options: NotificationOptions = {
    body: `Bravo, ${durationMinutes} min de : ${activityName}.`,
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: 'focusroll-session-done',
  }
  try {
    const reg = await navigator.serviceWorker?.getRegistration()
    if (reg) {
      await reg.showNotification(title, options)
      return
    }
    new Notification(title, options)
  } catch {
    // notifications indisponibles sur cette plateforme
  }
}

export function vibrate(pattern: number | number[]) {
  try {
    // Le navigateur bloque vibrate() tant que l'utilisateur n'a pas touché la page
    if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return
    navigator.vibrate?.(pattern)
  } catch {
    // non supporté (iOS)
  }
}
