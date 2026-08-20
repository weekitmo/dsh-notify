import type { Context } from '@deepseek-ai/cordis';
import z from '@deepseek-ai/schemastery';
export declare const name = "dsh-notify";
export declare const inject: string[];
export interface Config {
}
export declare const Config: z<Schemastery.ObjectS<{}>, Schemastery.ObjectT<{}>>;
export declare function apply(ctx: Context, config?: Config): Promise<void>;
