import { z } from 'zod'
import type { ProjectionDefinition } from '@deepseek-ai/dsh-session-projection'
import type { SessionEvent } from '@deepseek-ai/dsh-session'
import type { NotifyProjectionValue } from './contract.ts'
import type { ResolvedConfig } from './types.ts'

export interface NotifyProjectionState {
  readonly openTurn: { readonly turn: number; readonly text: string } | null
  readonly last: NotifyProjectionValue | null
}

export const EMPTY_PROJECTION: NotifyProjectionValue = Object.freeze({ turn: 0, reason: '', body: '' })

export function boundText(text: string, maxChars: number): string {
  const characters = Array.from(text)
  if (characters.length <= maxChars) return text
  return characters.slice(0, Math.max(0, maxChars - 1)).join('') + '…'
}

export function applyProjectionEvent(
  state: NotifyProjectionState,
  event: SessionEvent,
  maxChars: number,
): NotifyProjectionState {
  switch (event.type) {
    case 'turn/start':
      return { ...state, openTurn: { turn: event.data.turn, text: '' } }
    case 'assistant/message': {
      const open = state.openTurn
      if (open === null || open.turn !== event.data.turn) return state
      let text = open.text
      for (const block of event.data.message.content) {
        if (block.type === 'text') text += block.text
      }
      text = boundText(text, maxChars)
      return text === open.text ? state : { ...state, openTurn: { ...open, text } }
    }
    case 'turn/end': {
      const open = state.openTurn
      if (open === null || open.turn !== event.data.turn) return state
      return {
        openTurn: null,
        last: { turn: event.data.turn, reason: event.data.reason.kind, body: open.text.trim() },
      }
    }
    default:
      return state
  }
}

export function notifyProjection(config: ResolvedConfig): ProjectionDefinition<'dshNotify', NotifyProjectionState> {
  return {
    key: 'dshNotify',
    schema: z.object({
      turn: z.number().int().nonnegative(),
      reason: z.string(),
      body: z.string(),
    }).strict(),
    init: () => ({ openTurn: null, last: null }),
    apply: (state, event) => applyProjectionEvent(state, event, config.maxBodyChars),
    view: state => state.last ?? EMPTY_PROJECTION,
    stateVersion: 1,
  }
}
