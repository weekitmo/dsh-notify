import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import type {} from '@deepseek-ai/dsh-host-webserver'
import type { Session, SessionEvent } from '@deepseek-ai/dsh-session'
import type {} from '@deepseek-ai/dsh-session-projection'
import type {} from '@deepseek-ai/dsh-session-title'
import { createDingTalkRoute, DingTalkService } from './dingtalk.ts'
import { notifyProjection } from './projection.ts'
import type { ResolvedConfig } from './types.ts'

export const name = 'dsh-notify'
export const inject = ['sessions', 'sessionProjections', 'sessionTitle', 'webServer']

export interface Config {}

export const Config = z.object({})

function notificationReason(event: SessionEvent<'turn/end'>): import('./contract.ts').NotificationReason | undefined {
  switch (event.data.reason.kind) {
    case 'completed': return 'completed'
    case 'error': return 'error'
    case 'aborted':
    case 'interrupted': return 'aborted'
    case 'blocked': return 'blocked'
    case 'max-tokens': return 'max-tokens'
    default: return undefined
  }
}

async function resolvedSessionTitle(ctx: Context, session: Session): Promise<string> {
  const existing = ctx.sessionTitle.get(session)
  const firstCompletedTurn = session.events.filter(event => event.type === 'turn/end').length === 1
  if (existing !== undefined && (existing.source.kind !== 'fallback' || !firstCompletedTurn)) {
    return existing.title.trim() || String(session.id)
  }
  try {
    const refreshed = await ctx.sessionTitle.refresh(session, AbortSignal.timeout(15_000))
    const title = refreshed?.title.trim()
    return title === undefined || title === '' ? String(session.id) : title
  } catch (error) {
    ctx.logger.warn(error instanceof Error ? error : new Error(String(error)))
    const fallback = existing?.title.trim()
    return fallback === undefined || fallback === '' ? String(session.id) : fallback
  }
}

function turnBody(session: Session, turn: number, maxChars: number): string {
  let body = ''
  for (const event of session.events) {
    if (event.type !== 'assistant/message' || event.data.turn !== turn) continue
    for (const block of event.data.message.content) {
      if (block.type === 'text') body += block.text
    }
  }
  return Array.from(body.trim()).slice(0, maxChars).join('')
}

export async function apply(ctx: Context, config?: Config): Promise<void> {
  Config(config ?? {})
  const resolved: ResolvedConfig = { maxBodyChars: 2000 }
  ctx.sessionProjections.register(notifyProjection(resolved))

  const dingTalk = new DingTalkService()
  await dingTalk.initialize()
  ctx.effect(
    () => ctx.webServer.register({
      kind: 'exact',
      path: '/api/dsh-notify/dingtalk',
      handler: createDingTalkRoute(dingTalk),
    }),
    'dsh-notify: DingTalk API',
  )
  ctx.effect(() => () => { dingTalk.dispose() }, 'dsh-notify: DingTalk service')
  ctx.on('session/event', (session, event) => {
    if (event.type !== 'turn/end' || session.header.origin === 'subagent') return
    const reason = notificationReason(event)
    if (reason === undefined || !dingTalk.enabledFor(reason)) return
    void (async () => {
      await dingTalk.notify({
        eventId: String(session.id) + ':' + String(event.data.turn),
        sessionId: String(session.id),
        turn: event.data.turn,
        reason,
        title: await resolvedSessionTitle(ctx, session),
        body: turnBody(session, event.data.turn, resolved.maxBodyChars),
      })
    })().catch(error => { ctx.logger.warn(error instanceof Error ? error : new Error(String(error))) })
  }, { global: true })
}
