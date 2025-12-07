import { BadgeModule } from 'primeng/badge';
import { PopoverModule } from 'primeng/popover';
import { StyleClassModule } from 'primeng/styleclass';
import { TooltipModule } from 'primeng/tooltip';

import { CommonModule } from '@angular/common';
import { Component, inject, Input, Optional } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { ApiService } from '../../services/api.service';
import { EnvironmentService } from '../../services/environment.service';
import { MenuService } from '../../services/menu.service';
import { RolesService } from '../../services/roles.service';
import { IconLoader } from '../app-icon-loader/app-icon-loader.component';
import { AppLanguageSwitcher } from '../app-language-switcher/app-language-switcher.component';
import { ProfileMenuComponent } from '../app-profile-menu/app-profile-menu.component';
import { LayoutService } from '../app.layout.service';

/**
 * Interface for bug report service to avoid hard dependency on shared module.
 * Any service implementing this interface can be provided to enable bug reporting.
 */
export interface BugReportServiceInterface {
    openBugReportDialog(): void;
}

@Component({
    selector: 'app-menu-actions',
    standalone: true,
    imports: [CommonModule, StyleClassModule, AppLanguageSwitcher, BadgeModule, TranslateModule, TooltipModule, RouterModule, IconLoader, ProfileMenuComponent, PopoverModule],
    templateUrl: './app-menu-actions.component.html'
})
export class AppMenuActions {
    layoutService = inject(LayoutService);
    // Optional: BugReportService is injected if available, otherwise undefined
    private bugReportService = inject<BugReportServiceInterface | null>('BugReportService' as any, { optional: true });
    private environmentService = inject(EnvironmentService);
    private apiMetaService = inject(ApiService);
    private menuFilterService = inject(MenuService);
    private router = inject(Router);

    @Input() hideText: boolean = false;
    private envClickCount = 0;
    private envClickTimer?: number;
    stage: string;
    frontendVersion: string | undefined;
    schedulerVersion: string | undefined;
    backendVersion: string | undefined;
    apiVersion: string | undefined;
    apiSession: string | undefined;
    envTooltip: string = '';

    constructor() {
        this.stage = this.environmentService.stage;
        this.envTooltip = this.buildEnvTooltip();
        this.environmentService.getAllVersions().subscribe((version) => {
            this.backendVersion = version.backendVersion;
            this.schedulerVersion = version.schedulerVersion;
            this.frontendVersion = version.frontendVersion;
            this.envTooltip = this.buildEnvTooltip();
        });
        this.apiMetaService.getApiMetadata$().subscribe((meta) => {
            if (meta) {
                this.apiSession = meta.session ?? '-';
                this.apiVersion = meta.version ?? '-';
            } else {
                this.apiSession = '-';
                this.apiVersion = '-';
            }
            this.envTooltip = this.buildEnvTooltip();
        });
    }

    /*
     * Builds the environment tooltip showing up when hovering
     * over the environment indicator
     */
    buildEnvTooltip(): string {
        return (
            'Frontend: ' +
            this.frontendVersion +
            '\nBackend: ' +
            (this.backendVersion ?? '-') +
            '\nScheduler: ' +
            (this.schedulerVersion ?? '-') +
            '\nAPI: ' +
            (this.apiVersion ?? '-') +
            '\nSession ID: ' +
            (this.apiSession ?? '-') +
            '\nEnvironment: ' +
            this.stage
        );
    }

    /*
     * Checks if the user is an admin
     */
    isAdmin(): boolean {
        return this.menuFilterService.hasAnyRole([RolesService.ADMIN_ROLE, RolesService.SYSTEM_ROLE]);
    }

    /*
     * Toggles the dark mode
     */
    toggleDarkMode() {
        this.layoutService.updateLayoutConfig({ darkTheme: !this.layoutService.layoutConfig().darkTheme });
    }

    /*
     * Opens the bug report dialog (if BugReportService is available)
     */
    openBugReportDialog() {
        if (this.bugReportService) {
            this.bugReportService.openBugReportDialog();
        } else {
            console.warn('BugReportService not available - bug reporting is disabled');
        }
    }

    /*
     * Opens the hidden developer menu in PROD mode :-)
     */
    onEnvironmentIndicatorClick(): void {
        this.envClickCount++;

        // Clear existing timer
        if (this.envClickTimer) {
            window.clearTimeout(this.envClickTimer);
        }

        // Check if we've reached 10 clicks
        if (this.envClickCount >= 10) {
            this.envClickCount = 0;
            this.router.navigate(['/dev']);
            return;
        }

        // Reset counter after 2 seconds of no clicks
        this.envClickTimer = window.setTimeout(() => {
            this.envClickCount = 0;
        }, 2000);
    }
}
