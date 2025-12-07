import { MenuItem } from 'primeng/api';
import { BadgeModule } from 'primeng/badge';
import { StyleClassModule } from 'primeng/styleclass';

import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';

import { LayoutService } from '../app.layout.service';

@Component({
    selector: 'app-topbar',
    standalone: true,
    imports: [RouterModule, CommonModule, StyleClassModule, BadgeModule],
    templateUrl: './app-header.component.html'
})
export class AppTopbar {
    layoutService = inject(LayoutService);

    items!: MenuItem[];
    newOffertenCount = 5;
}
