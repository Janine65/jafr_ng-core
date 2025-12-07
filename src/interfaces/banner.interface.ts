export type BannerType = 'error' | 'warning' | 'info' | 'success';

export type BannerSeverity = 'danger' | 'warn' | 'info' | 'success';

export interface BannerConfig {
    /** Type of banner which determines default styling */
    type: BannerType;
    /** Main title/header text */
    title: string;
    /** Detailed message text */
    message: string;
    /** Icon class (PrimeIcons) */
    icon?: string;
    /** Custom CSS classes for styling */
    customClasses?: string;
    /** Whether the banner should auto-hide after a timeout */
    autoHide?: boolean;
    /** Auto-hide timeout in milliseconds (default: 60000) */
    autoHideTimeout?: number;
    /** Whether the banner can be manually closed */
    closable?: boolean;
    /** Unique identifier for the banner */
    id?: string;
}

export interface ErrorBannerConfig extends Omit<BannerConfig, 'type'> {
    type: 'error';
    /** Error threshold before showing banner */
    errorThreshold?: number;
    /** Time window for counting errors (ms) */
    timeWindow?: number;
}

export interface BannerState {
    /** Whether banner is currently visible */
    isVisible: boolean;
    /** Current banner configuration */
    config: BannerConfig | null;
    /** Current error count (for error banners) */
    errorCount: number;
    /** Timestamps of recent errors */
    errorTimestamps: number[];
}
