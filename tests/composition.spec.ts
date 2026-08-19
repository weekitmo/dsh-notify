import { Context } from '@deepseek-ai/cordis'
import TypertRegistry from '@deepseek-ai/dsh-typert-registry'
import SessionStore from '@deepseek-ai/dsh-session'
import SessionProjectionRegistry from '@deepseek-ai/dsh-session-projection'
import { createAssistantMessage } from '@deepseek-ai/dsh-llm'
import { describe, expect, it } from 'vitest'
import * as plugin from '../src/index.ts'

function reply(text: string) {
  return createAssistantMessage({ content: [{ type: 'text', text }], source: { provider: 'test', model: 'test' } })
}

describe('dsh-notify host composition', () => {
  it('registers the projection, projects a turn, and removes it on disposal', async () => {
    const ctx = new Context()
    await ctx.plugin(TypertRegistry)
    await ctx.plugin(SessionStore)
    await ctx.plugin(SessionProjectionRegistry)
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
  })

  it('validates the host projection configuration', () => {
    expect(plugin.Config({})).toEqual({ maxBodyChars: 400 })
    expect(() => plugin.Config({ maxBodyChars: 0 })).toThrow()
  })
})
