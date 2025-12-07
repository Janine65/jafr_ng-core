/**
 * Default minimal role configuration for the core library.
 * Applications should override this by providing their own ROLES_CONFIG.
 *
 * @example
 * // In your app.config.ts:
 * import { ROLES_CONFIG } from '@frj/ng-core';
 * import { ROLE_CONSTANTS, ROUTE_ROLE_MAPPINGS } from './app/config/roles.config';
 *
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     { provide: ROLES_CONFIG, useValue: { ROLE_CONSTANTS, ROUTE_ROLE_MAPPINGS } },
 *     // ...
 *   ]
 * };
 */

/**
 * Default system role constants
 */
export const ROLE_CONSTANTS = {
    /** Administrator role */
    ADMIN: 'admin',
    /** System role */
    SYSTEM: 'system'
} as const;

/**
 * Default route-to-role mappings
 * Maps route paths to the roles that have access to them
 */
export const ROUTE_ROLE_MAPPINGS: Record<string, string[]> = {
    // Dashboard - accessible to all
    '/': []
} as const;

/**
 * Helper type for role constants
 */
export type RoleConstant = (typeof ROLE_CONSTANTS)[keyof typeof ROLE_CONSTANTS];
