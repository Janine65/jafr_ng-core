import { Observable } from 'rxjs';

import { HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';

import { API_BASE_URL } from '../config/api.config';

/**
 * Intercepts HTTP requests and prepends the appropriate API base URL.
 *
 * This interceptor checks if a request URL is relative. If it is, it prepends
 * the base URL provided by the `API_BASE_URL` injection token. This allows
 * the application to use relative paths for API calls, which are then
 * automatically directed to the proxy in development or the absolute API URL
 * in production.
 *
 * Absolute URLs (e.g., for external services) are not modified.
 */
export const apiUrlInterceptor: HttpInterceptorFn = (request: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
    const baseUrl = inject(API_BASE_URL);

    // Do not intercept requests for assets or absolute URLs
    if (request.url.startsWith('./assets/') || request.url.startsWith('http')) {
        return next(request);
    }

    let finalUrl = request.url;

    // If baseUrl is not empty, we are in production mode.
    // In this case, we must strip the '/api' prefix from the request URL
    // because the production URL does not have an /api path.
    if (baseUrl && finalUrl.startsWith('/api')) {
        finalUrl = finalUrl.substring(4); // Removes '/api'
    }

    const apiRequest = request.clone({
        url: `${baseUrl}${finalUrl}`
    });

    return next(apiRequest);
};
