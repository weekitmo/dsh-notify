import type { ProjectionDefinition } from '@deepseek-ai/dsh-session-projection';
import type { SessionEvent } from '@deepseek-ai/dsh-session';
import type { NotifyProjectionValue } from './contract.ts';
import type { ResolvedConfig } from './types.ts';
export interface NotifyProjectionState {
    readonly openTurn: {
        readonly turn: number;
        readonly text: string;
        readonly pendingAsyncDelegations: number;
        readonly collectors: Readonly<Record<string, string>>;
    } | null;
    readonly last: NotifyProjectionValue | null;
}
export declare const EMPTY_PROJECTION: NotifyProjectionValue;
export declare function boundText(text: string, maxChars: number): string;
export declare function toolCallStartsAsyncDelegation(name: string, argumentsText: string): boolean;
export declare function turnHasUnsettledAsyncDelegation(events: readonly SessionEvent[], turn: number): boolean;
export declare function applyProjectionEvent(state: NotifyProjectionState, event: SessionEvent, maxChars: number): NotifyProjectionState;
export declare function notifyProjection(config: ResolvedConfig): ProjectionDefinition<'dshNotify', NotifyProjectionState>;
