import type { AttentionEntry, NotificationReason, NotifyProjectionValue } from '../contract.ts';
export declare const CONVERGENCE_WINDOW_MS = 250;
export declare function projectionAdvance(previousTurn: number | undefined, projection: NotifyProjectionValue | undefined): {
    readonly turn: number;
    readonly fresh: boolean;
};
export interface CompletionSessionSummary {
    readonly id: string;
    readonly displayTitle: string;
    readonly parentId?: string;
    readonly origin?: 'subagent';
    readonly running: boolean;
    readonly projectionValues?: {
        readonly dshNotify?: NotifyProjectionValue;
        readonly goal?: {
            readonly goal?: {
                readonly phase?: string;
            };
        } | null;
    };
}
export interface CompletionJobSummary {
    readonly id: string;
    readonly status: string;
}
export interface CompletionListSnapshot {
    readonly ids: readonly string[];
    readonly byId: Readonly<Record<string, CompletionSessionSummary | undefined>>;
    readonly jobsBySession: Readonly<Record<string, readonly CompletionJobSummary[] | undefined>>;
    readonly phase?: string;
}
export interface CompletionCandidate {
    readonly sessionId: string;
    readonly turn: number;
    readonly reason: NotificationReason;
    readonly title: string;
    readonly body: string;
    readonly startedAsyncDelegation: boolean;
}
export interface CompletionState {
    readonly observed: Readonly<Record<string, number>>;
    readonly pending: Readonly<Record<string, CompletionCandidate>>;
    readonly published: Readonly<Record<string, number>>;
    readonly settling: Readonly<Record<string, {
        readonly turn: number;
        readonly readyAt: number;
    }>>;
}
export interface CompletionAdvance {
    readonly state: CompletionState;
    readonly published: readonly AttentionEntry[];
    readonly nextCheckAt?: number;
}
export declare function seedCompletionState(snapshot: CompletionListSnapshot): CompletionState;
export declare function advanceCompletionState(previous: CompletionState, snapshot: CompletionListSnapshot, now: number): CompletionAdvance;
type TimerHandle = ReturnType<typeof setTimeout>;
export interface CompletionRunnerOptions {
    readonly publish: (entry: AttentionEntry) => void;
    readonly now?: () => number;
    readonly setTimer?: (callback: () => void, delayMs: number) => TimerHandle;
    readonly clearTimer?: (handle: TimerHandle) => void;
}
export declare class CompletionRunner {
    private state;
    private snapshot;
    private readonly publish;
    private readonly now;
    private readonly setTimer;
    private readonly clearTimer;
    private timer;
    private disposed;
    constructor(snapshot: CompletionListSnapshot, options: CompletionRunnerOptions);
    update(snapshot: CompletionListSnapshot): void;
    dispose(): void;
    private evaluate;
    private cancelTimer;
}
export {};
