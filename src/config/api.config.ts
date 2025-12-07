import { InjectionToken } from '@angular/core';

import { CoreEnvironment } from '../interfaces/environment.interface';

/**
 * Injection token for providing the base URL for API calls.
 */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL');

/**
 * Factory function to determine the API base URL.
 *
 * If `useProxy` is true in the environment configuration, it returns a relative
 * path ('/api') to be used with the Angular proxy. Otherwise, it returns the
 * absolute `apiUrl` from the environment configuration.
 *
 * @param environment - The application's environment configuration.
 * @returns The appropriate base URL string.
 */
export function apiBaseUrlFactory(environment: CoreEnvironment): string {
    // If useProxy is true, the services are expected to already have the /api prefix.
    // We return an empty string so the interceptor doesn't add another /api.
    // The proxy will then correctly handle the path.
    // If useProxy is false, we prepend the full backend URL.
    return environment.useProxy ? '' : environment.apiUrl;
}
