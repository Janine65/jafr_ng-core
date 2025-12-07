import { Observable, of } from 'rxjs';
import { filter, switchMap, take } from 'rxjs/operators';

import { inject, Injectable } from '@angular/core';
import {
    ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree
} from '@angular/router';

import { LogFactoryService, Logger } from '../factories/logger.factory';
import { Stage } from '../interfaces/stage.interface';
import { AuthService } from '../services/auth.service';
import { EnvironmentService } from '../services/environment.service';

@Injectable({
    providedIn: 'root'
})
export class AuthGuard implements CanActivate {
    private router = inject(Router);
    private environmentService = inject(EnvironmentService);
    private authService = inject(AuthService);
    private logger: Logger = inject(LogFactoryService).createLogger('AuthGuard');

    canActivate(_route: ActivatedRouteSnapshot, _state: RouterStateSnapshot): Observable<boolean | UrlTree> {
        // If in mock mode, always allow access.
        if (this.environmentService.stage == Stage.MOCK) {
            this.logger.debug('Mock mode is active. Skipping auth-check, access granted.');
            return of(true);
        }

        // Wait for the AuthService to be initialized before making a decision.
        return this.authService.isInitialized$.pipe(
            filter((isInitialized) => isInitialized), // Wait until isInitialized is true
            take(1), // Take the first true value and complete
            switchMap(() => {
                // If Keycloak is not considered active by AuthService (e.g. missing config), redirect to access denied page.
                if (!this.authService.isKeycloakActive()) {
                    this.logger.warn('Access denied. Keycloak is not active. This might indicate a configuration issue.');
                    return of(this.router.createUrlTree(['/status/403'], { queryParams: { cause: 'keycloak_inactive', message: 'Keycloak authentication is not properly configured.' } }));
                }

                if (this.authService.isAuthenticated()) {
                    this.logger.debug('User is authenticated, access granted.');
                    return of(true);
                }

                // If not authenticated, Keycloak's init process should have already started the login redirect.
                // We return true to allow the app to continue rendering while Keycloak handles the redirect.
                this.logger.debug('User authentication required. Keycloak will handle the redirect.');
                return of(true);
            })
        );
    }
}
