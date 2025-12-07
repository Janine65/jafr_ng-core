import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';

import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'app-access-denied',
    standalone: true,
    imports: [CommonModule, ButtonModule, RouterModule, RippleModule, TranslateModule],
    template: `
        <div class="flex items-center justify-center min-h-screen bg-surface-50 dark:bg-surface-950 px-4">
            <div class="text-center max-w-2xl">
                <div class="mb-6">
                    <i class="pi pi-lock text-6xl text-orange-500"></i>
                </div>
                <h1 class="text-4xl font-semibold text-surface-900 dark:text-surface-0 mb-4">
                    {{ accessTitle }}
                </h1>
                <p class="text-surface-600 dark:text-surface-400 mb-6">
                    {{ accessMessage }}
                </p>

                <div *ngIf="technicalDetails" class="mb-8 p-4 bg-surface-100 dark:bg-surface-800 rounded-lg text-left">
                    <p class="text-sm font-medium text-surface-700 dark:text-surface-300 mb-2"><i class="pi pi-info-circle mr-2"></i>{{ 'status.accessDenied.details' | translate }}</p>
                    <code class="text-xs text-surface-600 dark:text-surface-400 block break-words">{{ technicalDetails }}</code>
                </div>

                <div class="flex gap-3 justify-center">
                    <p-button [label]="'status.accessDenied.button.dashboard' | translate" routerLink="/" icon="pi pi-home" />
                    <p-button [label]="'status.accessDenied.button.retry' | translate" (onClick)="retryAccess()" icon="pi pi-refresh" severity="secondary" [outlined]="true" />
                </div>
            </div>
        </div>
    `
})
export class AccessDenied implements OnInit {
    private route = inject(ActivatedRoute);
    private translate = inject(TranslateService);

    accessTitle = '';
    accessMessage = '';
    technicalDetails = '';

    ngOnInit() {
        // Set default translations
        this.accessTitle = this.translate.instant('status.accessDenied.title');
        this.accessMessage = this.translate.instant('status.accessDenied.message');

        // Get custom access denied message and other parameters from URL
        this.route.queryParams.subscribe((params) => {
            if (params['message']) {
                this.accessMessage = decodeURIComponent(params['message']);
            }

            if (params['title']) {
                this.accessTitle = decodeURIComponent(params['title']);
            }

            if (params['details']) {
                this.technicalDetails = decodeURIComponent(params['details']);
            }

            // Handle specific access denied causes
            if (params['cause']) {
                this.handleSpecificCause(params['cause']);
            }
        });
    }

    private handleSpecificCause(cause: string) {
        const causeKey = `status.accessDenied.causes.${cause}`;

        // Check if translation exists for this cause
        const titleKey = `${causeKey}.title`;
        const messageKey = `${causeKey}.message`;
        const detailsKey = `${causeKey}.details`;

        const title = this.translate.instant(titleKey);
        if (title !== titleKey) {
            this.accessTitle = title;
        }

        const message = this.translate.instant(messageKey);
        if (message !== messageKey) {
            this.accessMessage = message;
        }

        const details = this.translate.instant(detailsKey);
        if (details !== detailsKey) {
            this.technicalDetails = details;
        }
    }

    retryAccess() {
        window.location.reload();
    }
}
