import { filter, Subscription } from 'rxjs';

import { NgClass, NgIf } from '@angular/common';
import { Component, inject, OnDestroy, Renderer2, ViewChild } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';

import { MENU_CONFIG } from '../config/tokens';
import { AppFooter } from './app-footer/app-footer.component';
import { AppTopbar } from './app-header/app-header.component';
import { AppMenuActions } from './app-menu-actions/app-menu-actions.component';
import { AppMenu } from './app-menu/app-menu.component';
import { LayoutService } from './app.layout.service';

/**
 * AppLayout Component
 *
 * This is the main layout wrapper component that manages the application's visual structure and behavior.
 * It handles both desktop and mobile layouts with support for vertical and horizontal menu types.
 *
 * KEY RESPONSIBILITIES:
 * 1. Renders the main application structure (topbar, sidebar, main content, footer)
 * 2. Manages overlay menu behavior for mobile devices
 * 3. Handles click-outside-menu detection to auto-close menus
 * 4. Prevents body scrolling when mobile menu is open
 * 5. Auto-closes menu on route navigation
 */
@Component({
    selector: 'app-layout',
    standalone: true,
    imports: [NgClass, NgIf, AppTopbar, RouterModule, AppFooter, AppMenu, AppMenuActions],
    template: `<div
        class="layout-wrapper"
        [ngClass]="{
            'layout-static': layoutService.layoutConfig().menuMode === 'static',
            'layout-overlay': layoutService.layoutConfig().menuMode === 'overlay',
            'layout-horizontal': layoutService.layoutConfig().menuType === 'horizontal',
            'layout-vertical': layoutService.layoutConfig().menuType === 'vertical',
            'layout-static-nomargin': layoutService.layoutConfig().staticMenuNoMargin === true,
            'layout-overlay-active': layoutService.isSidebarActive(),
            'layout-mobile-active': layoutService.layoutState().staticMenuMobileActive,
            'layout-static-inactive': layoutService.layoutConfig().staticMenuDesktopInactive && layoutService.layoutConfig().menuMode === 'static'
        }"
    >
        <!-- Show topbar only for vertical menu - horizontal menu includes topbar functionality -->
        <app-topbar *ngIf="layoutService.layoutConfig().menuType === 'vertical'">
            <!-- Project menu actions into topbar via content projection -->
            <app-menu-actions [hideText]="true" />
        </app-topbar>

        <!-- Sidebar only for vertical menu type -->
        <div *ngIf="layoutService.layoutConfig().menuType === 'vertical'" class="layout-sidebar">
            <app-menu [model]="menuStructure"></app-menu>
        </div>

        <div
            class="layout-main-container"
            [ngClass]="{
                'layout-horizontal-menu': layoutService.layoutConfig().menuType === 'horizontal'
            }"
        >
            <div class="layout-main">
                <!-- Horizontal menu with integrated topbar functionality -->
                <div *ngIf="layoutService.layoutConfig().menuType === 'horizontal'" class="layout-horizontal-menu-content">
                    <app-menu [model]="menuStructure">
                        <!-- Project menu actions into menu via content projection -->
                        <app-menu-actions [hideText]="true" />
                    </app-menu>
                </div>

                <router-outlet></router-outlet>
            </div>
            <app-footer></app-footer>
        </div>
        <div class="layout-mask animate-fadein"></div>
    </div> `
})
export class AppLayout implements OnDestroy {
    /** Menu structure configuration imported from menu.config */
    menuStructure = inject(MENU_CONFIG);

    /** Layout service for managing menu state and configuration */
    layoutService = inject(LayoutService);

    /** Angular Renderer2 for DOM manipulation (adding/removing event listeners) */
    renderer = inject(Renderer2);

    /** Router service for detecting navigation events */
    router = inject(Router);

    /**
     * Subscription to overlay menu open events.
     * Triggers when menu is opened in overlay mode (mobile or desktop horizontal).
     * Used to set up click-outside detection and body scroll prevention.
     */
    overlayMenuOpenSubscription: Subscription;

    /**
     * Reference to the document click listener function.
     * Stored so it can be properly removed when menu closes or component destroys.
     * Null when no listener is active.
     */
    menuOutsideClickListener: (() => void) | null = null;

    /**
     * Reference to the AppTopbar component.
     * Currently declared but not actively used in the component logic.
     *
     * ASSESSMENT: This ViewChild reference appears to be unused and can likely be removed.
     * It may have been intended for future functionality or left over from refactoring.
     */
    @ViewChild(AppTopbar) appTopBar!: AppTopbar;

    constructor() {
        this.overlayMenuOpenSubscription = this.layoutService.overlayOpen$.subscribe(() => {
            if (!this.menuOutsideClickListener) {
                this.menuOutsideClickListener = this.renderer.listen('document', 'click', (event) => {
                    if (this.isOutsideClicked(event)) {
                        this.hideMenu();
                    }
                });
            }

            if (this.layoutService.layoutState().staticMenuMobileActive) {
                this.blockBodyScroll();
            }
        });

        this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
            this.hideMenu();
        });
    }

    isOutsideClicked(event: MouseEvent) {
        const sidebarEl = document.querySelector('.layout-sidebar');
        const topbarEl = document.querySelector('.layout-menu-button');
        const eventTarget = event.target as Node;

        return !(sidebarEl?.isSameNode(eventTarget) || sidebarEl?.contains(eventTarget) || topbarEl?.isSameNode(eventTarget) || topbarEl?.contains(eventTarget));
    }

    hideMenu() {
        this.layoutService.hideMenu();
        if (this.menuOutsideClickListener) {
            this.menuOutsideClickListener();
            this.menuOutsideClickListener = null;
        }
        this.unblockBodyScroll();
    }

    blockBodyScroll(): void {
        if (document.body.classList) {
            document.body.classList.add('blocked-scroll');
        } else {
            document.body.className += ' blocked-scroll';
        }
    }

    unblockBodyScroll(): void {
        if (document.body.classList) {
            document.body.classList.remove('blocked-scroll');
        } else {
            document.body.className = document.body.className.replace(new RegExp('(^|\\b)' + 'blocked-scroll'.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
        }
    }

    ngOnDestroy() {
        if (this.overlayMenuOpenSubscription) {
            this.overlayMenuOpenSubscription.unsubscribe();
        }

        if (this.menuOutsideClickListener) {
            this.menuOutsideClickListener();
        }
    }
}
