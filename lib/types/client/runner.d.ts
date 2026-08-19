import type { NotifyProjectionValue } from '../contract.ts';
export declare function projectionAdvance(previousTurn: number | undefined, projection: NotifyProjectionValue | undefined): {
    readonly turn: number;
    readonly fresh: boolean;
};
