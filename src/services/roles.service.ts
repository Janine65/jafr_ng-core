import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, filter, first, map, shareReplay, tap } from 'rxjs/operators';

import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, NgZone } from '@angular/core';

import { ROLE_DATA_PROVIDER, ROLES_CONFIG } from '../config/tokens';
import { LogFactoryService, Logger } from '../factories/logger.factory';
import { InternalRole } from '../interfaces/roles.interface';
import { EnvironmentService } from './environment.service';
import { BrowserStorageService } from './storage.service';

/**
 * Service for role management
 * Maps Keycloak roles to internal application roles
 * Provides methods to retrieve and manage user roles
 */
@Injectable({
    providedIn: 'root'
})
export class RolesService {
    private logFactory = inject(LogFactoryService);
    private environmentService = inject(EnvironmentService);
    private storageService = inject(BrowserStorageService);
    private ngZone = inject(NgZone);
    private rolesConfig = inject(ROLES_CONFIG);
    private roleDataProvider = inject(ROLE_DATA_PROVIDER);
    private logger: Logger;

    // Role constants - provided via dependency injection
    public static ADMIN_ROLE: string;
    public static SYSTEM_ROLE: string;

    private readonly STORAGE_KEY_ROLES = 'user_roles_cache';

    private currentRolesSubject = new BehaviorSubject<string[]>([]);
    private internalRolesCache$: Observable<InternalRole[]> | null = null;
    private roleMappingCache: Map<string, string[]> = new Map(); // Keycloak role -> Internal roles

    // Backward compatibility properties
    private isLoadingMappingsSubject = new BehaviorSubject<boolean>(true);
    public isLoadingMappings$: Observable<boolean> = this.isLoadingMappingsSubject.asObservable();

    private initialized = false;

    constructor() {
        this.logger = this.logFactory.createLogger('RolesService');

        // Initialize static properties from injected config
        RolesService.ADMIN_ROLE = this.rolesConfig.ROLE_CONSTANTS['ADMIN'];
        RolesService.SYSTEM_ROLE = this.rolesConfig.ROLE_CONSTANTS['SYSTEM'];
    }

    /**
     * Initialize roles - try session storage first, then API
     */
    private initializeRoles(): void {
        this.logger.debug('Initializing roles service...');
        // Set loading to true immediately so loading screen shows
        // IMPORTANT: Run inside zone to ensure Angular detects the change
        this.ngZone.run(() => {
            this.isLoadingMappingsSubject.next(true);
        });

        const cachedRoles = this.loadRolesFromStorage();

        if (cachedRoles && cachedRoles.length > 0) {
            this.logger.debug(`Loaded ${cachedRoles.length} roles from session storage:`, cachedRoles);
            // Use cached roles immediately
            this.internalRolesCache$ = of(cachedRoles).pipe(shareReplay(1));
            this.buildRoleMappingCache(cachedRoles);
            // IMPORTANT: Run inside zone to ensure loading screen hides
            this.ngZone.run(() => {
                this.isLoadingMappingsSubject.next(false);
            });
        } else {
            this.logger.debug('No cached roles found, will load from API');
            // No cache, load from API (loadRoleMappings will set loading to false when done)
            this.loadRoleMappings();
        }
    }

    /**
     * Public method to ensure roles are loaded (used by APP_INITIALIZER)
     * Returns a promise that resolves when roles are loaded
     */
    ensureRolesLoaded(): Promise<void> {
        return new Promise((resolve, reject) => {
            // Initialize on first call
            if (!this.initialized) {
                this.logger.debug('First call to ensureRolesLoaded - initializing roles service');
                this.initialized = true;
                this.initializeRoles();
            }

            // Wait for loading to complete
            this.isLoadingMappings$
                .pipe(
                    filter((isLoading) => !isLoading),
                    first()
                )
                .subscribe({
                    next: () => {
                        this.logger.debug('Roles ensured loaded (loading completed)');
                        resolve();
                    },
                    error: (error) => {
                        this.logger.error('Error ensuring roles loaded:', error);
                        reject(error);
                    }
                });
        });
    }

    /**
     * Load role mappings from API and cache them
     */
    private loadRoleMappings(): void {
        if (!this.internalRolesCache$) {
            // IMPORTANT: Run inside zone to ensure loading screen shows
            this.ngZone.run(() => {
                this.isLoadingMappingsSubject.next(true);
            });
            this.internalRolesCache$ = this.fetchRoleMappings().pipe(shareReplay(1));
            this.internalRolesCache$.pipe(first()).subscribe({
                next: () => {
                    // IMPORTANT: Run inside zone to ensure loading screen hides
                    this.ngZone.run(() => {
                        this.isLoadingMappingsSubject.next(false);
                    });
                },
                error: () => {
                    // IMPORTANT: Run inside zone to ensure loading screen hides even on error
                    this.ngZone.run(() => {
                        this.isLoadingMappingsSubject.next(false);
                    });
                }
            });
        }
    }

