type SvgLoader = (href: string, signal: AbortSignal) => Promise<string>;
export declare function colorizeFavicon(svg: string): string;
export declare class FaviconNotifier {
    private readonly target;
    private readonly load;
    private link;
    private request;
    private pending;
    private active;
    private controller;
    private dataUrl;
    constructor(target?: Document, load?: SvgLoader);
    render(active: boolean): void;
    dispose(): void;
    private install;
}
export {};
