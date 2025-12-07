/**
 * @syrius/core - Core infrastructure library for Syrius Angular applications
 *
 * This library provides reusable core infrastructure including:
 * - Authentication and authorization (Keycloak)
 * - Service layer (API, environment, preferences)
 * - Layout components (header, menu, footer)
 * - Interceptors (auth, error handling, logging)
 * - Guards (role-based access control)
 * - Shared interfaces and utilities
 */

// ============================================================================
// Services
// ============================================================================
export * from './services/api.service';
export * from './services/api-log.service';
export * from './services/auth.service';
export * from './services/banner.service';
export * from './services/developer.service';
export * from './services/environment.service';
export * from './services/loading.service';
export * from './services/logger.service';
export * from './services/menu.service';
export * from './services/message.service';
export * from './services/preferences.service';
export * from './services/roles.service';
export * from './services/storage.service';

// ============================================================================
// Interceptors
// ============================================================================
export * from './interceptors/api.meta.interceptor';
export * from './interceptors/api.error.interceptor';
export * from './interceptors/api.log.interceptor';
export * from './interceptors/api.auth.interceptor';
export * from './interceptors/api.url.interceptor';

// ============================================================================
// Guards
// ============================================================================
export * from './guards/auth.guard';
export * from './guards/role.guard';

// ============================================================================
// Interfaces
// ============================================================================
export * from './interfaces/api.interface';
export * from './interfaces/banner.interface';
export * from './interfaces/loglevel.interface';
export * from './interfaces/message.interface';
export * from './interfaces/preferences.interface';
export * from './interfaces/proxy.interface';
export * from './interfaces/roles.interface';
export * from './providers/version-provider.interface';
export * from './interfaces/environment.interface';
export * from './interfaces/stage.interface';

// ============================================================================
// Providers
// ============================================================================
export * from './providers/role-provider.interface';
export * from './providers/version-provider.interface';

// ============================================================================
// Layout Components
// ============================================================================
export * from './layout/app.layout';
export * from './layout/app.layout.service';
export * from './layout/app-footer/app-footer.component';
export * from './layout/app-header/app-header.component';
export * from './layout/app-loading-page/app-loading-page.component';
export * from './layout/app-menu/app-menu.component';
export * from './layout/app-menu-actions/app-menu-actions.component';
export * from './layout/app-profile-menu/app-profile-menu.component';
export * from './layout/app-banner/app-banner.component';

// ============================================================================
// Configuration
// ============================================================================
export * from './config/api.config';
export * from './config/menu.config';
export * from './config/tokens';
export { THEME_CONFIG } from './config/tokens';
export * from './config/roles.config';
export * from './config/style.config';
export * from './config/dev.config';

// ============================================================================
// Factories
// ============================================================================
export * from './factories/logger.factory';

// ============================================================================
// Pipes
// ============================================================================
export * from './pipes/safe-html.pipe';
