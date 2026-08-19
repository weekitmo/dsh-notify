import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import type { SnapshotStore } from '@deepseek-ai/dsh-client-runtime/client';
import type { NotificationSettings } from '../contract.ts';
export interface SettingsInjected {
    hooks: {
        settings: SnapshotStore<NotificationSettings>;
    };
    set: (patch: Partial<NotificationSettings>) => void;
    requestPermission: () => Promise<NotificationPermission>;
    sendTest: () => void;
}
type Props = PropsRuntime<'settings.section'> & InjectFace<SettingsInjected> & PropsLocale<'dsh-notify'>;
export declare function NotifySettingsSection({ useSettings, set, requestPermission, sendTest, t }: Props): import("react").JSX.Element;
export {};
