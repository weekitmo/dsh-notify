import type { AttentionTone, NotificationReason, NotificationSettings } from '../contract.ts';
export declare function asReason(reason: string | undefined): NotificationReason | undefined;
export declare function toneOf(reason: NotificationReason): AttentionTone;
export declare function reasonEnabled(settings: NotificationSettings, reason: NotificationReason): boolean;
