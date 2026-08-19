import { describe, expect, it } from 'vitest'
import { projectionAdvance } from '../src/client/runner.ts'

describe('projectionAdvance', () => {
  it('seeds without notifying history', () => {
    expect(projectionAdvance(undefined, { turn: 4, reason: 'completed', body: 'old' }))
      .toEqual({ turn: 4, fresh: false })
  })

  it('fires only for a later completed turn', () => {
    expect(projectionAdvance(4, { turn: 5, reason: 'error', body: 'new' }))
      .toEqual({ turn: 5, fresh: true })
    expect(projectionAdvance(5, { turn: 5, reason: 'error', body: 'new' }))
      .toEqual({ turn: 5, fresh: false })
  })

  it('keeps the previous watermark while a reconnect temporarily omits projections', () => {
    expect(projectionAdvance(undefined, undefined)).toEqual({ turn: 0, fresh: false })
    expect(projectionAdvance(5, undefined)).toEqual({ turn: 5, fresh: false })
    expect(projectionAdvance(5, { turn: 6, reason: 'completed', body: 'reconnected' }))
      .toEqual({ turn: 6, fresh: true })
  })
})
