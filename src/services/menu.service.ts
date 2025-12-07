import { MenuItem } from 'primeng/api';

import { inject, Injectable } from '@angular/core';

import { LogFactoryService, Logger } from '../factories/logger.factory';
import { MenuItemRole } from '../interfaces/roles.interface';
import { AuthService } from './auth.service';
import { EnvironmentService } from './environment.service';
import { RolesService } from './roles.service';

// Extended MenuItem interface to include role requirements
export interface MenuItemWithRoles extends MenuItem {
    roles?: MenuItemRole;
    items?: MenuItemWithRoles[];
}

/**
 * Service to filter menu items based on user roles
 * Utilizes AuthService to get current user roles
 */
@Injectable({
    providedIn: 'root'
})
export class MenuService {
    private authService = inject(AuthService);
    private rolesService = inject(RolesService);
    private environmentService = inject(EnvironmentService);
    private logFactory = inject(LogFactoryService);
    private logger: Logger;

    constructor() {
        this.logger = this.logFactory.createLogger('MenuFilterService');
    }

    /**
     * Filters menu items based on user roles (synchronous)
     */
    filterMenuItems(menuItems: MenuItemWithRoles[]): MenuItemWithRoles[] {
        if (!this.authService.isAuthenticated() && !this.environmentService.isMock()) {
            return [];
        }

        const userRoles = this.getCurrentUserRoles();
        this.logger.debug('Filtering menu with user roles:', userRoles);

        return this.filterMenuItemsRecursive(menuItems, userRoles);
    }

    /**
     * Recursively filters menu items and their children
     */
    private filterMenuItemsRecursive(menuItems: MenuItemWithRoles[], userRoles: string[]): MenuItemWithRoles[] {
        return menuItems
            .filter((item) => this.hasAccessToMenuItem(item, userRoles))
            .map((item) => {
                // Filter children recursively
                if (item.items && item.items.length > 0) {
                    const filteredChildren = this.filterMenuItemsRecursive(item.items, userRoles);
                    return {
                        ...item,
                        items: filteredChildren.length > 0 ? filteredChildren : undefined
                    };
                }
                return item;
            })
            .filter((item) => {
                // Remove parent items that have no children and no direct route
                if (item.items === undefined && !item.routerLink && !item.url && !item.command) {
                    return false;
                }
                return true;
            });
    }

    /**
     * Checks if user has access to a specific menu item
     */
    private hasAccessToMenuItem(menuItem: MenuItemWithRoles, userRoles: string[]): boolean {
        // If no roles are specified, item is accessible to all authenticated users
        if (!menuItem.roles) {
            return true;
        }

        const { requiredRoles, requiredAllRoles, excludeRoles } = menuItem.roles;

        // Check exclude roles first - if user has any excluded role, deny access
        if (excludeRoles && excludeRoles.some((excludeRole) => userRoles.includes(excludeRole))) {
            this.logger.debug(`Access denied to ${menuItem.label} - user has excluded role`);
            return false;
        }

        // Check if all required roles are present
        if (requiredAllRoles && requiredAllRoles.length > 0) {
            const hasAllRoles = requiredAllRoles.every((role) => userRoles.includes(role));
            if (!hasAllRoles) {
                this.logger.debug(`Access denied to ${menuItem.label} - missing required roles:`, requiredAllRoles);
                return false;
            }
        }

        // Check if any of the required roles is present
        if (requiredRoles && requiredRoles.length > 0) {
            const hasAnyRole = requiredRoles.some((role) => userRoles.includes(role));
            if (!hasAnyRole) {
                this.logger.debug(`Access denied to ${menuItem.label} - no required roles:`, requiredRoles);
                return false;
            }
        }

        return true;
    }

    /**
     * Gets current user roles (from Keycloak)
     */
    getCurrentUserRoles(): string[] {
        if (this.environmentService.isMock()) {
            // In mock mode, use simulated roles or default to admin
            return [RolesService.ADMIN_ROLE];
        }

        // Get mapped internal roles from Keycloak
        return this.authService.getUserRoles();
    }

    /**
     * Checks if user has any of the specified roles
     */
    hasAnyRole(roles: string[]): boolean {
        const userRoles = this.getCurrentUserRoles();
        return roles.some((role) => userRoles.includes(role));
    }

    /**
     * Checks if user has all of the specified roles
     */
    hasAllRoles(roles: string[]): boolean {
        const userRoles = this.getCurrentUserRoles();
        return roles.every((role) => userRoles.includes(role));
    }
}
