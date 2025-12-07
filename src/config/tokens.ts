import { InjectionToken } from '@angular/core';

import { AvailableStage } from '../interfaces/stage.interface';
import { LayoutConfig } from '../layout/app.layout.service';
import { DefaultRoleDataProvider, RoleDataProvider } from '../providers/role-provider.interface';
// Version Data Provider Token
import {
    DefaultVersionDataProvider, VersionDataProvider
} from '../providers/version-provider.interface';
import { MenuItemWithRoles } from '../services/menu.service';
import { AVAILABLE_STAGES } from './dev.config';
import { menuStructure } from './menu.config';
import { ROLE_CONSTANTS, ROUTE_ROLE_MAPPINGS } from './roles.config';
import { DEFAULT_STYLE_CONFIG, SUVA_COLOR_PALETTE, SUVA_THEME_CONFIG } from './style.config';

/**
 * Injection token for menu configuration.
 * Provide your application-specific menu structure to override the default.
 *
 * @example
 * ```typescript
 * import { MENU_CONFIG } from '@syrius/core';
 * import { menuStructure } from './app/config/menu.config';
 *
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     { provide: MENU_CONFIG, useValue: menuStructure }
 *   ]
 * };
 * ```
 */
export const MENU_CONFIG = new InjectionToken<MenuItemWithRoles[]>('MENU_CONFIG', {
    providedIn: 'root',
    factory: () => menuStructure
});

/**
 * Roles configuration interface
 */
export interface RolesConfig {
    ROLE_CONSTANTS: Record<string, string>;
    ROUTE_ROLE_MAPPINGS: Record<string, string[]>;
}

/**
 * Injection token for roles configuration.
 * Provide your application-specific role constants and route mappings.
 *
 * @example
 * ```typescript
 * import { ROLES_CONFIG } from '@syrius/core';
 * import { ROLE_CONSTANTS, ROUTE_ROLE_MAPPINGS } from './app/config/roles.config';
 *
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     { provide: ROLES_CONFIG, useValue: { ROLE_CONSTANTS, ROUTE_ROLE_MAPPINGS } }
 *   ]
 * };
 * ```
 */
export const ROLES_CONFIG = new InjectionToken<RolesConfig>('ROLES_CONFIG', {
    providedIn: 'root',
    factory: () => ({ ROLE_CONSTANTS, ROUTE_ROLE_MAPPINGS })
});

/**
 * Injection token for style configuration.
 * Provide your application-specific default style settings.
 *
 * @example
 * ```typescript
 * import { STYLE_CONFIG } from '@syrius/core';
 * import { DEFAULT_STYLE_CONFIG } from './app/config/style.config';
 *
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     { provide: STYLE_CONFIG, useValue: DEFAULT_STYLE_CONFIG }
 *   ]
 * };
 * ```
 */
export const STYLE_CONFIG = new InjectionToken<LayoutConfig>('STYLE_CONFIG', {
    providedIn: 'root',
    factory: () => DEFAULT_STYLE_CONFIG
});

/**
 * Development environment configuration interface
 */
export interface DevConfig {
    AVAILABLE_STAGES: AvailableStage[];
}

/**
 * Injection token for development environment configuration.
 * Provide your application-specific available stages for environment switching.
 *
 * @example
 * ```typescript
 * import { DEV_CONFIG } from '@syrius/core';
 * import { AVAILABLE_STAGES } from './app/config/dev.config';
 *
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     { provide: DEV_CONFIG, useValue: { AVAILABLE_STAGES } }
 *   ]
 * };
 * ```
 */
export const DEV_CONFIG = new InjectionToken<DevConfig>('DEV_CONFIG', {
    providedIn: 'root',
    factory: () => ({ AVAILABLE_STAGES })
});

/**
 * Injection token for PrimeNG theme configuration.
 * Provide your application-specific theme preset.
 *
 * @example
 * ```typescript
 * import { THEME_CONFIG } from '@syrius/core';
 * import { SUVA_THEME_CONFIG } from './app/config/style.config';
 *
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     { provide: THEME_CONFIG, useValue: SUVA_THEME_CONFIG }
 *   ]
 * };
 * ```
 */
export const THEME_CONFIG = new InjectionToken<any>('THEME_CONFIG', {
    providedIn: 'root',
    factory: () => {
        return SUVA_THEME_CONFIG;
    }
});

/**
 * Injection token for color palette.
 * Provide your application-specific color palette for theming.
 */
export const COLOR_PALETTE = new InjectionToken<Record<number, string>>('COLOR_PALETTE', {
    providedIn: 'root',
    factory: () => {
        return SUVA_COLOR_PALETTE;
    }
});

// ============================================================================
// Role Data Provider Token
// ============================================================================

/**
 * Default implementation of RoleDataProvider that serves as a fallback.
 * Applications should provide their own implementation via the ROLE_DATA_PROVIDER token.
 */

export const ROLE_DATA_PROVIDER = new InjectionToken<RoleDataProvider>('ROLE_DATA_PROVIDER', {
    providedIn: 'root',
    factory: () => new DefaultRoleDataProvider()
});

export const VERSION_DATA_PROVIDER = new InjectionToken<VersionDataProvider>('VERSION_DATA_PROVIDER', {
    providedIn: 'root',
    factory: () => new DefaultVersionDataProvider()
});
