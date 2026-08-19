import type { IncomingMessage, ServerResponse } from 'node:http';
import type { DingTalkNotification, DingTalkPublicSettings, DingTalkSettingsUpdate } from './contract.ts';
export interface DingTalkStoredSettings {
    readonly accessToken: string;
    readonly signingSecret: string;
    readonly notifyCompleted: boolean;
    readonly notifyFailed: boolean;
    readonly quietHoursEnabled: boolean;
    readonly quietHoursStart: string;
    readonly quietHoursEnd: string;
    readonly notifyMissed: boolean;
}
export interface MissedMessage extends DingTalkNotification {
    readonly capturedAt: string;
}
export interface MissedState {
    readonly messages: readonly MissedMessage[];
    readonly omitted: number;
    readonly digest: boolean;
}
export declare const DEFAULT_DINGTALK_SETTINGS: DingTalkStoredSettings;
export declare function parseClock(value: unknown): string;
export declare function normalizeDingTalkSettings(value: unknown): DingTalkStoredSettings;
export declare function publicDingTalkSettings(value: DingTalkStoredSettings): DingTalkPublicSettings;
export declare function isQuietAt(now: Date, start: string, end: string): boolean;
export declare function millisecondsUntilQuietEnd(now: Date, start: string, end: string): number;
export declare function dingTalkSign(secret: string, timestamp: number): string;
export declare function formatNotification(message: DingTalkNotification): {
    title: string;
    text: string;
};
export declare function formatMissedDigest(state: MissedState, now: Date): {
    title: string;
    text: string;
};
export interface DingTalkServiceOptions {
    readonly root?: string;
    readonly webhookUrl?: string;
    readonly fetch?: typeof fetch;
    readonly now?: () => Date;
    readonly warn?: (message: string, error?: unknown) => void;
    readonly platform?: NodeJS.Platform;
}
export declare class DingTalkService {
    private readonly root;
    private readonly settingsPath;
    private readonly queuePath;
    private readonly webhookUrl;
    private readonly request;
    private readonly now;
    private readonly warn;
    private readonly platform;
    private settings;
    private missed;
    private readonly recent;
    private timer;
    private serial;
    constructor(options?: DingTalkServiceOptions);
    initialize(): Promise<void>;
    dispose(): void;
    getSettings(): DingTalkPublicSettings;
    enabledFor(reason: DingTalkNotification['reason']): boolean;
    updateSettings(update: DingTalkSettingsUpdate): Promise<DingTalkPublicSettings>;
    notify(message: DingTalkNotification): Promise<'sent' | 'queued' | 'ignored' | 'duplicate'>;
    sendTest(): Promise<void>;
    private configured;
    private reasonEnabled;
    private hasMissed;
    private enqueue;
    private remember;
    private exclusive;
    private send;
    private flushPending;
    private scheduleFlush;
    private replaceMissed;
    private readJson;
    private saveJson;
}
export declare function trustedDingTalkRequest(req: Pick<IncomingMessage, 'headers' | 'socket' | 'method'>): boolean;
export declare function createDingTalkRoute(service: DingTalkService): (req: IncomingMessage, res: ServerResponse) => Promise<void>;
