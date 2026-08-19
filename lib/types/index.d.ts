import type { Context } from '@deepseek-ai/cordis';
import z from '@deepseek-ai/schemastery';
export declare const name = "dsh-notify";
export declare const inject: string[];
export interface Config {
    maxBodyChars: number;
}
export declare const Config: z<Schemastery.ObjectS<{
    maxBodyChars: z<number, number>;
}>, Schemastery.ObjectT<{
    maxBodyChars: z<number, number>;
}>>;
export declare function apply(ctx: Context, config?: Config): Promise<void>;
