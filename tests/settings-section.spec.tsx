// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { NotifySettingsSection } from '../src/client/SettingsSection.tsx'
import { defaultNotificationSettings } from '../src/client/state.ts'
import { zh, type NotifyKey } from '../src/client/locales.ts'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

function translate(key: NotifyKey): string { return zh[key] }

afterEach(() => {
  document.body.replaceChildren()
  vi.restoreAllMocks()
})

describe('DingTalk settings section', () => {
  it('opens the official robot documentation in a protected new tab', async () => {
    const host = document.createElement('div')
    document.body.appendChild(host)
    const open = vi.spyOn(window, 'open').mockImplementation(() => null)
    const root = createRoot(host)
    const settings = defaultNotificationSettings()
    const useSettings = <T,>(selector: (value: typeof settings) => T): T => selector(settings)
    await act(async () => {
      root.render(<NotifySettingsSection
        useSettings={useSettings as never}
        set={() => {}}
        requestPermission={async () => 'denied'}
        sendTest={() => {}}
        loadDingTalk={async () => ({ configured: false, notifyCompleted: true, notifyFailed: true, quietHoursEnabled: false, quietHoursStart: '23:00', quietHoursEnd: '08:00', notifyMissed: false })}
        saveDingTalk={async value => ({ configured: true, ...value })}
        testDingTalk={async () => {}}
        t={translate as never}
        close={() => {}}
      />)
      await Promise.resolve()
    })
    const button = [...host.querySelectorAll('button')].find(node => node.textContent === zh['settings.dingtalk.docs'])
    expect(button).toBeDefined()
    act(() => { button!.click() })
    expect(open).toHaveBeenCalledWith(
      'https://open.dingtalk.com/document/dingstart/custom-bot-creation-and-installation',
      '_blank',
      'noopener,noreferrer',
    )
    act(() => { root.unmount() })
  })
})
