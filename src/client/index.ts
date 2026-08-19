import type { ClientContext, SessionId, SessionListState, SnapshotStore } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type { AttentionEntry, NotificationReason, NotificationSettings } from '../contract.ts'
import { asReason, reasonEnabled, toneOf } from './decision.ts'
import { NotifySettingsSection, type SettingsInjected } from './SettingsSection.tsx'
import { en, NS, zh, type NotifyKey } from './locales.ts'
import { createNotification, notificationBody, NotificationRegistry, notificationsApi, notificationTitleKey, shouldShowSystem } from './notifier.ts'
import { projectionAdvance } from './runner.ts'
import { SidebarIndicators } from './sidebar.ts'
import { SettingsNavBell } from './settings-nav.ts'
import { attentionEntries, createAttentionStore, createNotificationSettingsStore } from './store.ts'
import { runningConversationCount } from './state.ts'
import { adoptStyles } from './styles.ts'
import { aggregatedTitle, productTitleOf, shellTitleOf, TitleNotifier } from './title.ts'

export const inject = ['sessions', 'slots', 'locale']

interface SessionsFace {
  readonly list: { getSnapshot(): SessionListState; subscribe(listener: () => void): () => void }
  open(id: SessionId): void
}

function titleKey(reason: NotificationReason): NotifyKey {
  switch (reason) {
    case 'completed': return 'title.completed'
    case 'error': return 'title.error'
    case 'aborted': return 'title.aborted'
    case 'blocked': return 'title.blocked'
    case 'max-tokens': return 'title.maxTokens'
  }
}

