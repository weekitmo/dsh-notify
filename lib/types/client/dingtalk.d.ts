import type { DingTalkPublicSettings, DingTalkSettingsUpdate } from '../contract.ts';
export declare function loadDingTalkSettings(): Promise<DingTalkPublicSettings>;
export declare function saveDingTalkSettings(update: DingTalkSettingsUpdate): Promise<DingTalkPublicSettings>;
export declare function sendDingTalkTest(): Promise<void>;
