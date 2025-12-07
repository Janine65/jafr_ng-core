// Avoid static import of 'keycloak-js' to prevent compile-time resolution issues in library builds
type KeycloakConfig = any;
type KeycloakError = any;
type KeycloakInitOptions = any;
type KeycloakLoginOptions = any;
type KeycloakProfile = any;
type KeycloakTokenParsed = any;
import { BehaviorSubject, Observable, ReplaySubject } from 'rxjs';

import { inject, Injectable, Injector } from '@angular/core';

import { LogFactoryService, Logger } from '../factories/logger.factory';
import { Stage } from '../interfaces/stage.interface';
import { EnvironmentService } from './environment.service';
import { RolesService } from './roles.service';

/**
 * Service to handle authentication and authorization using Keycloak.
 * Utilizes Keycloak JS adapter for authentication flows.
 * Supports user role management and access control.
 */
@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private environmentService = inject(EnvironmentService);
    private injector = inject(Injector);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private _rolesService?: any; // Lazy-loaded to avoid circular dependency
    // Using 'any' to avoid requiring keycloak-js types at compile-time in the library
    private keycloakInstance?: any;
    private userProfile: KeycloakProfile | null = null;
    private useKeycloak: boolean;
    private logger: Logger;
    private cachedUserRoles: string[] | null = null;

    // Subjects for Keycloak events
    private readonly authSuccessSource = new ReplaySubject<void>(1);
    private readonly authErrorSource = new ReplaySubject<KeycloakError>(1);
    private readonly authLogoutSource = new ReplaySubject<void>(1);
    private readonly tokenExpiredSource = new ReplaySubject<void>(1);
    private readonly isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
    private readonly initializedSource = new BehaviorSubject<boolean>(false);
    private readonly userProfileSubject = new BehaviorSubject<KeycloakProfile | null>(null);
    private readonly accessTokenSubject = new BehaviorSubject<string | null>(null);

    // Observables for Keycloak events
    public readonly onAuthSuccess$: Observable<void> = this.authSuccessSource.asObservable();
    public readonly onAuthError$: Observable<KeycloakError> = this.authErrorSource.asObservable();
    public readonly onAuthLogout$: Observable<void> = this.authLogoutSource.asObservable();
    public readonly onTokenExpired$: Observable<void> = this.tokenExpiredSource.asObservable();
    public readonly isAuthenticated$: Observable<boolean> = this.isAuthenticatedSubject.asObservable();
    public readonly isInitialized$: Observable<boolean> = this.initializedSource.asObservable();
    public readonly userProfile$ = this.userProfileSubject.asObservable();
    public readonly accessToken$ = this.accessTokenSubject.asObservable();

    private logFactory = inject(LogFactoryService);

    constructor() {
        this.logger = this.logFactory.createLogger('AuthService');
        // Note: Mock mode detection moved to init() to use updated environment
        this.useKeycloak = false; // Will be determined in init()
    }

    /**
     * Lazy-load RolesService to avoid circular dependency
     * AuthService -> RolesService -> HttpClient -> AuthInterceptor -> AuthService
     */
    private getRolesService() {
        if (!this._rolesService) {
            this._rolesService = this.injector.get(RolesService);
        }
        return this._rolesService;
    }

    async init(_config?: KeycloakConfig): Promise<boolean> {
        this.isAuthenticatedSubject.next(false);
        this.initializedSource.next(false);

        // Determine mode after runtime config is loaded
        const mockModeActive = this.environmentService.stage === Stage.MOCK;
        const keycloakUrl = this.environmentService.keycloakUrl;
        const keycloakRealm = this.environmentService.keycloakRealm;
        const keycloakClientId = this.environmentService.keycloakClientId;
        const keycloakConfigPresent = !!keycloakUrl && !!keycloakRealm && !!keycloakClientId;

        this.logger.debug(`AuthService initializing - Mock: ${mockModeActive}, Keycloak: ${keycloakConfigPresent}`);
        this.useKeycloak = !mockModeActive && keycloakConfigPresent;

        // Initialize Keycloak if configured
        if (this.useKeycloak) {
            this.logger.debug('Initializing Keycloak using runtime configuration...');
            if (!keycloakUrl || !keycloakRealm || !keycloakClientId) {
                this.logger.error('Keycloak initialization skipped: Keycloak configuration is missing in environment.');
                this.useKeycloak = false;
                this.initializedSource.next(true);
                return false;
            }
            const keycloakConfig: KeycloakConfig = {
                url: keycloakUrl,
                realm: keycloakRealm,
                clientId: keycloakClientId
            };
            this.logger.debug(`Creating Keycloak instance for realm: ${keycloakRealm}`);
            // Dynamically import keycloak-js at runtime to avoid build-time resolution issues
            const { default: KeycloakCtor } = await import('keycloak-js');
            this.keycloakInstance = new KeycloakCtor(keycloakConfig);
        } else {
            this.logger.error('Keycloak will not be initialized.');
            this.initializedSource.next(true);
            return false;
        }

        // Event setup for Keycloak. Ensure keycloakInstance is defined before setting up handlers
        if (this.keycloakInstance) {
            this.keycloakInstance.onReady = (authenticated: boolean) => {
                this.isAuthenticatedSubject.next(!!authenticated);
                if (authenticated) {
                    this.loadUserProfile().catch((err) => this.logger.error('Error loading user profile:', err));
                }
            };

            this.keycloakInstance.onAuthSuccess = () => {
                this.logger.debug('Successfully authenticated with Keycloak');
                this.clearUserRolesCache(); // Clear cache on new authentication
                this.authSuccessSource.next();
                this.isAuthenticatedSubject.next(true);
                this.accessTokenSubject.next(this.keycloakInstance!.token ?? null);
                this.loadUserProfile().catch((err) => this.logger.error('Error loading user profile:', err));
            };

            this.keycloakInstance.onAuthError = (errorData: unknown) => {
                this.logger.error('Failed to authenticate with Keycloak:', errorData);
                if (errorData && typeof errorData === 'object' && 'error' in errorData) {
                    this.authErrorSource.next(errorData as KeycloakError);
                }
                this.isAuthenticatedSubject.next(false);
            };

            this.keycloakInstance.onAuthRefreshSuccess = () => {
                this.logger.debug('Successfully refreshed token with Keycloak');
                this.clearUserRolesCache(); // Clear cache on token refresh (roles might have changed)
                this.accessTokenSubject.next(this.keycloakInstance!.token ?? null);
            };

            this.keycloakInstance.onAuthRefreshError = () => {
                this.logger.error('Keycloak onAuthRefreshError');
                // Could trigger a re-login or logout
                this.authErrorSource.next({ error: 'refresh_error', error_description: 'Failed to refresh token' });
            };

            this.keycloakInstance.onAuthLogout = () => {
                this.logger.debug('Logging out from Keycloak');
                this.clearUserRolesCache(); // Clear cache on logout
                this.userProfile = null;
                this.userProfileSubject.next(null);
                this.accessTokenSubject.next(null);
                this.authLogoutSource.next();
                this.isAuthenticatedSubject.next(false);
            };

            this.keycloakInstance.onTokenExpired = () => {
                this.logger.debug('Token expired from Keycloak. Attempting to update token...');
                this.tokenExpiredSource.next();
                this.updateToken(30).catch((err: unknown) => {
                    this.logger.error('Failed to update token after expiry, logging out:', err);
                    this.logout();
                });
            };

            const onLoadMode = (this.environmentService.keycloakOnLoad || 'login-required') as KeycloakInitOptions['onLoad'];
            const initOptions: KeycloakInitOptions = {
                onLoad: onLoadMode,
                checkLoginIframe: false
            };

            // Only add silentCheckSsoRedirectUri for check-sso mode and in development
            if (onLoadMode === 'check-sso' && this.isLocalDevelopment()) {
                initOptions.silentCheckSsoRedirectUri = window.location.origin + '/assets/silent-check-sso.html';
            }

            try {
                const authenticated = await this.keycloakInstance.init(initOptions);
                if (authenticated) {
                    this.logger.debug('Keycloak authentication successful');
                } else {
                    this.logger.debug('Keycloak authentication required - redirect initiated');
                }

                this.accessTokenSubject.next(this.keycloakInstance.token ?? null);
                this.initializedSource.next(true);
                return authenticated;
            } catch (error) {
                this.logger.error('Error during Keycloak initialization:', error);
                this.isAuthenticatedSubject.next(false);
                this.initializedSource.next(true);
                return false;
            }
        } else {
            // This case should ideally not be reached if logic above is correct :-)
            this.logger.error('Oooops! KeycloakInstance is not defined before init call, this should not happen!');
            this.isAuthenticatedSubject.next(false);
            this.initializedSource.next(true); // Signal init completion (unexpected failure)
            return false;
        }
    }

    isKeycloakActive(): boolean {
        return this.useKeycloak;
    }

    isAuthenticated(): boolean {
        if (this.environmentService.stage === Stage.MOCK) {
            return true;
        }
        return !!(this.keycloakInstance && this.keycloakInstance.authenticated);
    }

    login(options?: KeycloakLoginOptions): Promise<boolean> {
        if (!this.isKeycloakActive() || !this.keycloakInstance) {
            this.logger.warn('Login called but Keycloak is not active or not initialized.');
            return Promise.resolve(false);
        }
        this.logger.debug('Login method called. Current authenticated state:', this.keycloakInstance.authenticated);
        return new Promise((resolve, reject) => {
            this.keycloakInstance!.login(options)
                .then(() => {
                    this.logger.debug('Login promise resolved.');
                    this.accessTokenSubject.next(this.keycloakInstance!.token ?? null);
                    resolve(!!this.keycloakInstance?.authenticated);
                })
                .catch((error: unknown) => {
                    this.logger.error('Keycloak login failed.', error);
                    reject(false);
                });
        });
    }

    logout(redirectUri?: string): Promise<void> {
        if (!this.isKeycloakActive() || !this.keycloakInstance) {
            this.logger.warn('Logout called but Keycloak is not active or not initialized.');
            return Promise.resolve();
        }
        const options = redirectUri ? { redirectUri } : { redirectUri: window.location.origin };
        this.logger.debug('Logging out with options', options);
        return this.keycloakInstance.logout(options).catch((error: unknown) => {
            this.logger.error('[Auth Service] Error during Keycloak logout:', error);
            this.userProfile = null;
            this.userProfileSubject.next(null);
            this.accessTokenSubject.next(null);
            this.authLogoutSource.next();
            this.isAuthenticatedSubject.next(false); // Ensure ready state is false even if logout promise fails
        });
    }

    public updateToken(minValidity: number): Promise<boolean> {
        if (!this.isKeycloakActive() || !this.keycloakInstance) {
            this.logger.warn('updateToken called but Keycloak is not active or not initialized.');
            return Promise.resolve(false);
        }
        return this.keycloakInstance.updateToken(minValidity);
    }

    getToken(): Promise<string> {
        if (!this.isKeycloakActive() || !this.keycloakInstance || !this.keycloakInstance.authenticated) {
            return Promise.resolve('');
        }
        // Force a token update if it's about to expire
        return this.updateToken(70)
            .then((refreshed: boolean) => {
                if (refreshed) {
                    this.logger.debug('[Auth Service] Token was refreshed by getToken');
                }
                return this.keycloakInstance!.token || '';
            })
            .catch((error: unknown) => {
                this.logger.error('[Auth Service] Error refreshing token in getToken:', error);
                return this.keycloakInstance!.token || ''; // return current token even if refresh failed
            });
    }

    public getRoles(): string[] {
        if (this.keycloakInstance?.resourceAccess) {
            const clientId = this.environmentService.keycloakClientId;
            const resourceAccess = this.keycloakInstance.resourceAccess[clientId as string];
            return resourceAccess?.roles || [];
        }
        return [];
    }

    public getParsedToken(): KeycloakTokenParsed | undefined {
        return this.keycloakInstance?.tokenParsed;
    }

    public getParsedIdToken(): KeycloakTokenParsed | undefined {
        return this.keycloakInstance?.idTokenParsed;
    }

    public getParsedRefreshToken(): KeycloakTokenParsed | undefined {
        return this.keycloakInstance?.refreshTokenParsed;
    }

    /**
     * Returns the user's profile information.
     * @returns The user's profile or null if not authenticated.
     */
    async loadUserProfile(): Promise<KeycloakProfile | null> {
        if (!this.isKeycloakActive() || !this.keycloakInstance?.authenticated) {
            this.logger.debug('Cannot load user profile, Keycloak not active or not authenticated.');
            this.userProfile = null;
            this.userProfileSubject.next(null);
            return null;
        }
        try {
            this.userProfile = await this.keycloakInstance.loadUserProfile();
            this.logger.debug('User profile loaded:', this.userProfile);
            this.userProfileSubject.next(this.userProfile);
            return this.userProfile;
        } catch (error) {
            this.logger.error('Error loading user profile:', error);
            this.userProfile = null;
            this.userProfileSubject.next(null);
            return null;
        }
    }

    getUserProfile(): KeycloakProfile | null {
        return this.userProfile;
    }

    public hasRole(role: string): boolean {
        if (this.environmentService.stage === Stage.MOCK) {
            return true; // In mock mode, grant all roles for easy testing.
        }
        if (!this.isAuthenticated() || !this.keycloakInstance || !this.keycloakInstance.tokenParsed) {
            return false;
        }

        // Get all Keycloak roles (realm and client roles)
        const keycloakRoles: string[] = [];

        // Add realm roles
        if (this.keycloakInstance.tokenParsed.realm_access?.roles) {
            keycloakRoles.push(...this.keycloakInstance.tokenParsed.realm_access.roles);
        }

        // Add client roles
        const clientId = this.keycloakInstance.clientId;
        if (clientId && this.keycloakInstance.tokenParsed.resource_access?.[clientId]?.roles) {
            keycloakRoles.push(...this.keycloakInstance.tokenParsed.resource_access[clientId].roles);
        }

        // Use roles service to check if any Keycloak role maps to the requested internal role
        return this.getRolesService().hasInternalRole(keycloakRoles, role);
    }

    /**
     * Get all internal roles mapped from the user's Keycloak roles
     */
    public getUserRoles(): string[] {
        // Return cached roles if available
        if (this.cachedUserRoles !== null) {
            return [...this.cachedUserRoles];
        }

        if (this.environmentService.stage === Stage.MOCK) {
            this.cachedUserRoles = [RolesService.ADMIN_ROLE]; // In mock mode, grant admin role
            return [...this.cachedUserRoles];
        }

        if (!this.isAuthenticated() || !this.keycloakInstance || !this.keycloakInstance.tokenParsed) {
            this.cachedUserRoles = [];
            return [];
        }

        // Get all Keycloak roles (realm and client roles)
        const keycloakRoles: string[] = [];

        // Add realm roles
        if (this.keycloakInstance.tokenParsed.realm_access?.roles) {
            keycloakRoles.push(...this.keycloakInstance.tokenParsed.realm_access.roles);
        }

        // Add client roles
        const clientId = this.keycloakInstance.clientId;
        if (clientId && this.keycloakInstance.tokenParsed.resource_access?.[clientId]?.roles) {
            keycloakRoles.push(...this.keycloakInstance.tokenParsed.resource_access[clientId].roles);
        }

        // Map to internal roles and cache
        this.cachedUserRoles = this.getRolesService().mapKeycloakRolesToInternalRoles(keycloakRoles);
        return this.cachedUserRoles ? [...this.cachedUserRoles] : [];
    }

    /**
     * Clear cached user roles (call when user logs out or token changes)
     */
    private clearUserRolesCache(): void {
        this.cachedUserRoles = null;
    }

    /**
     * Check if running in local development environment
     */
    private isLocalDevelopment(): boolean {
        return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    }
}