    /**
     * Fetch role mappings from the API and save to session storage
     */
    private fetchRoleMappings(): Observable<InternalRole[]> {
        this.logger.debug('Fetching role mappings from application-specific provider');

        return this.roleDataProvider.fetchRoleMappings().pipe(
            tap((roles: InternalRole[]) => {
                this.logger.debug('Role mappings fetched and processed:', roles);
                this.buildRoleMappingCache(roles);
                // Save to session storage
                this.saveRolesToStorage(roles);
            }),
            catchError((error: HttpErrorResponse) => {
                this.logger.error('Error fetching role mappings:', error);
                return of(this.getFallbackRoles());
            })
        );
    }

    /**
     * Save roles to session storage using BrowserStorageService
     */
    private saveRolesToStorage(roles: InternalRole[]): void {
        const success = this.storageService.setSession(this.STORAGE_KEY_ROLES, roles);
        if (success) {
            this.logger.debug('Roles saved to session storage');
        } else {
            this.logger.error('Failed to save roles to session storage');
        }
    }

    /**
     * Load roles from session storage using BrowserStorageService
     */
    private loadRolesFromStorage(): InternalRole[] | null {
        this.logger.debug('Attempting to load roles from session storage...');
        const roles = this.storageService.getSession<InternalRole[]>(this.STORAGE_KEY_ROLES);
        if (roles) {
            this.logger.debug(`Found ${roles.length} roles in session storage`);
        } else {
            this.logger.debug('No roles found in session storage');
        }
        return roles;
    }

    /**
     * Clear roles from session storage using BrowserStorageService
     */
    clearRolesCache(): void {
        const success = this.storageService.removeSession(this.STORAGE_KEY_ROLES);
        if (success) {
            this.logger.debug('Roles cache cleared from session storage');
        } else {
            this.logger.error('Failed to clear roles cache');
        }
    }

    /**
     * Process the API response and convert to InternalRole[]
     */

    /**
     * Build a reverse mapping cache (Keycloak role -> Internal roles)
     */
    private buildRoleMappingCache(internalRoles: InternalRole[]): void {
        this.roleMappingCache.clear();

        internalRoles.forEach((internalRole) => {
            internalRole.keycloakRoles.forEach((keycloakRole) => {
                if (!this.roleMappingCache.has(keycloakRole)) {
                    this.roleMappingCache.set(keycloakRole, []);
                }
                this.roleMappingCache.get(keycloakRole)!.push(internalRole.name);
            });
        });

        this.logger.debug('Role mapping cache built:', this.roleMappingCache);
    }

    /**
     * Fallback roles when API is unavailable
     */
    private getFallbackRoles(): InternalRole[] {
        return [
            {
                name: RolesService.ADMIN_ROLE,
                displayName: RolesService.ADMIN_ROLE,
                description: 'Full system access',
                keycloakRoles: []
            }
        ];
    }

    /**
     * Map Keycloak roles to internal application roles
     */
    public mapKeycloakRolesToInternalRoles(keycloakRoles: string[]): string[] {
        if (this.environmentService.isMock()) {
            this.logger.debug('Mock mode: Returning admin role');
            return [RolesService.ADMIN_ROLE];
        }

        if (!keycloakRoles || keycloakRoles.length === 0) {
            this.logger.debug('No Keycloak roles provided');
            return [];
        }

        const internalRoles = new Set<string>();

        keycloakRoles.forEach((keycloakRole) => {
            const mappedRoles = this.roleMappingCache.get(keycloakRole);
            if (mappedRoles) {
                mappedRoles.forEach((role) => internalRoles.add(role));
            }
        });

        const result = Array.from(internalRoles);
        this.logger.debug(`Mapped Keycloak roles ${keycloakRoles.join(', ')} to internal roles:`, result);

        return result;
    }

    /**
     * Check if user has a specific internal role
     */
    public hasInternalRole(keycloakRoles: string[], targetInternalRole: string): boolean {
        const internalRoles = this.mapKeycloakRolesToInternalRoles(keycloakRoles);
        const hasRole = internalRoles.includes(targetInternalRole);

        this.logger.debug(`Checking if user has internal role '${targetInternalRole}':`, hasRole);
        return hasRole;
    }

