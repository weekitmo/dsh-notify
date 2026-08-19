import { type SnapshotStore } from '@deepseek-ai/dsh-client-runtime/client';
import type { AttentionEntry, NotificationSettings } from '../contract.ts';
import { attentionEntries, defaultNotificationSettings, filterAttentionBySettings, normalizeNotificationSettings, type AttentionState } from './state.ts';
export { attentionEntries, defaultNotificationSettings, filterAttentionBySettings, normalizeNotificationSettings };
export type { AttentionState };
export declare function createNotificationSettingsStore(): SnapshotStore<NotificationSettings>;
export interface AttentionStore extends SnapshotStore<AttentionState> {
    put(entry: AttentionEntry): void;
    clear(sessionId: string): void;
    retain(sessionIds: ReadonlySet<string>): void;
    filter(settings: NotificationSettings): void;
}
export declare function createAttentionStore(): AttentionStore;
