/**
 * A custom Angular pipe that bypasses Angular's built-in security sanitization for HTML content.
 *
 * @usage
 * Needed to render HTML content that is trusted as safe.
 * Angular, by default, sanitizes HTML to prevent Cross-Site Scripting (XSS) attacks.
 * This pipe tells Angular that the content is safe and should be rendered as-is.
 *
 * @example
 * ```html
 * <div [innerHTML]="safeHtmlString | safeHtml"></div>
 * ```
 */

import { inject, Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
    name: 'safeHtml',
    standalone: true
})
export class SafeHtmlPipe implements PipeTransform {
    private sanitizer = inject(DomSanitizer);

    transform(value: string): SafeHtml {
        if (value === null || value === undefined) {
            return '';
        }
        return this.sanitizer.bypassSecurityTrustHtml(value);
    }
}
