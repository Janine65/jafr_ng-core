import { MenuItem } from 'primeng/api';
import { MenubarModule } from 'primeng/menubar';
import { StyleClassModule } from 'primeng/styleclass';
import { Subscription } from 'rxjs';

import { CommonModule } from '@angular/common';
import { Component, inject, Input, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { AuthService } from '../../services/auth.service';
import { MenuItemWithRoles, MenuService } from '../../services/menu.service';
import { AppMenuItem } from '../app-menu-item/app-menu-item.component';
import { LayoutService } from '../app.layout.service';

@Component({
    selector: 'app-menu',
    templateUrl: 'app-menu.component.html',
    standalone: true,
    imports: [CommonModule, RouterModule, StyleClassModule, AppMenuItem, TranslateModule, MenubarModule]
})
export class AppMenu implements OnInit, OnDestroy {
    @Input() model: MenuItemWithRoles[] = [];
    layoutService = inject(LayoutService);
    translateService = inject(TranslateService);
    private menuFilterService = inject(MenuService);
    private authService = inject(AuthService);

    filteredMenu: MenuItemWithRoles[] = [];
    private langChangeSubscription!: Subscription;
    private authSubscription!: Subscription;

    ngOnInit(): void {
        // Update menu when language changes
        this.langChangeSubscription = this.translateService.onLangChange.subscribe(() => {
            this.updateFilteredMenu();
        });

        // Update menu when authentication state changes
        this.authSubscription = this.authService.isAuthenticated$.subscribe(() => {
            this.updateFilteredMenu();
        });

        // Initial menu setup
        this.updateFilteredMenu();
    }

    ngOnDestroy(): void {
        this.langChangeSubscription?.unsubscribe();
        this.authSubscription?.unsubscribe();
    }

    private updateFilteredMenu(): void {
        const translatedMenu = this.getTranslatedMenu();
        this.filteredMenu = this.menuFilterService.filterMenuItems(translatedMenu);
    }

    private getTranslatedMenu(): MenuItemWithRoles[] {
        if (!this.model) {
            return [];
        }
        // Create a deep copy and translate
        const translatedModel = JSON.parse(JSON.stringify(this.model));
        this.translateMenuItems(translatedModel);
        return translatedModel;
    }

    private translateMenuItems(items: MenuItem[]): void {
        items.forEach((item) => {
            if (item.label) {
                item.label = this.translateService.instant(item.label);
            }
            if (item.items) {
                this.translateMenuItems(item.items);
            }
        });
    }
}
