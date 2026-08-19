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
    private baseTitle;
    private timer;
    private text;
    private mode;
    private spinning;
    private animateText;
    private offset;
    private frame;
    constructor(target?: TitleDocument, schedule?: (callback: () => void, ms: number) => number, cancel?: (id: number) => void);
    render(text: string, mode: TitleAnimation, spinning?: boolean, animateText?: boolean, baseTitle?: string): void;
    dispose(restoreTitle?: string): void;
    private write;
    private tick;
    private stopTimer;
}
