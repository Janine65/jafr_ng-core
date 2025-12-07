import { firstValueFrom } from 'rxjs';

import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { DEV_CONFIG } from '../config/tokens';
import { LogFactoryService } from '../factories/logger.factory';
import { CoreEnvironment } from '../interfaces/environment.interface';
import { ProxyStatus, ProxySwitchResponse } from '../interfaces/proxy.interface';
import { AvailableStage } from '../interfaces/stage.interface';
import { EnvironmentService } from './environment.service';
import { BrowserStorageService } from './storage.service';

@Injectable({
    providedIn: 'root'
})
export class DeveloperService {
    private logger = inject(LogFactoryService).createLogger('DeveloperService');
    private storageService = inject(BrowserStorageService);
    private http = inject(HttpClient);
    private devConfig = inject(DEV_CONFIG);

    private readonly STORAGE_KEY = 'developer-environment-override';
    private readonly PROXY_SWITCH_ENDPOINT = '/__proxy-switch';

    constructor(private environmentService: EnvironmentService) {}

    /**
     * Get all available stages for switching
     */
    getAvailableStages(): AvailableStage[] {
        return this.devConfig.AVAILABLE_STAGES;
    }

    /**
     * Get the currently active stage
     */
    getCurrentStage(): AvailableStage | undefined {
        // Check if there's a developer override first
        const override = this.getDeveloperCoreEnvironmentOverride();
        if (override && override.stage) {
            const overrideStage = this.devConfig.AVAILABLE_STAGES.find((stage) => stage.stage.toString() === override.stage?.toString());
            if (overrideStage) {
                return overrideStage;
            }
        }

        // Fall back to environment service
        const currentStage = this.environmentService.stage;
        return this.devConfig.AVAILABLE_STAGES.find((stage) => stage.stage === currentStage);
    }

    /**
     * Check if developer features should be available
     */
    isDeveloperModeEnabled(): boolean {
        return this.environmentService.isDevelopment() || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.search.includes('dev=true');
    }

    /**
     * Switch to a different environment stage
     */
    async switchToStage(stageKey: string): Promise<void> {
        try {
            // Load the environment configuration for the selected stage
            const config = await this.loadCoreEnvironmentConfig(stageKey);

            // Update the proxy target (for development mode with proxy)
            await this.switchProxyTarget(stageKey);

            // Update the current environment
            this.environmentService.updateFromRuntimeConfig(config);

            // Also update the runtime config file for persistence across reloads
            await this.updateRuntimeConfig(config);

            // Reload the application to ensure all services pick up the new config
            window.location.reload();
        } catch (error) {
            console.error('Failed to switch environment stage:', error);
            throw error;
        }
    }

    /**
     * Switch the proxy target dynamically (for development mode)
     */
    private async switchProxyTarget(stageKey: string): Promise<void> {
        // Only attempt to switch proxy in development mode
        if (!this.isDeveloperModeEnabled()) {
            this.logger.debug('Developer mode not enabled, skipping proxy switch');
            return;
        }

        try {
            // Generate a unique request ID based on timestamp
            // The proxy will only accept requests with IDs newer than the last one
            const requestId = Date.now();
            const url = `${this.PROXY_SWITCH_ENDPOINT}?target=${stageKey}&requestId=${requestId}`;

            this.logger.debug(`Making proxy switch request: ${url}`);

            const result = await firstValueFrom(this.http.get<ProxySwitchResponse>(url));

            this.logger.debug('Proxy switch response:', result);

            if (result?.success) {
                this.logger.log(`Proxy target switched to: ${result.stage} (${result.target})`);
            } else if (result?.error) {
                this.logger.warn(`Proxy switch failed: ${result.error}`);
                this.logger.warn(`Available stages: ${result.availableStages?.join(', ')}`);
            }
        } catch (error) {
            // In production or if proxy endpoint doesn't exist, silently continue
            this.logger.debug('Proxy target switching not available (likely not in dev mode)');
            this.logger.error('Proxy switching error:', error);
        }
    }

    /**
     * Load environment configuration from the assets/config folder
     */
    private async loadCoreEnvironmentConfig(stageKey: string): Promise<Partial<CoreEnvironment>> {
        const configUrl = `/assets/config/environment.${stageKey}.json`;

        try {
            const response = await fetch(configUrl);

            if (!response.ok) {
                throw new Error(`Failed to load environment config: HTTP ${response.status}`);
            }

            const config = await response.json();
            this.logger.debug(`Loaded environment configuration for stage: ${stageKey}`, config);

            return config;
        } catch (error) {
            console.error(`Failed to load environment config for stage ${stageKey}:`, error);
            throw error;
        }
    }

    /**
     * Update the runtime configuration
     * Store in sessionStorage so it only persists for the current browser session
     */
    private async updateRuntimeConfig(config: Partial<CoreEnvironment>): Promise<void> {
        const success = this.storageService.setSession(this.STORAGE_KEY, config);
        if (success) {
            this.logger.debug('Runtime configuration stored for current session only');
        } else {
            console.warn('Failed to store runtime configuration');
            // Don't throw here - the environment switch should still work for this session
        }
    }

    /**
     * Get the stored developer environment override
     */
    getDeveloperCoreEnvironmentOverride(): Partial<CoreEnvironment> | null {
        return this.storageService.getSession<Partial<CoreEnvironment>>(this.STORAGE_KEY);
    }

    /**
     * Clear the developer environment override and reload with default config
     */
    clearDeveloperEnvironmentOverride(): void {
        this.storageService.removeSession(this.STORAGE_KEY);
        this.logger.debug('🔄 Cleared developer environment override, reloading with default config...');
        setTimeout(() => {
            window.location.reload();
        }, 500);
    }

    /**
     * Get the current proxy target status (for development mode)
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async getProxyStatus(): Promise<any> {
        if (!this.isDeveloperModeEnabled()) {
            return { available: false, reason: 'Not in developer mode' };
        }

        try {
            const status = await firstValueFrom(this.http.get<ProxyStatus>(this.PROXY_SWITCH_ENDPOINT));
            return {
                available: true,
                current: status?.current,
                target: status?.target,
                availableStages: status?.availableStages
            };
        } catch {
            return { available: false, reason: 'Proxy endpoint not available' };
        }
    }

    /**
     * Get environment information for debugging
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async getEnvironmentInfo(): Promise<any> {
        const proxyStatus = await this.getProxyStatus();

        return {
            current: this.getCurrentStage(),
            available: this.getAvailableStages(),
            environment: this.environmentService.environment,
            hostname: window.location.hostname,
            protocol: window.location.protocol,
            isDeveloperMode: this.isDeveloperModeEnabled(),
            proxy: proxyStatus
        };
    }
}
