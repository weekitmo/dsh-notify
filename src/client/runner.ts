import type { NotifyProjectionValue } from '../contract.ts'

export function projectionAdvance(
  previousTurn: number | undefined,
  projection: NotifyProjectionValue | undefined,
): { readonly turn: number; readonly fresh: boolean } {
  const turn = projection?.turn ?? previousTurn ?? 0
  return { turn, fresh: projection !== undefined && previousTurn !== undefined && turn > previousTurn }
}
