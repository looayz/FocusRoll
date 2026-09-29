import { useSyncExternalStore } from 'react'

export type NotificationPermissionState = 'granted' | 'denied' | 'default' | 'unsupported'

export function getNotificationPermission(): NotificationPermissionState {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
  return Notification.permission
}

/**
 * Permission de notification, à jour en direct : elle change quand l'utilisateur la modifie dans les
 * réglages du navigateur / du système puis revient sur l'app (visibilitychange / focus / Permissions API).
 */
function subscribePermission(onChange: () => void) {
  let status: PermissionStatus | null = null
  let disposed = false
  navigator.permissions
    ?.query({ name: 'notifications' })
    .then((s) => {
      if (disposed) return
      status = s
      s.onchange = onChange
    })
    .catch(() => {})
  document.addEventListener('visibilitychange', onChange)
  window.addEventListener('focus', onChange)
  return () => {
    disposed = true
    if (status) status.onchange = null
    document.removeEventListener('visibilitychange', onChange)
    window.removeEventListener('focus', onChange)
  }
}

export function useNotificationPermission(): NotificationPermissionState {
  return useSyncExternalStore(subscribePermission, getNotificationPermission, () => 'unsupported')
}

/**
 * Demande la permission. Le navigateur n'affiche la fenêtre que si l'état est "default" :
 * une fois "denied", seul l'utilisateur peut la rétablir (réglages du navigateur / du système).
 */
export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (getNotificationPermission() === 'unsupported') return 'unsupported'
  if (Notification.permission === 'default') {
    try {
      await Notification.requestPermission()
    } catch {
      // anciens Safari : requestPermission(callback) uniquement
    }
  }
  return getNotificationPermission()
}

/**
 * Affiche une notification. On passe par le service worker quand il est disponible :
 * `new Notification()` est refusé sur Android Chrome, seule `showNotification` y fonctionne.
 */
export async function showNotification(title: string, body: string, tag = 'focusroll'): Promise<boolean> {
  if (getNotificationPermission() !== 'granted') return false
  const options: NotificationOptions = {
    body,
    icon: `${import.meta.env.BASE_URL}pwa-192x192.png`,
    badge: `${import.meta.env.BASE_URL}pwa-192x192.png`,
    tag,
  }
  try {
    const reg = await navigator.serviceWorker?.getRegistration()
    if (reg) {
      await reg.showNotification(title, options)
    } else {
      new Notification(title, options)
    }
    return true
  } catch {
    return false
  }
}

export function notifySessionComplete(activityName: string, durationMinutes: number) {
  return showNotification(
    'FOCUSROLL — Session terminée ! 🎉',
    `Bravo, ${durationMinutes} min de : ${activityName}.`,
    'focusroll-session-done',
  )
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
