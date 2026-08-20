import type { Context } from '@deepseek-ai/cordis';
import type { Agent, AgentRegistry, AgentStatus } from '@deepseek-ai/dsh-agent';
import type { JobRegistry, JobSnapshot } from '@deepseek-ai/dsh-jobs';
import type { Session, SessionEvent, SessionHeader, SessionId, SessionStore } from '@deepseek-ai/dsh-session';
import type { NotificationReason } from './contract.ts';
export declare const HOST_CONVERGENCE_WINDOW_MS = 250;
type TimerHandle = ReturnType<typeof setTimeout>;
export interface HostNotificationCandidate {
    readonly session: Session;
    readonly turn: number;
    readonly reason: NotificationReason;
    readonly body: string;
    readonly startedAsyncDelegation: boolean;
}
interface AgentsFace {
    get(id: SessionId): Agent | undefined;
    list(): Agent[];
}
interface JobsFace {
    list(owner?: Agent): JobSnapshot[];
    onJobsChanged(listener: (owner: Agent | undefined) => void): () => void;
}
interface SessionsFace {
    get(id: SessionId): Session | undefined;
    list(): Session[];
}
export interface HostNotificationCoordinatorOptions {
    readonly agents: AgentsFace;
    readonly jobs: JobsFace;
    readonly sessions: SessionsFace;
    readonly publish: (candidate: HostNotificationCandidate, signal: AbortSignal) => void | PromiseLike<void>;
    readonly maxBodyChars?: number;
    readonly setTimer?: (callback: () => void, delayMs: number) => TimerHandle;
    readonly clearTimer?: (handle: TimerHandle) => void;
    readonly onError?: (error: Error) => void;
}
export declare function isTopLevelAgentSession(header: SessionHeader): boolean;
export declare function hostNotificationReason(session: Session, event: SessionEvent<'turn/end'>): NotificationReason | undefined;
export declare class HostNotificationCoordinator {
    private readonly agents;
    private readonly jobs;
    private readonly sessions;
    private readonly publish;
    private readonly maxBodyChars;
    private readonly setTimer;
    private readonly clearTimer;
    private readonly onError;
    private readonly pending;
    private readonly published;
    private readonly windows;
    private readonly publishing;
    private readonly statuses;
    private disposed;
    constructor(options: HostNotificationCoordinatorOptions);
    attach(ctx: Context): () => void;
    handleSessionEvent(session: Session, event: SessionEvent): void;
    handleAgentStatus(agent: Agent, status: AgentStatus): void;
    handleAgentCreated(agent: Agent): void;
    handleAgentDisposed(agent: Agent): void;
    handleJobsChanged(owner: Agent | undefined): void;
    handleSessionDisposed(session: Session): void;
    dispose(): void;
    private reconsiderTaskFor;
    private taskRoot;
    private isSubagentDescendant;
    private taskAgents;
    private statusOf;
    private eligible;
    private evaluate;
    private beginPublish;
    private finishPublish;
    private cancelTask;
    private invalidateTask;
    private cancelPublishing;
    private cancelWindow;
}
export type HostAgentRegistry = Pick<AgentRegistry, 'get' | 'list'>;
export type HostJobRegistry = Pick<JobRegistry, 'list' | 'onJobsChanged'>;
export type HostSessionStore = Pick<SessionStore, 'get' | 'list'>;
export {};
