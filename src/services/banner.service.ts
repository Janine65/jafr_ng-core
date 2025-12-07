import { Injectable } from '@angular/core';

import { BannerConfig, ErrorBannerConfig } from '../interfaces/banner.interface';

// Interface to avoid circular dependency
interface BannerComponent {
    show(config: BannerConfig): void;
    hide(): void;
    registerError(config?: ErrorBannerConfig): boolean;
    showSuccess(title: string, message: string, options?: Partial<BannerConfig>): void;
    showInfo(title: string, message: string, options?: Partial<BannerConfig>): void;
    showWarning(title: string, message: string, options?: Partial<BannerConfig>): void;
    showError(title: string, message: string, options?: Partial<BannerConfig>): void;
    isActive(): boolean;
    getErrorCount(): number;
}

/**
 * Service that provides access to the banner component functionality.
 * Acts as a bridge between other services/interceptors and the banner component.
 */
@Injectable({
    providedIn: 'root'
})
export class BannerService {
    private bannerComponent: BannerComponent | null = null;

    /**
     * Register the banner component instance
     */
    registerBannerComponent(component: BannerComponent): void {
        this.bannerComponent = component;
        console.log('[BannerService] Banner component registered');
    }

    /**
     * Unregister the banner component instance
     */
    unregisterBannerComponent(): void {
        console.log('[BannerService] Banner component unregistered');
        this.bannerComponent = null;
    }

    /**
     * Show a banner with the specified configuration
     */
    show(config: BannerConfig): void {
        console.log('[BannerService] show() called with config:', config);
        if (this.bannerComponent) {
            this.bannerComponent.show(config);
        } else {
            console.warn('BannerService: No banner component registered. Make sure app-banner component is in your template.');
        }
    }

    /**
     * Hide the current banner
     */
    hide(): void {
        if (this.bannerComponent) {
            this.bannerComponent.hide();
        }
    }

    /**
     * Register an error for error banner logic.
     * Returns true if banner should be shown and individual toasts should be silenced.
     */
    registerError(config?: ErrorBannerConfig): boolean {
        console.log('[BannerService] registerError() called with config:', config);
        if (this.bannerComponent) {
            const result = this.bannerComponent.registerError(config);
            console.log('[BannerService] registerError() result (should silence toast):', result);
            return result;
        }
        console.warn('[BannerService] registerError() - No banner component registered');
        return false;
    }

    /**
     * Show a success banner
     */
    showSuccess(title: string, message: string, options?: Partial<BannerConfig>): void {
        if (this.bannerComponent) {
            this.bannerComponent.showSuccess(title, message, options);
        }
    }

    /**
     * Show an info banner
     */
    showInfo(title: string, message: string, options?: Partial<BannerConfig>): void {
        if (this.bannerComponent) {
            this.bannerComponent.showInfo(title, message, options);
        }
    }

    /**
     * Show a warning banner
     */
    showWarning(title: string, message: string, options?: Partial<BannerConfig>): void {
        if (this.bannerComponent) {
            this.bannerComponent.showWarning(title, message, options);
        }
    }

    /**
     * Show an error banner
     */
    showError(title: string, message: string, options?: Partial<BannerConfig>): void {
        if (this.bannerComponent) {
            this.bannerComponent.showError(title, message, options);
        }
    }

    /**
     * Check if banner is currently active
     */
    isActive(): boolean {
        return this.bannerComponent ? this.bannerComponent.isActive() : false;
    }

    /**
     * Get current error count
     */
    getErrorCount(): number {
        return this.bannerComponent ? this.bannerComponent.getErrorCount() : 0;
    }

    // Legacy methods for backward compatibility
    /**
     * @deprecated Use hide() instead
     */
    hideBanner(): void {
        this.hide();
    }

    /**
     * @deprecated Use isActive() instead
     */
    isBannerActive(): boolean {
        return this.isActive();
    }

    /**
     * @deprecated Use getErrorCount() instead
     */
    errorCount(): number {
        return this.getErrorCount();
    }

    /**
     * @deprecated Use isActive() instead
     */
    showBanner(): boolean {
        return this.isActive();
    }
}
