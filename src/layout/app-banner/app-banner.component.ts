import { ButtonModule } from 'primeng/button';

import { CommonModule } from '@angular/common';
import { Component, ElementRef, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import {
    BannerConfig, BannerState, BannerType, ErrorBannerConfig
} from '../../interfaces/banner.interface';
import { BannerService } from '../../services/banner.service';

/**
 * Flexible banner component that can display different types of messages.
 * Supports error tracking, auto-hide, manual close, and custom styling.
 */
@Component({
    selector: 'app-banner',
    standalone: true,
    imports: [CommonModule, TranslateModule, ButtonModule],
    templateUrl: './app-banner.component.html',
    styles: [
        `
            :host {
                display: block;
                width: 100%;
            }
        `
    ]
})
export class AppBannerComponent implements OnInit, OnDestroy {
    private bannerService = inject(BannerService);
    private elementRef = inject(ElementRef);
    // Default configurations for different banner types
    private readonly DEFAULT_CONFIGS: Record<BannerType, Partial<BannerConfig>> = {
        error: {
            icon: 'pi pi-exclamation-triangle',
            autoHide: true,
            autoHideTimeout: 60000,
            closable: true
        },
        warning: {
            icon: 'pi pi-exclamation-triangle',
            autoHide: false,
            closable: true
        },
        info: {
            icon: 'pi pi-info-circle',
            autoHide: false,
            closable: true
        },
        success: {
            icon: 'pi pi-check-circle',
            autoHide: true,
            autoHideTimeout: 5000,
            closable: true
        }
    };

    // Default error banner settings
    private readonly DEFAULT_ERROR_THRESHOLD = 5;
    private readonly DEFAULT_TIME_WINDOW_MS = 10000;

    // Reactive state
    public readonly bannerState = signal<BannerState>({
        isVisible: false,
        config: null,
        errorCount: 0,
        errorTimestamps: []
    });

    private autoHideTimer: any = null;

    /**
     * Show a banner with the specified configuration
     */
    show(config: BannerConfig): void {
        console.log('[AppBannerComponent] show() called with config:', config);
        const defaultConfig = this.DEFAULT_CONFIGS[config.type];
        const mergedConfig: BannerConfig = {
            ...defaultConfig,
            ...config,
            id: config.id || `banner-${Date.now()}`
        };

        console.log('[AppBannerComponent] Merged config:', mergedConfig);
        console.log('[AppBannerComponent] Setting banner visible with config');

        this.bannerState.update((state) => ({
            ...state,
            isVisible: true,
            config: mergedConfig
        }));

        console.log('[AppBannerComponent] Banner state after update:', this.bannerState());

        this.setupAutoHide(mergedConfig);

        // Add padding to body to prevent content overlap with fixed banner
        setTimeout(() => this.adjustBodyPadding(), 0);
    }

    /**
     * Hide the banner and reset state
     */
    hide(): void {
        this.bannerState.update((state) => ({
            ...state,
            isVisible: false,
            config: null,
            errorCount: 0,
            errorTimestamps: []
        }));

        this.clearAutoHideTimer();

        // Remove body padding when banner is hidden
        this.adjustBodyPadding();
    }

    /**
     * Adjust body padding based on banner visibility and height
     */
    private adjustBodyPadding(): void {
        const banner = this.elementRef.nativeElement.querySelector('div');
        if (this.bannerState().isVisible && banner) {
            const bannerHeight = banner.offsetHeight;
            document.body.style.paddingTop = `${bannerHeight}px`;
            console.log('[AppBannerComponent] Set body padding-top to:', bannerHeight);
        } else {
            document.body.style.paddingTop = '0';
            console.log('[AppBannerComponent] Removed body padding-top');
        }
    }

    /**
     * Register an error for error banner logic.
     * Returns true if banner should be shown and individual toasts should be silenced.
     */
    registerError(config?: ErrorBannerConfig): boolean {
        console.log('[AppBannerComponent] registerError() called with config:', config);
        const errorThreshold = config?.errorThreshold ?? this.DEFAULT_ERROR_THRESHOLD;
        const timeWindow = config?.timeWindow ?? this.DEFAULT_TIME_WINDOW_MS;
        const now = Date.now();

        const currentState = this.bannerState();

        // Remove timestamps outside the time window
        const validTimestamps = currentState.errorTimestamps.filter((timestamp) => now - timestamp < timeWindow);

        // Add current error
        validTimestamps.push(now);

        console.log('[AppBannerComponent] Valid error timestamps:', validTimestamps.length, '/', errorThreshold);

        // Update state with new error count
        this.bannerState.update((state) => ({
            ...state,
            errorCount: validTimestamps.length,
            errorTimestamps: validTimestamps
        }));

        // Check if we should show the banner
        if (validTimestamps.length >= errorThreshold) {
            console.log('[AppBannerComponent] Error threshold reached! Showing banner and silencing toasts');
            const errorConfig: BannerConfig = {
                type: 'error',
                title: config?.title || 'core.backendErrorBanner.title',
                message: config?.message || 'core.backendErrorBanner.message',
                icon: config?.icon,
                customClasses: config?.customClasses,
                autoHide: config?.autoHide,
                autoHideTimeout: config?.autoHideTimeout,
                closable: config?.closable,
                id: config?.id
            };

            this.show(errorConfig);
            return true; // Silence individual toast messages
        }

        console.log('[AppBannerComponent] Error threshold not reached yet, showing individual toast');
        return false; // Show individual toast messages
    }

    /**
     * Show a success banner
     */
    showSuccess(title: string, message: string, options?: Partial<BannerConfig>): void {
        this.show({
            type: 'success',
            title,
            message,
            ...options
        });
    }

    /**
     * Show an info banner
     */
    showInfo(title: string, message: string, options?: Partial<BannerConfig>): void {
        this.show({
            type: 'info',
            title,
            message,
            ...options
        });
    }

    /**
     * Show a warning banner
     */
    showWarning(title: string, message: string, options?: Partial<BannerConfig>): void {
        this.show({
            type: 'warning',
            title,
            message,
            ...options
        });
    }

    /**
     * Show an error banner
     */
    showError(title: string, message: string, options?: Partial<BannerConfig>): void {
        this.show({
            type: 'error',
            title,
            message,
            ...options
        });
    }

    /**
     * Check if banner is currently active
     */
    isActive(): boolean {
        return this.bannerState().isVisible;
    }

    /**
     * Get current error count
     */
    getErrorCount(): number {
        return this.bannerState().errorCount;
    }

    /**
     * Get current banner configuration
     */
    getCurrentConfig(): BannerConfig | null {
        return this.bannerState().config;
    }

    /**
     * Get CSS classes for the banner based on type
     */
    getBannerClasses(): string {
        const config = this.bannerState().config;
        if (!config) return '';

        const baseClasses = 'fixed top-0 left-0 right-0 w-full text-white shadow-lg';

        return `${baseClasses} ${config.customClasses || ''}`;
    }

    /**
     * Get inline styles for the banner based on type
     */
    getBannerStyles(): Record<string, string> {
        const config = this.bannerState().config;
        if (!config) return {};

        const colorStyles = {
            error: {
                background: 'linear-gradient(to right, #dc2626, #b91c1c)',
                color: '#ffffff',
                zIndex: '2147483647' // Maximum safe z-index value
            },
            warning: {
                background: 'linear-gradient(to right, #ea580c, #c2410c)',
                color: '#ffffff',
                zIndex: '2147483647'
            },
            info: {
                background: 'linear-gradient(to right, #2563eb, #1d4ed8)',
                color: '#ffffff',
                zIndex: '2147483647'
            },
            success: {
                background: 'linear-gradient(to right, #16a34a, #15803d)',
                color: '#ffffff',
                zIndex: '2147483647'
            }
        };

        return colorStyles[config.type];
    }

    /**
     * Set up auto-hide timer if configured
     */
    private setupAutoHide(config: BannerConfig): void {
        this.clearAutoHideTimer();

        if (config.autoHide && config.autoHideTimeout) {
            this.autoHideTimer = setTimeout(() => {
                this.hide();
            }, config.autoHideTimeout);
        }
    }

    /**
     * Clear auto-hide timer
     */
    private clearAutoHideTimer(): void {
        if (this.autoHideTimer) {
            clearTimeout(this.autoHideTimer);
            this.autoHideTimer = null;
        }
    }

    /**
     * Register this component with the banner service on init
     */
    ngOnInit(): void {
        console.log('[AppBannerComponent] Initializing and registering with banner service');
        this.bannerService.registerBannerComponent(this);
    }

    /**
     * Unregister this component from the banner service on destroy
     */
    ngOnDestroy(): void {
        this.bannerService.unregisterBannerComponent();
        this.clearAutoHideTimer();
    }
}
