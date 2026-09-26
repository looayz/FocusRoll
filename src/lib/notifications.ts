export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission !== 'denied') {
    const perm = await Notification.requestPermission()
    return perm === 'granted'
  }
  return false
}

export function notifySessionComplete(activityName: string, durationMinutes: number) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return

  try {
    new Notification('FOCUSROLL — Session terminée ! 🎉', {
      body: `Félicitations, vous avez complété ${durationMinutes} minutes de : ${activityName}.`,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: 'focusroll-session-done',
    })
  } catch {
    // Safari / mobile fallback
  }
}
