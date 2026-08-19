import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import type {} from '@deepseek-ai/dsh-session-projection'
import { notifyProjection } from './projection.ts'
import type { ResolvedConfig } from './types.ts'

export const name = 'dsh-notify'
export const inject = ['sessionProjections']

export interface Config {
  maxBodyChars: number
}

export const Config = z.object({
  maxBodyChars: z.natural().min(1).default(400),
})

export function apply(ctx: Context, config?: Config): void {
  const resolved: ResolvedConfig = Config(config ?? {})
  ctx.sessionProjections.register(notifyProjection(resolved))
}
