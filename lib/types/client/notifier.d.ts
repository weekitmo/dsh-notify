import type { AttentionEntry, NotificationReason, NotificationSettings } from '../contract.ts';
export declare function notificationsApi(): typeof Notification | undefined;
/** Create a browser notification without allowing browser/OS failures to break the client fiber. */
export declare function createNotification(api: typeof Notification, title: string, options: NotificationOptions): Notification | undefined;
export interface ManagedNotification {
    onclick: ((this: Notification, event: Event) => unknown) | null;
    onclose: ((this: Notification, event: Event) => unknown) | null;
    close(): void;
}
export declare class NotificationRegistry {
    private readonly active;
    track(notification: ManagedNotification): void;
    closeAll(): void;
}
export declare function shouldShowSystem(permission: NotificationPermission, settings: NotificationSettings, documentHidden: boolean, completedSessionId: string, currentSessionId: string | undefined): boolean;
export declare function notificationTitleKey(reason: NotificationReason): 'notify.completed' | 'notify.error' | 'notify.aborted' | 'notify.blocked' | 'notify.maxTokens';
export declare function notificationBody(entry: AttentionEntry, fallback: string, maxBodyChars: number): string;
