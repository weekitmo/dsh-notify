import { describe, expect, it } from 'vitest'
import type { AttentionEntry } from '../src/contract.ts'
import { aggregatedTitle, productTitleOf, shellTitleOf, TitleNotifier } from '../src/client/title.ts'

function entry(sessionId: string, reason: AttentionEntry['reason'], createdAt: number): AttentionEntry {
  return { sessionId, turn: 1, reason, tone: reason === 'completed' ? 'success' : 'error', title: sessionId, body: '', createdAt }
}

describe('aggregatedTitle', () => {
  it('folds multiple sessions by outcome and includes running sessions', () => {
    const text = aggregatedTitle(
      [entry('a', 'completed', 1), entry('b', 'completed', 2), entry('c', 'error', 3)],
      (reason, count) => `${String(count)} ${reason}`,
      2,
      count => `${String(count)} running`,
    )
    expect(text).toBe('dsh (2 running · 2 completed · 1 error)')
  })
})

describe('TitleNotifier', () => {
  it('animates a unicode spinner and restores the original title', () => {
    const target = { title: 'DeepSeek Harness' }
    let callback: (() => void) | undefined
    let cancelled = false
    const notifier = new TitleNotifier(
      target,
      next => { callback = next; return 7 },
      id => { cancelled = id === 7 },
    )
    notifier.render('dsh (1 running)', 'marquee', true, false)
    expect(target.title).toContain('⠋')
    expect(target.title).toContain('1 running')
    callback?.()
    expect(target.title).toContain('⠙')
    notifier.render('dsh (1 completed)', 'blink', false, true, 'Selected session — DeepSeek Harness')
    notifier.dispose()
    expect(cancelled).toBe(true)
    expect(target.title).toBe('Selected session — DeepSeek Harness')
  })

  it('derives and restores the shell title from the durable session title', () => {
    expect(productTitleOf('Selected — DeepSeek Harness', 'Selected')).toBe('DeepSeek Harness')
    expect(productTitleOf('DeepSeek Harness', 'Selected')).toBe('DeepSeek Harness')
    expect(shellTitleOf('DeepSeek Harness', 'Selected')).toBe('Selected — DeepSeek Harness')
    expect(shellTitleOf('DeepSeek Harness', undefined)).toBe('DeepSeek Harness')
  })
})
