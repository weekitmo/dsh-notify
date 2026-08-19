/** Keeps the plugin settings nav row marked with a bell as the shell re-renders. */
export declare class SettingsNavBell {
    private readonly root;
    private readonly label;
    private observer;
    constructor(root: Document | undefined, label: () => string);
    start(): void;
    dispose(): void;
    private sync;
}
