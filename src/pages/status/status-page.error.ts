import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';

import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'app-error',
    imports: [CommonModule, ButtonModule, RippleModule, RouterModule, TranslateModule],
    standalone: true,
    template: `
        <div class="flex items-center justify-center min-h-screen bg-surface-50 dark:bg-surface-950 px-4">
            <div class="text-center max-w-2xl">
                <div class="mb-6">
                    <i class="pi pi-times-circle text-6xl text-red-500"></i>
                </div>
                <h1 class="text-4xl font-semibold text-surface-900 dark:text-surface-0 mb-4">
                    {{ errorTitle }}
                </h1>
                <p class="text-surface-600 dark:text-surface-400 mb-6">
                    {{ errorMessage }}
                </p>

                <div *ngIf="technicalDetails" class="mb-8 p-4 bg-surface-100 dark:bg-surface-800 rounded-lg text-left">
                    <p class="text-sm font-medium text-surface-700 dark:text-surface-300 mb-2"><i class="pi pi-info-circle mr-2"></i>{{ 'status.error.technicalDetails' | translate }}</p>
                    <code class="text-xs text-surface-600 dark:text-surface-400 block break-words">{{ technicalDetails }}</code>
                </div>

                <div class="flex gap-3 justify-center">
                    <p-button [label]="'status.error.button.dashboard' | translate" routerLink="/" icon="pi pi-home" />
                    <p-button [label]="'status.error.button.reload' | translate" (onClick)="reloadPage()" icon="pi pi-refresh" severity="secondary" [outlined]="true" />
                </div>
            </div>
        </div>
    `
})
export class Error implements OnInit {
    private route = inject(ActivatedRoute);
    private translate = inject(TranslateService);

    errorTitle = '';
    errorMessage = '';
    technicalDetails = '';

    ngOnInit() {
        // Set default translations
        this.errorTitle = this.translate.instant('status.error.title');
        this.errorMessage = this.translate.instant('status.error.message');

        // Get custom error message and other parameters from URL
        this.route.queryParams.subscribe((params) => {
            if (params['message']) {
                this.errorMessage = decodeURIComponent(params['message']);
            }

            if (params['title']) {
                this.errorTitle = decodeURIComponent(params['title']);
            }

            if (params['details']) {
                this.technicalDetails = decodeURIComponent(params['details']);
            }

            // Handle specific error types
            if (params['cause']) {
                this.handleSpecificError(params['cause']);
            }
        });
    }

    private handleSpecificError(cause: string) {
        const causeKey = `status.error.causes.${cause}`;

        // Check if translation exists for this cause
        const titleKey = `${causeKey}.title`;
        const messageKey = `${causeKey}.message`;

        const title = this.translate.instant(titleKey);
        if (title !== titleKey) {
            this.errorTitle = title;
        }

        const message = this.translate.instant(messageKey);
        if (message !== messageKey) {
            this.errorMessage = message;
        }
    }

    reloadPage() {
        window.location.reload();
    }
}
