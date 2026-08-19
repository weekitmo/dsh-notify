import type { AttentionEntry, NotificationSettings } from '../contract.ts';
export declare function defaultNotificationSettings(): NotificationSettings;
export interface AttentionState {
    readonly bySession: Record<string, AttentionEntry>;
}
/** Merge persisted browser data with current defaults before the UI consumes it. */
export declare function normalizeNotificationSettings(value: unknown): NotificationSettings;
/** Remove unread results that the current settings no longer allow to surface. */
export declare function filterAttentionBySettings(state: AttentionState, settings: NotificationSettings): AttentionState;
export declare function putAttention(state: AttentionState, entry: AttentionEntry): AttentionState;
export declare function clearAttention(state: AttentionState, sessionId: string): AttentionState;
export declare function retainAttention(state: AttentionState, sessionIds: ReadonlySet<string>): AttentionState;
export declare function attentionEntries(state: AttentionState): AttentionEntry[];
export interface RunningSessionSummary {
    readonly id: string;
    readonly parentId?: string;
    readonly origin?: 'subagent';
    readonly running: boolean;
}
export declare function runningConversationCount(ids: readonly string[], byId: Readonly<Record<string, RunningSessionSummary | undefined>>): number;
