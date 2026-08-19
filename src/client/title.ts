import type { AttentionEntry, NotificationReason, TitleAnimation } from '../contract.ts'

export type ReasonLabel = (reason: NotificationReason, count: number) => string

export interface WorkspaceSessionTitleSummary {
  readonly displayTitle: string
  readonly title?: string
  readonly cwd?: string
  readonly origin?: 'subagent'
  readonly blank: boolean
  readonly updatedAt: number
}

export function recentWorkspaceSessionTitle(
  ids: readonly string[],
  byId: Readonly<Record<string, WorkspaceSessionTitleSummary | undefined>>,
): string | undefined {
  let recent: WorkspaceSessionTitleSummary | undefined
  for (const id of ids) {
    const summary = byId[id]
    if (summary === undefined || summary.cwd === undefined || summary.origin === 'subagent' || summary.blank) continue
    if (recent === undefined || summary.updatedAt > recent.updatedAt) recent = summary
  }
  const value = recent?.title?.trim() || recent?.displayTitle.trim()
  return value === '' ? undefined : value
}

const REASON_ORDER: readonly NotificationReason[] = ['completed', 'error', 'aborted', 'blocked', 'max-tokens']
const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'] as const

export function aggregatedTitle(
  entries: readonly AttentionEntry[],
  label: ReasonLabel,
  runningCount = 0,
  runningLabel: (count: number) => string = count => `${String(count)} running`,
): string {
  const counts = new Map<NotificationReason, number>()
  for (const entry of entries) counts.set(entry.reason, (counts.get(entry.reason) ?? 0) + 1)
  const parts = runningCount > 0 ? [runningLabel(runningCount)] : []
  for (const reason of REASON_ORDER) {
    const count = counts.get(reason) ?? 0
    if (count > 0) parts.push(label(reason, count))
  }
  return parts.length === 0 ? '' : `dsh (${parts.join(' · ')})`
}

export function productTitleOf(renderedTitle: string, currentSessionTitle: string | undefined): string {
  if (currentSessionTitle === undefined) return renderedTitle
  const prefix = `${currentSessionTitle} — `
  return renderedTitle.startsWith(prefix) ? renderedTitle.slice(prefix.length) : renderedTitle
}

export function shellTitleOf(productTitle: string, currentSessionTitle: string | undefined): string {
  return currentSessionTitle === undefined ? productTitle : `${currentSessionTitle} — ${productTitle}`
}

export interface TitleDocument { title: string }

export class TitleNotifier {
  private baseTitle: string
  private timer: number | undefined
  private text = ''
  private mode: TitleAnimation = 'marquee'
  private spinning = false
  private animateText = true
  private offset = 0
  private frame = 0

  constructor(
    private readonly target: TitleDocument = document,
    private readonly schedule: (callback: () => void, ms: number) => number = window.setInterval.bind(window),
    private readonly cancel: (id: number) => void = window.clearInterval.bind(window),
  ) {
    this.baseTitle = target.title
  }

  render(text: string, mode: TitleAnimation, spinning = false, animateText = true, baseTitle = this.baseTitle): void {
    const baseChanged = this.baseTitle !== baseTitle
    this.baseTitle = baseTitle
    if (this.text === text && this.mode === mode && this.spinning === spinning && this.animateText === animateText) {
      if (text === '' && baseChanged) this.write(baseTitle)
      return
    }
    this.stopTimer()
    this.text = text
    this.mode = mode
    this.spinning = spinning
    this.animateText = animateText
    this.offset = 0
    this.frame = 0
    if (text === '') {
      this.write(baseTitle)
      return
    }
    this.tick()
    if (spinning || animateText) {
      this.timer = this.schedule(() => { this.tick() }, spinning ? 180 : mode === 'marquee' ? 300 : 900)
    }
  }

  dispose(restoreTitle = this.baseTitle): void {
    this.stopTimer()
    this.write(restoreTitle)
  }

  private write(value: string): void {
    this.target.title = value
  }

  private tick(): void {
    const prefix = this.spinning ? `${SPINNER_FRAMES[this.frame % SPINNER_FRAMES.length]} ` : ''
    if (!this.animateText) {
      this.write(prefix + this.text)
    } else if (this.mode === 'blink') {
      const phaseLength = this.spinning ? 5 : 1
      const showAttention = Math.floor(this.frame / phaseLength) % 2 === 0
      this.write(showAttention ? prefix + this.text : prefix + this.baseTitle)
    } else {
      const runway = `   ${this.text}`
      const offset = this.offset % runway.length
      this.write(prefix + runway.slice(offset) + runway.slice(0, offset))
      if (!this.spinning || this.frame % 2 === 1) this.offset = (offset + 1) % runway.length
    }
    this.frame += 1
  }

  private stopTimer(): void {
    if (this.timer === undefined) return
    this.cancel(this.timer)
    this.timer = undefined
  }
}
