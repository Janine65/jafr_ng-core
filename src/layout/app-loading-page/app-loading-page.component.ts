import { ProgressBarModule } from 'primeng/progressbar';

import { CommonModule } from '@angular/common';
import { Component, inject, Input, OnInit } from '@angular/core';

import { EnvironmentService } from '../../services/environment.service';

@Component({
    selector: 'app-loading-page',
    standalone: true,
    imports: [CommonModule, ProgressBarModule],
    templateUrl: './app-loading-page.component.html'
})
export class LoadingComponent implements OnInit {
    private environmentService = inject(EnvironmentService);

    @Input() message: string = '';

    ngOnInit(): void {
        if (!this.message) {
            const stage = this.environmentService.stage;
            const version = this.environmentService.getAppVersion();
            this.message = `${stage}:${version}`;
        }
    }
}
