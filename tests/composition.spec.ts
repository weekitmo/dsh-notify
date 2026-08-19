import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Context } from '@deepseek-ai/cordis'
import TypertRegistry from '@deepseek-ai/dsh-typert-registry'
import SessionStore from '@deepseek-ai/dsh-session'
import SessionProjectionRegistry from '@deepseek-ai/dsh-session-projection'
import WebServer from '@deepseek-ai/dsh-host-webserver'
import SessionTitleService from '@deepseek-ai/dsh-session-title'
import { createAssistantMessage, createUserMessage } from '@deepseek-ai/dsh-llm'
import { describe, expect, it, vi } from 'vitest'
import * as plugin from '../src/index.ts'

function reply(text: string) {
  return createAssistantMessage({ content: [{ type: 'text', text }], source: { provider: 'test', model: 'test' } })
}

const TITLE_CONFIG = { fallbackMaxWords: 5, fallbackMaxBytes: 80, maxTitleBytes: 80 } as const

async function mountHost(ctx: Context): Promise<void> {
  await ctx.plugin(TypertRegistry)
  await ctx.plugin(SessionStore)
  await ctx.plugin(SessionProjectionRegistry)
  await ctx.plugin(SessionTitleService, TITLE_CONFIG)
  await ctx.plugin(WebServer, { host: '127.0.0.1', port: 0 })
}

describe('dsh-notify host composition', () => {
  it('registers the projection, projects a turn, and removes it on disposal', async () => {
    const previousHome = process.env.DSH_HOME
    process.env.DSH_HOME = await mkdtemp(join(tmpdir(), 'dsh-notify-composition-'))
    const ctx = new Context()
    await mountHost(ctx)
    const fiber = ctx.plugin({ inject: plugin.inject, apply: plugin.apply }, { maxBodyChars: 100 })
    await fiber

    const sessions = ctx.get('sessions') as SessionStore
    const session = sessions.create(undefined, { meta: { cwd: '/tmp/dsh-notify' } })
    session.append('turn/start', { turn: 1 })
    session.append('step/start', { turn: 1, step: 1 })
    session.append('assistant/message', { turn: 1, step: 1, message: reply('deployment failed') }, { surfaceOp: 'append' })
    session.append('step/end', { turn: 1, step: 1 })
    session.append('turn/end', { turn: 1, reason: { kind: 'error', error: { message: 'boom', code: 'UNKNOWN' } } })

    const projections = ctx.get('sessionProjections') as SessionProjectionRegistry
    expect(projections.snapshot(session).values.dshNotify).toEqual({
      turn: 1,
      reason: 'error',
      body: 'deployment failed',
    })

    await fiber.dispose()
    expect(projections.snapshot(session).values.dshNotify).toBeUndefined()
    if (previousHome === undefined) delete process.env.DSH_HOME
    else process.env.DSH_HOME = previousHome
  })

  it('sends a completed turn from the host session event feed', async () => {
    const previousHome = process.env.DSH_HOME
    const home = await mkdtemp(join(tmpdir(), 'dsh-notify-host-event-'))
    process.env.DSH_HOME = home
    await mkdir(join(home, 'dsh-notify'), { recursive: true, mode: 0o700 })
    await writeFile(join(home, 'dsh-notify', 'settings.json'), JSON.stringify({
      accessToken: 'test-token',
      signingSecret: 'test-secret',
      notifyCompleted: true,
      notifyFailed: false,
      quietHoursEnabled: false,
      quietHoursStart: '23:00',
      quietHoursEnd: '08:00',
      notifyMissed: true,
    }), { mode: 0o600 })
    const request = vi.fn<typeof fetch>().mockResolvedValue(new Response('{"errcode":0,"errmsg":"ok"}'))
    vi.stubGlobal('fetch', request)

    const ctx = new Context()
    await mountHost(ctx)
    const fiber = ctx.plugin({ inject: plugin.inject, apply: plugin.apply }, { maxBodyChars: 100 })
    await fiber
    const sessions = ctx.get('sessions') as SessionStore
    const session = sessions.create(undefined, { meta: { cwd: '/tmp/dsh-notify' } })
    session.append('turn/start', { turn: 1 })
    session.append('user/message', createUserMessage({
      content: [{ type: 'text', text: 'Generated deployment title' }],
      source: { kind: 'user' },
    }), { surfaceOp: 'append' })
    session.append('step/start', { turn: 1, step: 1 })
    session.append('assistant/message', { turn: 1, step: 1, message: reply('host notification body') }, { surfaceOp: 'append' })
    session.append('step/end', { turn: 1, step: 1 })
    session.append('turn/end', { turn: 1, reason: { kind: 'completed' } })

    await vi.waitFor(() => { expect(request).toHaveBeenCalledOnce() })
    const [url, init] = request.mock.calls[0]!
    expect(new URL(String(url)).searchParams.get('access_token')).toBe('test-token')
    expect(JSON.parse(String(init?.body))).toMatchObject({
      msgtype: 'markdown',
      markdown: {
        title: 'DSH 任务已完成',
        text: expect.stringMatching(/Generated deployment title[\s\S]*host notification body/),
      },
    })
    await fiber.dispose()
    vi.unstubAllGlobals()
    if (previousHome === undefined) delete process.env.DSH_HOME
    else process.env.DSH_HOME = previousHome
  })

  it('validates the host projection configuration', () => {
    expect(plugin.Config({})).toEqual({ maxBodyChars: 400 })
    expect(() => plugin.Config({ maxBodyChars: 0 })).toThrow()
  })
})
