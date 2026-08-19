import { useEffect, useState } from 'react'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { SnapshotStore } from '@deepseek-ai/dsh-client-runtime/client'
import type { NotificationSettings } from '../contract.ts'
import type { NotifyKey } from './locales.ts'
import { notificationsApi } from './notifier.ts'

export interface SettingsInjected {
  hooks: { settings: SnapshotStore<NotificationSettings> }
  set: (patch: Partial<NotificationSettings>) => void
  requestPermission: () => Promise<NotificationPermission>
  sendTest: () => void
}

type Props = PropsRuntime<'settings.section'> & InjectFace<SettingsInjected> & PropsLocale<'dsh-notify'>
type BooleanField = Exclude<keyof NotificationSettings, 'titleAnimation'>

function Toggle({ checked, label, desc, onChange }: {
  checked: boolean
  label: string
  desc?: string
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="dsh_notify_toggle">
      <input type="checkbox" checked={checked} onChange={event => { onChange(event.target.checked) }} />
      <span><strong>{label}</strong>{desc === undefined ? null : <small>{desc}</small>}</span>
    </label>
  )
}

const OUTCOMES: ReadonlyArray<{ field: BooleanField; key: NotifyKey }> = [
  { field: 'notifyCompleted', key: 'settings.outcomes.completed' },
  { field: 'notifyError', key: 'settings.outcomes.error' },
  { field: 'notifyAborted', key: 'settings.outcomes.aborted' },
  { field: 'notifyBlocked', key: 'settings.outcomes.blocked' },
  { field: 'notifyMaxTokens', key: 'settings.outcomes.maxTokens' },
]

export function NotifySettingsSection({ useSettings, set, requestPermission, sendTest, t }: Props) {
  const settings = useSettings(value => value)
  const [permission, setPermission] = useState<NotificationPermission>(() => notificationsApi()?.permission ?? 'denied')
  const [hint, setHint] = useState<NotifyKey | null>(null)

  useEffect(() => {
    const refresh = (): void => { setPermission(notificationsApi()?.permission ?? 'denied') }
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [])

  const change = (field: BooleanField, checked: boolean): void => { set({ [field]: checked } as Partial<NotificationSettings>) }
  const authorize = async (): Promise<NotificationPermission> => {
    const next = await requestPermission()
    setPermission(next)
    setHint(next === 'granted' ? null : next === 'denied' ? 'settings.permission.deniedHint' : 'settings.permission.defaultHint')
    return next
  }
  const test = async (): Promise<void> => {
    const current = notificationsApi()?.permission === 'granted' ? 'granted' : await authorize()
    if (current === 'granted') sendTest()
  }

  return (
    <section className="dsh_notify_settings" aria-labelledby="dsh-notify-heading">
      <header>
        <h2 id="dsh-notify-heading">{t('settings.title')}</h2>
        <p>{t('settings.subtitle')}</p>
      </header>
      <div className="dsh_notify_group">
        <Toggle checked={settings.enabled} label={t('settings.enabled')} desc={t('settings.enabledDesc')} onChange={checked => { change('enabled', checked) }} />
      </div>
      <div className="dsh_notify_group">
        <h3>{t('settings.system.title')}</h3>
        <Toggle checked={settings.systemNotifications} label={t('settings.system.enabled')} onChange={checked => { change('systemNotifications', checked) }} />
        <Toggle checked={settings.backgroundOnly} label={t('settings.system.backgroundOnly')} onChange={checked => { change('backgroundOnly', checked) }} />
        <div className="dsh_notify_permission">
          <span>{t('settings.permission.title')}: <b data-permission={permission}>{t(`settings.permission.${permission}`)}</b></span>
          <button type="button" onClick={() => { void authorize() }}>{t('settings.permission.request')}</button>
          <button type="button" onClick={() => { void test() }}>{t('settings.permission.test')}</button>
        </div>
        {hint === null ? null : <p className="dsh_notify_hint">{t(hint)}</p>}
      </div>
      <div className="dsh_notify_group">
        <h3>{t('settings.titleSurface.title')}</h3>
        <Toggle checked={settings.titleNotifications} label={t('settings.titleSurface.enabled')} onChange={checked => { change('titleNotifications', checked) }} />
        <Toggle checked={settings.runningTitleIndicator} label={t('settings.titleSurface.running')} onChange={checked => { change('runningTitleIndicator', checked) }} />
        <div className="dsh_notify_segment" role="group" aria-label={t('settings.titleSurface.animation')}>
          <button type="button" aria-pressed={settings.titleAnimation === 'marquee'} onClick={() => { set({ titleAnimation: 'marquee' }) }}>{t('settings.titleSurface.marquee')}</button>
          <button type="button" aria-pressed={settings.titleAnimation === 'blink'} onClick={() => { set({ titleAnimation: 'blink' }) }}>{t('settings.titleSurface.blink')}</button>
        </div>
      </div>
      <div className="dsh_notify_group">
        <h3>{t('settings.sidebar.title')}</h3>
        <Toggle checked={settings.sidebarIndicators} label={t('settings.sidebar.enabled')} desc={t('settings.sidebar.desc')} onChange={checked => { change('sidebarIndicators', checked) }} />
      </div>
      <div className="dsh_notify_group">
        <h3>{t('settings.outcomes.title')}</h3>
        <div className="dsh_notify_outcomes">
          {OUTCOMES.map(item => <Toggle key={item.field} checked={settings[item.field]} label={t(item.key)} onChange={checked => { change(item.field, checked) }} />)}
        </div>
      </div>
    </section>
  )
}
