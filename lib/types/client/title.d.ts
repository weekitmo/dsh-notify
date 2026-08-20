import type { AttentionEntry, NotificationReason, TitleAnimation } from '../contract.ts';
export type ReasonLabel = (reason: NotificationReason, count: number) => string;
export interface WorkspaceSessionTitleSummary {
    readonly displayTitle: string;
    readonly title?: string;
    readonly cwd?: string;
    readonly origin?: 'subagent';
    readonly blank: boolean;
    readonly updatedAt: number;
}
export declare function recentWorkspaceSessionTitle(ids: readonly string[], byId: Readonly<Record<string, WorkspaceSessionTitleSummary | undefined>>): string | undefined;
export declare function aggregatedTitle(entries: readonly AttentionEntry[], label: ReasonLabel, runningCount?: number, runningLabel?: (count: number) => string): string;
export declare function productTitleOf(renderedTitle: string, currentSessionTitle: string | undefined): string;
export declare function shellTitleOf(productTitle: string, currentSessionTitle: string | undefined): string;
export interface TitleDocument {
    title: string;
}
export declare class TitleNotifier {
    private readonly target;
    private readonly schedule;
    private readonly cancel;
    private readonly requestFrame;
    private readonly cancelFrame;
    private readonly hidden;
    private readonly now;
    private baseTitle;
    private timer;
    private animationFrame;
    private text;
    private mode;
    private spinning;
    private animateText;
    private offset;
    private frame;
    private lastStepAt;
    private scheduler;
    constructor(target?: TitleDocument, schedule?: (callback: () => void, ms: number) => number, cancel?: (id: number) => void, requestFrame?: (callback: FrameRequestCallback) => number, cancelFrame?: (id: number) => void, hidden?: () => boolean, now?: () => number);
    render(text: string, mode: TitleAnimation, spinning?: boolean, animateText?: boolean, baseTitle?: string): void;
    dispose(restoreTitle?: string): void;
    private write;
    private stepDuration;
    private advance;
    private scheduleNext;
    private tick;
    private stopAnimation;
}
