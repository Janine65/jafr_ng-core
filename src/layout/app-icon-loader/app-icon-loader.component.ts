import { Component, Input, HostBinding, SimpleChanges, OnChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Component({
    selector: 'app-icon-loader',
    imports: [CommonModule],
    templateUrl: './app-icon-loader.component.html',
    styleUrl: './app-icon-loader.component.scss'
})
export class IconLoader implements OnChanges {
    private http = inject(HttpClient);
    private sanitizer = inject(DomSanitizer);

    @Input() name!: string;

    // Allow overriding default size
    @HostBinding('style.width') @Input() width: string | null = null;
    @HostBinding('style.height') @Input() height: string | null = null;

    svgIcon$: Observable<SafeHtml | null> = of(null);

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['name'] && this.name) {
            this.loadIcon();
        } else if (!this.name && changes['name']) {
            // Clear icon if name is removed
            this.svgIcon$ = of(null);
        }
    }

    private loadIcon(): void {
        const iconPath = `/assets/icons/${this.name}.svg`;

        this.svgIcon$ = this.http.get(iconPath, { responseType: 'text' }).pipe(
            map((svg) => {
                if (svg && svg.includes('<svg')) {
                    const sanitizedSvg = this.sanitizer.bypassSecurityTrustHtml(svg);
                    return sanitizedSvg;
                }
                return null; // Return null if SVG content is not valid
            }),
            catchError((_error) => {
                return of(null);
            })
        );
    }
}
