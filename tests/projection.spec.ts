import type { SessionEvent } from '@deepseek-ai/dsh-session'
import { describe, expect, it } from 'vitest'
import { applyProjectionEvent, boundText, EMPTY_PROJECTION, notifyProjection, type NotifyProjectionState } from '../src/projection.ts'

function event(type: string, data: unknown): SessionEvent {
  return { type, seq: 0, time: 0, data } as SessionEvent
}

function fold(events: readonly SessionEvent[], maxBodyChars = 400) {
  let state: NotifyProjectionState = { openTurn: null, last: null }
  for (const item of events) state = applyProjectionEvent(state, item, maxBodyChars)
  return notifyProjection({ maxBodyChars }).view(state)
}

describe('notification projection', () => {
  it('reports an empty view before the first completed turn', () => {
    expect(fold([])).toEqual(EMPTY_PROJECTION)
  })

  it('captures text and the exact end reason', () => {
    expect(fold([
      event('turn/start', { turn: 1 }),
      event('assistant/message', { turn: 1, step: 1, message: { content: [{ type: 'text', text: 'failed' }] } }),
      event('turn/end', { turn: 1, reason: { kind: 'error' } }),
    ])).toEqual({ turn: 1, reason: 'error', body: 'failed' })
  })

  it('bounds projected reply text without splitting Unicode code points', () => {
    expect(boundText('123456', 4)).toBe('123…')
    expect(boundText('A😀BC', 3)).toBe('A😀…')
    const definition = notifyProjection({ maxBodyChars: 4 })
    expect(definition.key).toBe('dshNotify')
    expect(definition.stateVersion).toBe(1)
  })
})
