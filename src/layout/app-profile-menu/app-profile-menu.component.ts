// Avoid direct compile-time dependency on keycloak-js types in the library build
type KeycloakProfile = any;
import { ConfirmationService, MessageService } from 'primeng/api';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { SelectModule } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TooltipModule } from 'primeng/tooltip';
import { Subscription } from 'rxjs';

import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { LogFactoryService } from '../../factories/logger.factory';
import { AvailableStage } from '../../interfaces/stage.interface';
import { AuthService } from '../../services/auth.service';
import { DeveloperService } from '../../services/developer.service';
import { PreferencesService } from '../../services/preferences.service';
import { BrowserStorageService } from '../../services/storage.service';

@Component({
    selector: 'app-profile-menu',
    standalone: true,
    imports: [CommonModule, ButtonModule, ToggleSwitchModule, TooltipModule, TranslateModule, FormsModule, DividerModule, AvatarModule, SelectModule, BadgeModule],
    templateUrl: './app-profile-menu.component.html'
})
export class ProfileMenuComponent implements OnInit, OnDestroy {
    private authService = inject(AuthService);
    private preferencesService = inject(PreferencesService);
    private developerService = inject(DeveloperService);
    private storageService = inject(BrowserStorageService);
    private confirmationService = inject(ConfirmationService);
    private messageService = inject(MessageService);
    private translate = inject(TranslateService);
    private logger = inject(LogFactoryService).createLogger('ProfileMenuComponent');
    private router = inject(Router);

    user: { name?: string; email?: string; initials?: string } = {};
    autoDarkMode: boolean = false;

    // Developer features
    isDeveloperMode: boolean = false;
    availableStages: AvailableStage[] = [];
    currentStage: AvailableStage | undefined;
    selectedStage: AvailableStage | undefined;

    private preferencesSubscription!: Subscription;
    private userProfileSubscription!: Subscription;

    ngOnInit(): void {
        this.userProfileSubscription = this.authService.userProfile$.subscribe((profile: KeycloakProfile | null) => {
            if (profile && profile.firstName && profile.lastName) {
                this.user = {
                    name: `${profile.firstName} ${profile.lastName}`,
                    email: profile.email,
                    initials: `${profile.firstName[0]}${profile.lastName[0]}`
                };
            } else {
                this.user = {
                    name: 'Max Muster',
                    email: 'max.muster@suva.ch',
                    initials: 'M'
                };
            }
        });

        this.preferencesSubscription = this.preferencesService.preferences$.subscribe((prefs) => {
            this.autoDarkMode = prefs.autoDarkMode ?? false;
        });

        // Initialize developer features
        this.isDeveloperMode = this.developerService.isDeveloperModeEnabled();
        if (this.isDeveloperMode) {
            this.availableStages = this.developerService.getAvailableStages();
            this.currentStage = this.developerService.getCurrentStage();
            this.selectedStage = this.currentStage;
        }
    }

    onAutoDarkModeChange(event: { checked: boolean }): void {
        this.preferencesService.updatePreference('autoDarkMode', event.checked);
    }

    resetPreferences(): void {
        this.translate.get(['preferences.profile.reset.message', 'preferences.profile.reset.title', 'preferences.profile.resetPreferences.success']).subscribe((translations) => {
            this.confirmationService.confirm({
                message: translations['preferences.profile.reset.message'],
                header: translations['preferences.profile.reset.title'],
                icon: 'pi pi-exclamation-triangle',
                accept: () => {
                    this.storageService.clearLocal();
                    this.storageService.clearSession();
                    this.messageService.add({ severity: 'success', summary: 'Success', detail: translations['profile.resetPreferences.success'] });
                    setTimeout(() => window.location.reload(), 1000);
                },
                key: 'reset-prefs'
            });
        });
    }

    ngOnDestroy(): void {
        if (this.preferencesSubscription) {
            this.preferencesSubscription.unsubscribe();
        }
        if (this.userProfileSubscription) {
            this.userProfileSubscription.unsubscribe();
        }
    }

    logout() {
        this.authService.logout();
    }

    /**
     * Switch to the selected environment stage
     */
    async switchEnvironment(): Promise<void> {
        if (!this.selectedStage || this.selectedStage === this.currentStage) {
            return;
        }

        try {
            this.messageService.add({
                severity: 'info',
                summary: 'Environment Switch',
                detail: `Switching to ${this.selectedStage.label}...`
            });

            await this.developerService.switchToStage(this.selectedStage.key);
        } catch (error) {
            console.error('Failed to switch environment:', error);
            this.messageService.add({
                severity: 'error',
                summary: 'Environment Switch Failed',
                detail: `Failed to switch to ${this.selectedStage.label}`
            });

            // Reset selection to current stage
            this.selectedStage = this.currentStage;
        }
    }

    /**
     * Get environment info for debugging
     */
    getEnvironmentInfo(): void {
        const info = this.developerService.getEnvironmentInfo();
        this.logger.debug('🔍 Environment Info:', info);
        this.messageService.add({
            severity: 'info',
            summary: 'Environment Info',
            detail: 'Check console for detailed environment information'
        });
    }

    /**
     * Reset to default environment configuration
     */
    resetToDefault(): void {
        this.messageService.add({
            severity: 'info',
            summary: 'Environment Reset',
            detail: 'Resetting to default environment configuration...'
        });

        this.developerService.clearDeveloperEnvironmentOverride();
    }

    openDeveloperMenu(): void {
        this.router.navigate(['/dev']);
    }
}
