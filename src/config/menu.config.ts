import { MenuItemWithRoles } from '../services/menu.service';

/**
 * Default minimal menu structure for the core library.
 * Applications should override this by providing their own MENU_CONFIG.
 *
 * @example
 * // In your app.config.ts:
 * import { MENU_CONFIG } from '@frj/ng-core';
 * import { menuStructure } from './app/config/menu.config';
 *
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     { provide: MENU_CONFIG, useValue: menuStructure },
 *     // ...
 *   ]
 * };
 */
export const menuStructure: MenuItemWithRoles[] = [
    {
        label: 'Home',
        icon: 'pi pi-home',
        routerLink: ['/']
    }
];
