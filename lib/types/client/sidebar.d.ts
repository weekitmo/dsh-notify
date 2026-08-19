import type { AttentionEntry } from '../contract.ts';
export declare class SidebarIndicators {
    private readonly root;
    private entries;
    private enabled;
    private observer;
    private frame;
    private rendering;
    private warnedTitles;
    constructor(root?: Document);
    start(): void;
    render(entries: readonly AttentionEntry[], enabled: boolean): void;
    dispose(): void;
    private scheduleRender;
    private renderNow;
    private mountIndicators;
}
