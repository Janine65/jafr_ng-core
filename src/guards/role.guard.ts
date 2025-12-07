import { Observable, of } from 'rxjs';
import { catchError, filter, map, take } from 'rxjs/operators';

import { inject, Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';

import { LogFactoryService } from '../factories/logger.factory';
import { Stage } from '../interfaces/stage.interface';
import { AuthService } from '../services/auth.service';
import { EnvironmentService } from '../services/environment.service';
import { RolesService } from '../services/roles.service';

@Injectable({
    providedIn: 'root'
})
export class RoleGuard {
    private authService = inject(AuthService);
    private rolesService = inject(RolesService);
    private router = inject(Router);
    private environmentService = inject(EnvironmentService);
    private logger = inject(LogFactoryService).createLogger('RoleGuard');

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
        // If in mock mode, use menu filter service for role checking with simulated roles
        if (this.environmentService.stage === Stage.MOCK) {
            this.logger.debug('[RoleGuard] Mock mode is active, checking simulated roles.');
            return this.checkRouteDataRoles(route, state);
        }

        const routePath = state.url;

        // Wait for role mappings to load before checking access
        return this.rolesService.isLoadingMappings$.pipe(
            filter((isLoading) => !isLoading),
            take(1),
            map(() => {
                const userRoles = this.authService.getRoles();

                if (!userRoles || userRoles.length === 0) {
                    this.logger.warn(`RoleGuard: Access denied for ${routePath}. User has no roles.`);
                    return this.router.createUrlTree(['/dashboard'], { queryParams: { error: 'access_denied_no_roles' } });
                }

                // Check route data first for specific role requirements
                const routeDataCheck = this.checkRouteDataRoles(route, state);
                if (routeDataCheck !== true) {
                    return routeDataCheck;
                }

                // Check role mapping for route access
                this.logger.debug(`RoleGuard: Role mappings loaded for ${routePath}. Checking access.`);
                const hasAccess = this.rolesService.checkRouteAccess(userRoles, routePath);

                if (hasAccess) {
                    this.logger.debug(`RoleGuard: Access granted for ${routePath}.`);
                    return true;
                }

                this.logger.warn(`RoleGuard: Access denied. User roles [${userRoles.join(', ')}] do not grant access to route ${routePath}.`);
                return this.router.createUrlTree(['/dashboard'], { queryParams: { error: 'access_denied_insufficient_permissions' } });
            }),
            catchError((error) => {
                this.logger.error(`RoleGuard: Error checking access for ${routePath}:`, error);
                return of(this.router.createUrlTree(['/dashboard'], { queryParams: { error: 'guard_error' } }));
            })
        );
    }

    private checkRouteDataRoles(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
        const requiredRoles = route.data['roles'] as string[] | undefined;
        const requiredAllRoles = route.data['allRoles'] as string[] | undefined;
        const excludeRoles = route.data['excludeRoles'] as string[] | undefined;
        const routePath = state.url;

        // If no role requirements specified in route data, allow normal processing
        if (!requiredRoles && !requiredAllRoles && !excludeRoles) {
            return true;
        }

        // Get current user roles. For mock mode, use admin role
        const userRoles = this.environmentService.stage === Stage.MOCK ? [RolesService.ADMIN_ROLE, ...this.authService.getRoles()] : this.authService.getRoles();

        this.logger.debug(`RoleGuard: Checking route data roles for ${routePath}`, {
            userRoles,
            requiredRoles,
            requiredAllRoles,
            excludeRoles
        });

        // Check exclude roles first
        if (excludeRoles && excludeRoles.some((excludeRole) => userRoles.includes(excludeRole))) {
            this.logger.debug(`RoleGuard: Access denied to ${routePath} - user has excluded role`);
            return this.router.createUrlTree(['/dashboard'], {
                queryParams: { error: 'access-denied', reason: 'excluded-role' }
            });
        }

        // Check if all required roles are present
        if (requiredAllRoles && requiredAllRoles.length > 0) {
            const hasAllRoles = requiredAllRoles.every((role) => userRoles.includes(role));
            if (!hasAllRoles) {
                this.logger.debug(`RoleGuard: Access denied to ${routePath} - missing required roles`, requiredAllRoles);
                return this.router.createUrlTree(['/dashboard'], {
                    queryParams: { error: 'access-denied', reason: 'insufficient-roles' }
                });
            }
        }

        // Check if any of the required roles is present
        if (requiredRoles && requiredRoles.length > 0) {
            const hasAnyRole = requiredRoles.some((role) => userRoles.includes(role));
            if (!hasAnyRole) {
                this.logger.debug(`RoleGuard: Access denied to ${routePath} - no required roles`, requiredRoles);
                return this.router.createUrlTree(['/dashboard'], {
                    queryParams: { error: 'access-denied', reason: 'no-required-role' }
                });
            }
        }

        this.logger.debug(`RoleGuard: Route data role check passed for ${routePath}`);
        return true;
    }
}

// Helper interface for route data
export interface RoleRouteData {
    roles?: string[]; // Any of these roles grants access
    allRoles?: string[]; // All of these roles are required
    excludeRoles?: string[]; // These roles are explicitly denied access
}
