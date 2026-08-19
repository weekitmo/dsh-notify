import type { AttentionEntry, NotificationReason, NotificationSettings } from '../contract.ts'

export function notificationsApi(): typeof Notification | undefined {
  return typeof Notification === 'undefined' ? undefined : Notification
}


export interface ManagedNotification {
  onclick: ((this: Notification, event: Event) => unknown) | null
  onclose: ((this: Notification, event: Event) => unknown) | null
  close(): void
}

export class NotificationRegistry {
  private readonly active = new Set<ManagedNotification>()

  track(notification: ManagedNotification): void {
    this.active.add(notification)
    notification.onclose = () => { this.active.delete(notification) }
  }

  closeAll(): void {
    for (const notification of this.active) {
      notification.onclick = null
      notification.onclose = null
      notification.close()
    }
    this.active.clear()
  }
}

export function shouldShowSystem(
  permission: NotificationPermission,
  settings: NotificationSettings,
  documentHidden: boolean,
  completedSessionId: string,
  currentSessionId: string | undefined,
): boolean {
  if (!settings.enabled || !settings.systemNotifications || permission !== 'granted') return false
  return !settings.backgroundOnly || documentHidden || completedSessionId !== currentSessionId
}

export function notificationTitleKey(reason: NotificationReason):
  | 'notify.completed' | 'notify.error' | 'notify.aborted' | 'notify.blocked' | 'notify.maxTokens' {
  switch (reason) {
    case 'completed': return 'notify.completed'
    case 'error': return 'notify.error'
    case 'aborted': return 'notify.aborted'
    case 'blocked': return 'notify.blocked'
    case 'max-tokens': return 'notify.maxTokens'
  }
}

export function notificationBody(entry: AttentionEntry, fallback: string): string {
  const body = entry.body.trim() === '' ? fallback : entry.body.trim()
  return `${entry.title}: ${body}`
}
