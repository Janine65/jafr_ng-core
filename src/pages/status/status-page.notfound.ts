import { ButtonModule } from 'primeng/button';

import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
    selector: 'app-not-found',
    standalone: true,
    imports: [RouterModule, ButtonModule, TranslateModule],
    template: `
        <div class="flex items-center justify-center min-h-screen bg-surface-50 dark:bg-surface-950 px-4">
            <div class="text-center max-w-md">
                <div class="mb-6">
                    <i class="pi pi-exclamation-circle text-6xl text-yellow-500"></i>
                </div>
                <h1 class="text-4xl font-semibold text-surface-900 dark:text-surface-0 mb-4">
                    {{ 'status.notFound.title' | translate }}
                </h1>
                <p class="text-surface-600 dark:text-surface-400 mb-8">
                    {{ 'status.notFound.message' | translate }}
                </p>
                <p-button [label]="'status.notFound.button' | translate" routerLink="/" icon="pi pi-home" />
            </div>
        </div>
    `
})
export class Notfound {}