    /**
     * Check if user has any of the specified internal roles
     */
    public hasAnyInternalRole(keycloakRoles: string[], targetInternalRoles: string[]): boolean {
        const internalRoles = this.mapKeycloakRolesToInternalRoles(keycloakRoles);
        const hasAny = targetInternalRoles.some((role) => internalRoles.includes(role));

        this.logger.debug(`Checking if user has any of roles ${targetInternalRoles.join(', ')}:`, hasAny);
        return hasAny;
    }

    /**
     * Check if user has all specified internal roles
     */
    public hasAllInternalRoles(keycloakRoles: string[], targetInternalRoles: string[]): boolean {
        const internalRoles = this.mapKeycloakRolesToInternalRoles(keycloakRoles);
        const hasAll = targetInternalRoles.every((role) => internalRoles.includes(role));

        this.logger.debug(`Checking if user has all roles ${targetInternalRoles.join(', ')}:`, hasAll);
        return hasAll;
    }

    /**
     * Get the admin role name
     * @returns The admin role identifier
     */
    public static getAdminRole(): string {
        return RolesService.ADMIN_ROLE;
    }

    /**
     * Get the system role name
     * @returns The system role identifier
     */
    public static getSystemRole(): string {
        return RolesService.SYSTEM_ROLE;
    }

    /**
     * Check if user has admin role
     * @param keycloakRoles User's Keycloak roles
     * @returns True if user has admin access
     */
    public isAdmin(keycloakRoles: string[]): boolean {
        return this.hasInternalRole(keycloakRoles, RolesService.ADMIN_ROLE);
    }

    /**
     * Check if user has admin or system role
     * @param keycloakRoles User's Keycloak roles
     * @returns True if user has admin or system access
     */
    public isAdminOrSystem(keycloakRoles: string[]): boolean {
        return this.hasAnyInternalRole(keycloakRoles, [RolesService.ADMIN_ROLE, RolesService.SYSTEM_ROLE]);
    }

    /**
     * Get all available internal roles from API
     */
    public getAvailableInternalRoles(): Observable<InternalRole[]> {
        if (!this.internalRolesCache$) {
            this.loadRoleMappings();
        }
        return this.internalRolesCache$!;
    }

    /**
     * Get information about a specific internal role
     */
    public getInternalRoleInfo(roleName: string): Observable<InternalRole | undefined> {
        return this.getAvailableInternalRoles().pipe(map((roles) => roles.find((r) => r.name === roleName)));
    }

    /**
     * Get all Keycloak roles that map to a specific internal role
     */
    public getKeycloakRolesForInternalRole(internalRole: string): Observable<string[]> {
        return this.getAvailableInternalRoles().pipe(map((roles) => roles.find((r) => r.name === internalRole)?.keycloakRoles || []));
    }

    /**
     * Get the complete role mappings (Keycloak -> Internal)
     */
    public getRoleMappings(): Observable<Map<string, string[]>> {
        return this.getAvailableInternalRoles().pipe(
            map(() => {
                return this.roleMappingCache;
            })
        );
    }

    /**
     * Check route access based on Keycloak roles
     * Uses centralized route-to-role mappings from roles.config.ts
     */
    public checkRouteAccess(keycloakRoles: string[], routePath: string): boolean {
        // Find matching route - check most specific routes first (longest path)
        let requiredRoles: string[] = [];
        let longestMatch = '';

        for (const [route, roles] of Object.entries(this.rolesConfig.ROUTE_ROLE_MAPPINGS)) {
            if (routePath.startsWith(route) && route.length > longestMatch.length) {
                requiredRoles = roles;
                longestMatch = route;
            }
        }

        if (requiredRoles.length === 0) {
            this.logger.debug(`No role requirement for route: ${routePath}`);
            return true; // No specific requirement
        }

        const hasAccess = this.hasAnyInternalRole(keycloakRoles, requiredRoles);
        this.logger.debug(`Route access check for ${routePath}:`, hasAccess);

        return hasAccess;
    }

    /**
     * Set current roles (for mock/simulation mode)
     */
    public setCurrentRoles(roles: string[]): void {
        this.currentRolesSubject.next(roles);
        this.logger.debug('Current roles updated:', roles);
    }

    /**
     * Get current roles as observable
     */
    public getCurrentRoles(): Observable<string[]> {
        return this.currentRolesSubject.asObservable();
    }

    /**
     * Clear the role mappings cache and reload
     */
    public clearCache(): void {
        this.logger.debug('Clearing role mappings cache');
        this.internalRolesCache$ = null;
        this.roleMappingCache.clear();
        this.loadRoleMappings();
    }
}