export function apply(ctx: ClientContext): void {
  const disposeStyles = adoptStyles()
  ctx.effect(() => disposeStyles, 'dsh-notify: styles')
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-notify: dictionaries')

  const t = ctx.locale.bind(NS)
  const sessions = ctx.get('sessions') as unknown as SessionsFace
  const settings: SnapshotStore<NotificationSettings> = createNotificationSettingsStore()
  const attention = createAttentionStore()
  const initialList = sessions.list.getSnapshot()
  const initialSessionTitle = initialList.current === undefined ? undefined : initialList.byId[initialList.current]?.title
  const productTitle = productTitleOf(document.title, initialSessionTitle)
  const title = new TitleNotifier()
  const notifications = new NotificationRegistry()
  const sidebar = new SidebarIndicators()
  const settingsNavBell = new SettingsNavBell(document, () => t('nav'))
  sidebar.start()
  settingsNavBell.start()

  const set = (patch: Partial<NotificationSettings>): void => {
    settings.update(draft => { Object.assign(draft, patch) })
    attention.filter(settings.getSnapshot())
  }
  const requestPermission = (): Promise<NotificationPermission> =>
    notificationsApi()?.requestPermission() ?? Promise.resolve<NotificationPermission>('denied')
  const show = (entry: AttentionEntry): void => {
    const api = notificationsApi()
    if (api === undefined) return
    const notification = createNotification(api, t(notificationTitleKey(entry.reason)), {
      body: notificationBody(entry, t('notify.bodyFallback')),
      tag: `dsh-notify-${entry.sessionId}-${String(entry.turn)}`,
    })
    if (notification === undefined) return
    notifications.track(notification)
    notification.onclick = () => {
      window.focus()
      sessions.open(entry.sessionId as SessionId)
      attention.clear(entry.sessionId)
      notification.close()
    }
  }
  const sendTest = (): void => {
    const api = notificationsApi()
    if (api === undefined || api.permission !== 'granted') return
    const notification = createNotification(api, t('notify.testTitle'), {
      body: t('notify.testBody'),
      tag: `dsh-notify-test-${String(Date.now())}`,
    })
    if (notification !== undefined) notifications.track(notification)
  }

  const visibleEntries = (): AttentionEntry[] => {
    const current = settings.getSnapshot()
    if (!current.enabled) return []
    return attentionEntries(attention.getSnapshot()).filter(entry => reasonEnabled(current, entry.reason))
  }
  const renderSurfaces = (): void => {
    const current = settings.getSnapshot()
    const state = sessions.list.getSnapshot()
    const entries = visibleEntries()
    const runningCount = current.enabled && current.runningTitleIndicator
      ? runningConversationCount(state.ids, state.byId)
      : 0
    const titleEntries = current.titleNotifications ? entries : []
    const titleText = aggregatedTitle(
      titleEntries,
      (reason, count) => t(titleKey(reason), { n: count }),
      runningCount,
      count => t('title.running', { n: count }),
    )
    const currentSessionTitle = state.current === undefined ? undefined : state.byId[state.current]?.title
    const shellTitle = shellTitleOf(productTitle, currentSessionTitle)
    title.render(titleText, current.titleAnimation, runningCount > 0, titleEntries.length > 0, shellTitle)
    const sidebarEnabled = current.enabled && current.sidebarIndicators
    document.documentElement.setAttribute('data-dsh-notify-sidebar', sidebarEnabled ? 'on' : 'off')
    sidebar.render(entries, sidebarEnabled)
  }

  ctx.effect(() => {
    const observedTurns = new Map<string, number>()
    const seed = (): void => {
      observedTurns.clear()
      const state = sessions.list.getSnapshot()
      for (const id of state.ids) {
        observedTurns.set(id, state.byId[id]?.projectionValues?.dshNotify?.turn ?? 0)
      }
    }
    seed()
    const stopList = sessions.list.subscribe(() => {
      const state = sessions.list.getSnapshot()
      const currentSettings = settings.getSnapshot()
      if (state.current !== undefined && !document.hidden) attention.clear(state.current)
      for (const id of state.ids) {
        const summary = state.byId[id]
        if (summary === undefined || summary.origin === 'subagent') continue
        const projection = summary.projectionValues?.dshNotify
        const advanced = projectionAdvance(observedTurns.get(id), projection)
        observedTurns.set(id, advanced.turn)
        if (!advanced.fresh || projection === undefined) continue
        const reason = asReason(projection.reason)
        if (reason === undefined || !currentSettings.enabled || !reasonEnabled(currentSettings, reason)) continue
        const entry: AttentionEntry = {
          sessionId: id,
          turn: projection.turn,
          reason,
          tone: toneOf(reason),
          title: summary.displayTitle,
          body: projection.body,
          createdAt: Date.now(),
        }
        if (state.current !== id || document.hidden) attention.put(entry)
        const permission = notificationsApi()?.permission ?? 'denied'
        if (shouldShowSystem(permission, currentSettings, document.hidden, id, state.current)) show(entry)
      }
      if (state.phase === 'ready') {
        const live = new Set<string>(state.ids)
        attention.retain(live)
        for (const id of observedTurns.keys()) {
          if (!live.has(id)) observedTurns.delete(id)
        }
      }
      renderSurfaces()
    })
    const onVisibility = (): void => {
      if (!document.hidden) {
        const current = sessions.list.getSnapshot().current
        if (current !== undefined) attention.clear(current)
      }
      renderSurfaces()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      stopList()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, 'dsh-notify: session lifecycle')

  ctx.effect(() => {
    const stopAttention = attention.subscribe(renderSurfaces)
    const stopSettings = settings.subscribe(renderSurfaces)
    renderSurfaces()
    return () => {
      stopAttention()
      stopSettings()
      notifications.closeAll()
      sidebar.dispose()
      settingsNavBell.dispose()
      title.dispose()
      document.documentElement.removeAttribute('data-dsh-notify-sidebar')
    }
  }, 'dsh-notify: surfaces')

  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'dsh-notify',
    order: 60,
    label: () => t('nav'),
    locale: NS,
    inject: (): SettingsInjected => ({ hooks: { settings }, set, requestPermission, sendTest }),
  }, NotifySettingsSection))
}
