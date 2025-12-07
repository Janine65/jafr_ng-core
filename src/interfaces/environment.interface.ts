import { LogLevel } from './loglevel.interface';
import { Stage } from './stage.interface';

/**
 * Core environment interface that contains only generic application settings.
 * App-specific URLs and configurations should be handled by application-specific providers.
 */
export interface CoreEnvironment {
    stage: Stage;
    apiUrl: string;
    useProxy?: boolean;
    keycloakUrl?: string;
    keycloakRealm?: string;
    keycloakClientId?: string;
    keycloakOnLoad?: 'login-required' | 'check-sso';
    keycloakPkceMethod?: 'S256';
    logLevel: LogLevel;
}

/**
 * Extended environment interface for applications that need additional URLs.
 * Applications can extend this interface with their specific URL requirements.
 */
export interface ExtendedEnvironment extends CoreEnvironment {
    [key: string]: any; // Allow additional properties
}
