import { from, Observable, switchMap } from 'rxjs';

import { HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';

import { LogFactoryService } from '../factories/logger.factory';
import { Stage } from '../interfaces/stage.interface';
import { AuthService } from '../services/auth.service';
import { EnvironmentService } from '../services/environment.service';

export const authInterceptor: HttpInterceptorFn = (request: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
    const authService = inject(AuthService);
    const environmentService = inject(EnvironmentService);
    const logger = inject(LogFactoryService).createLogger('AuthInterceptor');

    // If in mock mode, bypass the interceptor logic.
    if (environmentService.stage == Stage.MOCK) {
        logger.debug('Mock mode enabled. Bypassing Auth Interceptor.');
        return next(request);
    }

    // Only add the token if it's not a request to assets, keycloak or mockup data.
    const keycloakUrl = environmentService.keycloakUrl;

    if (!request.url.startsWith('/assets/') && !request.url.endsWith('.json') && !(keycloakUrl && request.url.startsWith(keycloakUrl))) {
        return from(authService.getToken()).pipe(
            // Convert Promise to Observable using from()
            switchMap((token) => {
                if (token) {
                    const authReq = request.clone({
                        setHeaders: {
                            Authorization: `Bearer ${token}`
                        }
                    });
                    return next(authReq);
                }
                return next(request); // Proceed without token if no token is available
            })
        );
    }

    return next(request);
};
