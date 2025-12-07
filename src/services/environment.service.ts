import { BehaviorSubject, Observable } from 'rxjs';

import { inject, Injectable } from '@angular/core';

import { VERSION_DATA_PROVIDER } from '../config/tokens';
import { CoreEnvironment } from '../interfaces/environment.interface';
import { LogLevel } from '../interfaces/loglevel.interface';
import { Stage } from '../interfaces/stage.interface';

/**
 * Minimal bootstrap configuration
 * This allows the app to start and display loading/error screens
 * The actual configuration is loaded dynamically via APP_INITIALIZER
 */
const BOOTSTRAP_CONFIG: CoreEnvironment = {
    stage: Stage.BOOTSTRAP,
    logLevel: LogLevel.DEBUG,
    apiUrl: ''
};

@Injectable({
    providedIn: 'root'
})
export class EnvironmentService {
    private versionDataProvider = inject(VERSION_DATA_PROVIDER);
    private _environment: CoreEnvironment;
    private environmentSubject = new BehaviorSubject<CoreEnvironment>(BOOTSTRAP_CONFIG);

    /**
     * Observable of environment changes
     */
    environment$ = this.environmentSubject.asObservable();

    constructor() {
        // Start with minimal bootstrap config
        // Runtime config will be loaded via APP_INITIALIZER
        this._environment = { ...BOOTSTRAP_CONFIG };
    }

    /**
     * Updates the environment configuration from runtime config.
     * Called by APP_INITIALIZER after runtime config is loaded.
     */
    updateFromRuntimeConfig(runtimeConfig: Partial<CoreEnvironment>): void {
        console.log('Loading runtime environment config for stage:', this._environment.stage);
        this._environment = {
            ...BOOTSTRAP_CONFIG,
            ...runtimeConfig,
            stage: this.parseStage(runtimeConfig.stage as string),
            logLevel: this.parseLogLevel(runtimeConfig.logLevel as string)
        };
        console.log('Loaded runtime environment config for stage:', this._environment.stage, 'with runtime config:', runtimeConfig);

        // Notify subscribers of environment change
        this.environmentSubject.next(this._environment);
    }

    get environment(): CoreEnvironment {
        return this._environment;
    }

    get stage(): Stage {
        return this._environment.stage;
    }

    get apiUrl(): string {
        return this._environment.apiUrl;
    }

    get keycloakUrl(): string {
        return this._environment.keycloakUrl || '';
    }

    get keycloakRealm(): string {
        return this._environment.keycloakRealm || '';
    }

    get keycloakClientId(): string {
        return this._environment.keycloakClientId || '';
    }

    get keycloakOnLoad(): string {
        return this._environment.keycloakOnLoad || 'check-sso';
    }

    get keycloakPkceMethod(): string {
        return this._environment.keycloakPkceMethod || 'S256';
    }

    get logLevel(): LogLevel {
        return this._environment.logLevel;
    }

    isProduction(): boolean {
        return this._environment.stage === Stage.PROD;
    }

    isDevelopment(): boolean {
        return this._environment.stage != Stage.PROD;
    }

    isMock(): boolean {
        return this._environment.stage === Stage.MOCK;
    }

    isSystemTest(): boolean {
        return this._environment.stage === Stage.SYST;
    }

    /**
     * Gets the application version via injected version data provider
     */
    getAppVersion(): string {
        return this.versionDataProvider.getAppVersion();
    }

    /**
     * Retrieves all version information via injected version data provider.
     * The actual implementation depends on the application-specific provider.
     */
    getAllVersions(): Observable<any> {
        return this.versionDataProvider.getAllVersions();
    }

    private parseStage(stage: string): Stage {
        switch (stage?.toUpperCase()) {
            case 'PROD':
                return Stage.PROD;
            case 'SYST':
                return Stage.SYST;
            case 'DEV':
                return Stage.DEV;
            case 'MOCK':
                return Stage.MOCK;
            case 'ENTW':
                return Stage.ENTW;
            case 'INTG':
                return Stage.INTG;
            case 'GATE':
                return Stage.GATE;
            default:
                return Stage.DEV;
        }
    }

    private parseLogLevel(logLevel: string): LogLevel {
        switch (logLevel?.toUpperCase()) {
            case 'DEBUG':
                return LogLevel.DEBUG;
            case 'INFO':
                return LogLevel.INFO;
            case 'WARN':
                return LogLevel.WARN;
            case 'ERROR':
                return LogLevel.ERROR;
            default:
                return LogLevel.INFO;
        }
    }
}
